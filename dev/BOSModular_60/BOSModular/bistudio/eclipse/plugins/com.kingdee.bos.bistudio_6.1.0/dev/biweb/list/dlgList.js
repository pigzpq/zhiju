/**
 * 序事簿窗体对应的js文件
 * add by stone_zheng 2009/08/26
 */
var dimentionList;	//维度穿透的序事簿实例
function window_onload() {
	//var param = window.dialogArguments;
	//var url = param.url;
	//var uiid = param.uiid;
	//var pageId = param.pageId;
	//var r = param.r;
	var spanId = location.search.match( /(spanId\=)(.*?)&/ )[2];
	var pageId = location.search.match( /(pageId\=)(.*?)&/ )[2];
	var uiid = location.search.match( /(uiid\=)(.*?)&/ )[2];
	var url = location.search.match( /(url\=)(.*?)$/ )[2];	
	
	var row = -1;
	var column = -1;
	if(spanId=="-1")
	{
		row = location.search.match( /(row\=)(.*?)&/ )[2];
		column = location.search.match( /(column\=)(.*?)&/ )[2];
		reportCaption = location.search.match( /(reportCaption\=)(.*?)&/ )[2];
	}
	
	var r;		
	
	var post = _.compose( function( cfg ) {
		cfg.url || ( cfg.url = url );
		var json = cfg.json;
		if ( json instanceof Array ) {
			for( var i = 1; i < json.length; i++ ) {
				json[i].pageId || ( json[i].pageId = pageId );
			}
		} else {
			json.pageId || ( json.pageId = pageId );
		}
		return cfg;
	}, _.post );	
	
	//维度穿透
	if(spanId!="-1")
	{
		post( {
			async: false,
			json: {
				uiid: uiid,
				type: "action",
				actionName: "doLink",
				spanId: spanId
			},
			callback: function( ret ) {
				r = ret;
			}
		} );
	}
	else //数据穿透
	{
		post( {
			async: false,
			json: {
				uiid: uiid,
				type: "action",
				actionName: "doDataDrill",
				row:row,
				column:column,
				reportCaption:reportCaption
			},
			callback: function( ret ) {
				r = ret;
			}
		} );
	}
	//如果r未正常返回,提示链接的报表无法进行穿透
	if(!r) {
		alert("链接的主题无法进行穿透!")
		window.close();
		return;
	}
	
	dimentionList = new DataList( uiid, document, post, divList );
	dimentionList.show( r );
}

function window_onresize() {
	dimentionList && setTimeout( "dimentionList.show()", 100 );
}

function window_onunload() {
	dimentionList && dimentionList.destroy( );
}

//可以提供 主动调用来释放列表的资源，避免在unload时调用的不确定性。
function window_closeList() {
	dimentionList && dimentionList.destroy( );	
	dimentionList = null;
}
