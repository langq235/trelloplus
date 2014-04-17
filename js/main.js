
var isLoggedIn = Trello.authorized();
var getBoards = function(){
	var url = '/members/me/boards?filter=open'
	Trello.get(url, function(data){
		var boards = data
		for(var i = 0, j = boards.length; i<j; i++){
			var board = boards[i];
			var dom = $('<div class="board" action="board" data-id="'+board.id+'">'+board.name+'</div>')
			$('#boards').append(dom);
		}
	})
};
var condition = {
	date: '-7'
}
  , lastAction = null
var getNum = function(str, num){
    return parseFloat(str).toFixed(num);
};
var getDateByN = function(n){
    var today = new Date()
      , d = new Date(today.getTime() + n*24*60*60*1000);
    return (d.getYear()+1900).toString() + ('0' + (d.getMonth()+1)).slice(-2) + ('0' + d.getDate()).slice(-2);
};
var makeCardHtml = function(data){
	var date = data.dateLastActivity.split('T')[0].replace(/-/g, '')
	return ['<li>' + data.name + '</li>', date > getDateByN(condition.date)];
};
var bindEvent = function(){
	var b = $(document.body)
	  , resultDom = $('#result')
	  
	/********
	Board 相关
	***/
	b.on('click', '[action="board"]', function(){
		var dom = $(this)
		  , dataId = dom.attr('data-id')
		
		lastAction = dom
		
		dom.siblings().removeClass("selected");
		dom.addClass("selected");

		$('#lists').html('reading..');
		Trello.get('/boards/'+dataId+'/lists?cards=open&card_fields=name&fields=name', function(board){
			var html = ''
			for(var i = 0, j = board.length; i<j; i++){//lists
				var list = board[i]
				html += '<div class="list">'
				      + '	<div class="list-title" data-id="'+ list.id +'" action="list">'+list.name+'</div>'
					  + '	<ul>'
				for(var m = 0, n = list.cards.length; m<n; m++){//cards
					var card = list.cards[m]
					html += '<li data-id="'+card.id+'" action="card">'+card.name+'<a class="link" target="_blank" href="https://trello.com/c/'+card.id+'">Link</a></li>';
				}
				html += '	</ul>'
					  + '</div>'
					  + '<hr />'
			}
			$('#lists').html(html);
		});
	});
	
	/********
	List 相关
	***/
	b.on('click', '[action="list"]', function(){
		var dom = $(this)
		  , dataId = dom.attr('data-id')

		lastAction = dom
		
		$('#lists').find('.selected').removeClass("selected");
		// dom.parent().siblings().removeClass("selected");
		dom.parent().addClass("selected");

		$('#result').html('reading..')
		Trello.get('/lists/'+dataId+'?fields=name&cards=closed&card_fields=all', function(lists){
			console.log(lists);
			var cards = lists.cards
			  , html = ''
			  , mark = 0
			for(var i = 0, j = cards.length; i<j; i++){
				if(mark){
					break;
				}
				if($.isArray(cards[i])){
					for(var m = 0, n = cards[i].length; m<n; m++){
						var result = makeCardHtml(cards[i][m]);
						if(result[1]){
							html += result[0]
						}else{
							mark = 1;
						}
					}
				}else{
					var result = makeCardHtml(cards[i]);
					if(result[1]){
						html += result[0]
					}else{
						mark = 1;
					}
				}
			}
			html = '<ul>' + html + '</ul>';
			$('#result').html(html);
		});
	});

	/********
	Card 相关
	***/
	b.on('click', '[action="card"]', function(){
		var dom = $(this)
		  , dataId = dom.attr('data-id')

		lastAction = dom
		
		$('#lists').find('.selected').removeClass("selected");
		dom.siblings().removeClass("selected")
		dom.addClass("selected")

		$('#result').html('reading..')
		Trello.get('/cards/'+dataId+'/checklists?fields=all&card_fields=all', function(checklists){
			var html = ''
			for(var i = 0, j = checklists.length; i<j; i++){
				var checkItemsLength = checklists[i].checkItems.length
				  , num = 0
				for(var m = 0, n = checkItemsLength; m<n; m++){
					if(checklists[i].checkItems[m].state == 'complete'){
						num++;
					}
				}
				var percent = num / checkItemsLength * 100
				html += '<li>' + checklists[i].name + ': ' + getNum(percent, 2) +'%</li>';
			}
			html = '<ul>' + html + '</ul>';
			$('#result').html(html)
		});
	})
	
	.on('click', '[action="setDate"]', function(){
		condition.date = $(this).attr('data');
		if(lastAction){
			lastAction.trigger('click');
		}
	})

	b.
	on('click', '.link', function(e){
		e.stopPropagation();
	})
	
	/*******
	避免a和li事件冲突
	***/
	.on('mouseenter', '[action]', function(){
		$(this).addClass('focus');
	})
	.on('mouseleave', '[action]', function(){
		$(this).removeClass('focus');
	})
	
	$('.filter').on('click', 'a', function(){
		var a = $(this)
		a.siblings().removeClass("selected");
		a.addClass("selected");
	})
};
var onLoggedin = function(){
	bindEvent();
	getBoards();
};
var getBoardsHtml = function(data){

};
//入口
if(!isLoggedIn){
	var opts = {
		type: 'redirect' //default  redirect/popup
	  , interactive: true
	  , name: 'Trello+'
	  , persist: true //default is true
	  , scope:{
  	    read: true
	  }
	  , expiration: '1day'
	  , success: function(data){
	  	//do
	  	onLoggedin();
	  }
	  , error: function(data){
	  }
	}
	Trello.authorize(opts)
}else{
	//do
	onLoggedin();
}
