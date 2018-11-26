/*
 * 从uilayout.js文件中抽出扩展报表的部分，方便管理
 * 
 */

function loadReport( obj ) {
	var env;
	// 获取该report相关的环境变量
	_.get( {
		url: obj.url,
		async: false,
		nocache: true,
		beforeStart: null,
		afterEnd: null,
		callback: function( r ) {
			try {
				env = eval( "(" + r + ")" );
			} catch( e ) {
				bi.portalDialog( r );
			}
		}
	} );
	if ( !env ) return;
	// 拦截post请求，注入必要的参数
	var post = obj.post = _.compose( function( cfg ) {
		cfg.url || ( cfg.url = env.url );
		var json = cfg.json;
		if ( json instanceof Array ) {
			// 编组传递
			for( var i = 1; i < json.length; i++ ) {
				json[i].pageId || ( json[i].pageId = env.pageId );
				// 对于其它报表，请求时提交额外的参数：servletType : "extReport" | "dupontReport"
				if(env.reportType) {
					if(env.reportType == "ext")
						json[i].servletType = "extReport";
				}
			}
		} else {
			// 单个传递
			json.pageId || ( json.pageId = env.pageId );
			// 对于其它报表，请求时提交额外的参数：servletType : "extReport" | "dupontReport"
			if(env.reportType) {
				if(env.reportType == "ext")
					json.servletType = "extReport";
			}
		}
		return cfg;
	}, _.post );
	obj.report = Report( obj, env, post);
	// 兼容老的主题分析
	obj.isTab() || ( uilayout = obj.report );
};

function Report( obj, env, post) {
	var urlSeparator = env.urlSeparator;
	var reportId = _.uuid();
	var uiprix = "ui", uiElements = [], strategy = [];
	var filterPanel, filterJSON, filterItems = {}, filterUIID;
	var filterSchemeItems, filterSchemeShareStrategy = "0";
	var worksheets = [], imgs = [];
	strategy.current = 0;
	var menuBar;
	if(/showMenu\=yes/.test(obj.url)){//是否显示菜单 通过obj.url 而不是 location.href
		menuBar = obj.menubar = Sue.ui.menubar( {
			parent: obj.body,
			fontColor: Sue.config.cs[9]
		} );
	}
	// 绑定ping和close操作
	window.setInterval( function() {
		post( {
			json: {
				type: "ping"
			}
		} );
	}, 300000 );
	_.bindEvent( document.body, "unload", function() {
		unRegisterAllWnd();	// 关闭所有注册的子窗体
		post( {
			json: {
				type: "close"
			}
		} );
	} );
	initLayout();
	
	function initLayout() {
		var uiInfos = [],
			contentElement = obj.body, 
			content = env.content;
		var filterString = /^filter/.test( content ) ? content.match( /^filter\:ui\:(.*?)~~/ )[1] : null;
		if ( filterString ) {
			var filterInfo = UIInfo.apply( null, filterString.split( "," ) );
			uiElements.push( _.extend( _.div(), filterInfo ) );
		}
		content = content.split( "~~" );
		filterString && content.shift();
		_.map( content, function( stgy ) {
			var strategyHeader = stgy.match( /^(.*?)\:(.*?)\:(.*?)\:(.*?)\:/ );
			var caption = strategyHeader[1],
				title = strategyHeader[2],
				memoHead = strategyHeader[3],
				memoTail = strategyHeader[4];

			var uuid = "strategy_" + reportId + "_" + _.uuid();
			var sb = [];
			// 此处设置一个可滚动的容器，高度设定为页面高度减去页签的高度，未来若页签高度改变，此处应同时被改变
			sb.push( "<div>" );
			sb.push( "<table id='layout_" + uuid + "' class='tablelayout_container' cellpadding='0' cellspacing='0'");
			menuBar? sb.push(" style='display:none;'>" ):sb.push(" style='display:none;margin-top:1px;'>" );
			sb.push( "<tr><td class=\"report_msgdiv\"><div id='" + uuid + "msgdiv' style='display:none'></div></td></tr>" );
			sb.push( "<tr><td><div id='" + uuid + "title' class='strategy_title' style='display:none'>" );
			sb.push( title );
			sb.push( "</div></td></tr>" );
			sb.push( "<tr><td class='tablelayout'><div class='slicer_field' id='slicer_" );
			sb.push( uuid );
			sb.push( "' style='display:none'");
			sb.push("></div>" );
			sb.push( "<div class='page_field' id='page_" );
			sb.push( uuid );
			sb.push( "' style='display:none'></div>" );
			// if(memoHead!="")
			{
				sb.push( "<div id='" + uuid + "memoHead' class='strategy_memo' style='display:none'>" );
				sb.push( memoHead );
				sb.push( "</div>" );
			}
			sb.push("</td></tr>" );
			stgy = stgy.substring( stgy.indexOf( ":" ) + 1 );
			var uis = stgy.split( "||" );
			for( var i = 0; i < uis.length; i++ ) {
				var info = UIInfo.apply( null, uis[i].match( /ui\:(.*)$/ )[1].split( "," ).concat( [ caption ] ) );
				uiInfos.push( info );
				sb.push( "<tr><td class='tablelayout'><div class='ui_container' id='" );
				sb.push( info.id );
				menuBar? sb.push("'></div></td></tr>" ):sb.push( "'style='padding-top:2px;'></div></td></tr>" );
				
				// i < uis.length - 1 && sb.push( "<tr><td
				// style='border-bottom:dashed 1px #aeb6ba'>&nbsp;</td></tr>" );
			}
			// if(memoTail!="")
			{
				sb.push( "<tr><td><div id='" + uuid + "memoTail' class='strategy_memo' style='display:none'>" );
				sb.push( memoTail );
				sb.push( "</div></td></tr>" );
			}
			sb.push( "</table>" );
			sb.push( "</div>" );
			strategy.push( {
				uuid: uuid,
				caption: caption,
				reportTitle:title,
				n: uis.length,
				pageCount: null,
				initialized: false
			} );
			var strategyPanel = _.div( {
				parent: contentElement,
				id: uuid,
				innerHTML: sb.join( "" )
			} );
			strategy.length > 1 && ( strategyPanel.style.display = "none" );
		} );
		
		_.map( uiInfos, function( info ) {
			uiElements.push( _.extend( _.id( info.id ), info ) );
		} );
			
		filterString ? initUI( uiElements[0] ) : initStrategy( strategy.current );
	}
	
	function UIInfo( uiid, uiname, uicaption, uitype, uistrategy ) {
		return {
			uiid: uiid,
			uiname: uiname,
			uicaption: uicaption,
			uitype: uitype,
			uistrategy: uistrategy,
			id: uiprix + uiid,
			name: uiprix + uiname
		};
	};
	
	function initUI( uies ) {
		// 解决显示过滤菜单时，再打开新报表引起的浮动菜单泄漏问题
		var pops = _.cache( "sue_popup_panels" );
		if ( pops && pops.length > 0 ) {
			for( var i = 0; i < pops.length; i++ ) {
				pops[i].hide();
			}
		}
		if( uies.uitype == "filter" ) {
			filterPanel = filterPanel || Sue.ui.panel( {
				parent: obj.body,//之前这里是document.body
				rootCSSText: "display:none;position:absolute;padding:10px;border:solid 1px #aeb6ba;border-top:none;background-color:#FFF;width:330px;z-index:51",
				popup: true
			} );
			_.cache( "filter_panel_" + uies.uiid, filterPanel );
			filterPanel.content.appendChild( uies );
			var item = {
				caption: "过滤",
				// 不出现菜单，直接执行动作。这里设置click属性，而不是menu属性
				click: function( param ) {
					var xy = _.xy( param.li );
					_.copyStyle( filterPanel.root, "left,top", [ xy.x + "px", xy.y + param.li.offsetHeight + "px" ] );
					filterPanel.show();
				}
			};
			if(menuBar){
				menuBar.append( item );
				// 关闭的时候菜单状态恢复。主要是过滤菜单是用duck typing实现的，这里必须设置一下
				filterPanel.hide = _.link( filterPanel.hide, item.menu.root.hide );
			}
			
		}
		loadUI( uies );
	};
	
	function loadUI( uies ) {
		uies instanceof Array || ( uies = [ uies ] );
		_.id( "layout_" + strategy[ strategy.current ].uuid ).style.display = "block";
		_.id( strategy[ strategy.current ].uuid ).style.display = "block";
		post( {
			json: [	"*;" ].concat( _.map( uies, function( uie ) { return { uiid: uie.uiid, type: "init" }; } ) ),
			group: true,
			onServerException: function( error, cfg, i ) {
				--i;
				uies[i].innerHTML = "服务端出现错误：" + error.message;
			},
			callback: function( r, i ) {
				// 传入的i是JSON分组的序号，而这里需要uie的序号，减一即可
				--i;
				handleUI( uies[i], r );
				if ( uies[i].uitype != "filter" ) {						
					if(env.reportType && env.reportType == "ext") {
						if(menuBar){
							addExportMenu();
						}
					} 
				}
			}
		} );
	};
	
	// 抽离出数据中的JSON代码，保存在集合中，留待稍候生成控件
	function saveJSON( ret ) {
		filterJSON = [];
		var pattern = /json\:([\w]+)(\{[\u0000-\uFFFF]*?\})json\:end/g, matcher;
		while( matcher = pattern.exec( ret ) ) {
			filterJSON.push( {
				type : matcher[1],
				json : eval( "(" + matcher[2] + ")" )
			} );
		}
		return ret.replace( pattern, "" );
	};
	
	// 根据JSON生成相应的控件
	function setJSONComponent() {
		if ( !filterJSON.length ) return;
		var json, o;
		for( var i = 0; i < filterJSON.length; i++ ) {
			o = filterJSON[i];
			json = o.json;
			if ( json.title ) json.title = _.unescapeHTML( json.title );
			if ( o.type == "FilterSelectableInputBox" && !json.showTree ) {   // 带F7选择器的输入框
				setF7( json );
			} else if ( o.type == "FilterSelectableInputBox" ) {
				setTreeF7( json );
			} else if ( o.type == "FilterDatePicker" ) {    // 日历
				setFilterDatePicker( json );
			}
		}
		filterJSON = null;
	};
	
	function setF7( json ) {
		var single = json.operator.toLowerCase() != "in",
			leftDiv = _.div( { cssText: "width:198px;height:100%" } ),
			filterHandler = function( filter, list ) {
				return function() {
					var str = filter.input.value,
						items = list.items,
						map = list.map,
						// p = new RegExp( str == "" ? ".*" : str );
						p = filter.getRegExp();
					for( var i = 0, len = items.length; i < len; i++ ) {
						map[ items[i].uuid ].style.display = p.test( items[i].caption ) ? "block" : "none";
					}
				};
			},
			leftFilter = Sue.ui.ext.filter( {
				parent: leftDiv,
				onSearch: function() {
					( this.onSearch = filterHandler( leftFilter, leftList ) )();
				},
				onEnter: function() {
					( this.onEnter = filterHandler( leftFilter, leftList ) )();
				}
			} ),
			leftList = Sue.ui.list( {
				parent: leftDiv,
				single: single
			} ),
			rightDiv = _.div( { cssText: "width:198px;height:100%" } ),
			rightFilter = Sue.ui.ext.filter( {
				parent: rightDiv,
				onSearch: function() {
					( this.onSearch = filterHandler( rightFilter, rightList ) )();
				},
				onEnter: function() {
					( this.onEnter = filterHandler( rightFilter, rightList ) )();
				}
			} ),
			rightList = Sue.ui.list( {
				parent: rightDiv
			} ),
			dualSelector = Sue.ui.ext.dualSelector( {
				left: leftDiv,
				right: rightDiv,
				gtClick: function() {
					var items = _.unhash( leftList.selected, "value" );
					if ( single && rightList.items.length > 0 ) {
						leftList.enable( rightList.items );
						rightList.remove( rightList.items );
					}
					leftList.disable( items );
					rightList.insert( items );
				},
				ltClick: function() {
					var items = _.unhash( rightList.selected, "value" );
					leftList.enable( items );
					rightList.remove( items );
				},
				gt2Click: function() {
					rightList.remove( rightList.items );
					var allItems = leftList.items;
					rightList.insert( allItems );
					leftList.disable( allItems );
				},
				lt2Click: function() {
					rightList.remove( rightList.items );
					leftList.enable( leftList.items );
				},
				okClick: function() {
					o.value = [].concat( rightList.items );
					o.caption = _.map(o.value,"caption");
					f7.input.value = _.map( rightList.items, "caption" ).join( ", " );
					dualSelector.panel.hide();
				},
				cancelClick: function() {
					leftList.enable( rightList.items );
					rightList.remove( [].concat( rightList.items ) );
					if ( o.value ) {
						var valueHash = _.hash( o.value, "value", true );
						var valueItems = _.collect( leftList.items, function( item ) {
							return valueHash[ item.value ];
						} );
						o.value && leftList.disable( valueItems );
						o.value && rightList.insert( valueItems );
					}
				},
				dragable: true
			} ),
			f7 = Sue.ui.ext.f7( {
				parent: _.id( json.id ),
				readonly: true
			} ),
			o = {
				json: json,
				type: "dual",
				value: null,
				caption: null,
				f7: f7,
				initialized: false
			};
		bi.updateToPortalStyleButton( dualSelector.panel.content );
		// 单选时将全选按钮置灰
		if ( single ) {
			var gt2 = _.select( dualSelector.panel.content, "sue", 1, "gt2" );
			var lt2 = _.select( dualSelector.panel.content, "sue", 1, "lt2" );
			gt2.disabled = true;
			lt2.disabled = true;
		}
		var dc = json.defaultCaption, dv = json.defaultValue;
		!dc && dv && ( dc = dv );
		if ( dc ) {
			dc = _.unescapeHTML( dc );
			dv = _.unescapeHTML( dv );
			var av = dv.split(",");
			var ac = dc.split(",");
			o.value = new Array(av.length);
			for(var ii=0;ii<av.length;ii++) {
				o.value[ii] = {caption:ac[ii],value:av[ii]};
			} 
// o.value = [ { caption: dc, value: dv } ];
			f7.input.value = dc;
		}
		filterItems[ "filter_item_" + json.id ] = o;
		_.bindEvent( f7.btn, "click", function() {
			if ( !o.initialized ) {
				leftList.remove(leftList.getItems(_.I));
				rightList.remove(rightList.getItems(_.I));
				if ( json.items.length ) {
					leftList.insert( json.items );
					// 装载默认值
					var itemLen = leftList.items.length;
					for( var ii = 0; ii < itemLen; ii++ ) {
						if(o.value && _.map(o.value,"value").indexOf(leftList.items[ii].value)!=-1) {
// if(dv.split(",").indexOf(leftList.items[ii].value)!=-1) {
							// 是默认值则进行装载
							var items = [leftList.items[ii]];
							rightList.insert( items );
							leftList.disable( items );
						}
					}
				} else {
					post( {
						json: {
							uiid: filterUIID,
							type: "getSqlValue",
							filterItem: json.name
						},
						onServerException: function(error)
						{
							bi.getMessageTable( {
								type: "warning",
								caption: error.message
							}, _.id( "filter_panel_msgdiv_" + filterUIID ) );							
							dualSelector.panel.hide();
							o.initialized = false;
						},
						callback: function( r ) {
							if ( r ) {
								var a = r.split( urlSeparator );
								r = [];
								for( var i = 0, len = a.length; i < len; ) {
									r.push( { caption: a[i++], value: a[i++] } );
								}
								leftList.insert( r );
								// 装载默认值
								var itemLen = leftList.items.length;
								for( var ii = 0; ii < itemLen; ii++ ) {
									if(o.value && _.map(o.value,"value").indexOf(leftList.items[ii].value)!=-1) {
// if(dv.split(",").indexOf(leftList.items[ii].value)!=-1) {
										// 是默认值则进行装载
										var items = [leftList.items[ii]];
										rightList.insert( items );
										leftList.disable( items );
									}
								}
							}
						}
					} );
				}
				o.initialized  = true;
			}
			displayF7Panel( dualSelector.panel, f7.root );
			leftList.root.style.width = rightList.root.style.width = "198px";
		} );
	};
	
	function setFilterDatePicker( json ) {
		var date = json.defaultValue ? new Date( json.defaultValue ) : new Date(),
			dp = Sue.ui.ext.datePicker( {
				date: date,
				click: function() {
					o.value = f7.input.value = _.format( "%s-%s-%s", dp.y, dp.m, dp.d );
				},
				dragable: true
			} ),
			f7 = Sue.ui.ext.f7( {
				parent: _.id( json.id ),
				readonly: true
			} ),
			o = {
				json: json,
				type: "date",
				value: null,
				f7: f7
			};
			if(json.defaultValue) {
				o.value = f7.input.value = _.format( "%s-%s-%s", 
					date.getFullYear(),
					date.getMonth() + 1,
					date.getDate() );
			}
			
		bi.updateToPortalStyleButton( dp.panel.root );
		_.bindEvent( f7.btn, "click", function() {
			displayF7Panel( dp.panel, f7.root );
		} );
		filterItems[ "filter_item_" + json.id ] = o;
	};
	
	function setTreeF7( json ) {
		var multiple = json.operator.toLowerCase() == "in";
		var panel = Sue.ui.panel( {
			parent: obj.body,//document.body
			rootCSSText: "width:400px;height:300px;position:absolute;display:none;padding:0px 0px 10px;background-color:#FFF;border:solid 1px #718BB7;z-index:52",
			popup: true,
			dragable: true
		} );
		var msgContainer = _.div( {
			parent: panel.content,
			cssText: "display:none;margin-bottom:10px;"
		} );
		var tree = Sue.ui.tree( {
			parent: _.div( { parent: panel.content, cssText: "height:280px;width:398px;overflow:auto" } )
		} );
		var Node = tree.getNodeConstructor();
		var click = multiple
		? function( node, e ) {
			e.button == 1 && displayTreeSelectorHelperMenu( node, [ e.clientX + "px", e.clientY + "px", panel.root.style.zIndex + 1 ], Node,true );
		}
		: function( node ) {
			f7.input.value = node.caption;
			o.value = [node.value];
			o.caption = [node.caption];
			panel.hide();
		};
		var lazyload = function( node, callback ) {
			post( {
				json: {
					uiid: filterUIID,
					type: "getSqlValue",
					filterItem: json.name,
					parentid: node.value.id
				},
				callback: function( r ) {
					if ( r ) {
						var a = r.split( urlSeparator );
						var i = end = 0;
						callback( function() {
							if ( end == a.length ) return;
							var nodes = [];
							end = Math.min( a.length, end + 300 );
							while( i < end ) {
								var child = Node( {
									caption: a[ i++ ],
									value: { value: a[i++], id: a[i++], isLeaf: +a[i++] },
									click: click,
									lazyload: lazyload
								} );
								multiple && ( child.check = false );
								child.value.isLeaf && delete child.lazyload;
								nodes.push( child );
							}
							return nodes;
						} );
					} else {
						callback( [] );
					}
				}
			} );
		};
		var f7 = Sue.ui.ext.f7( {
			parent: _.id( json.id ),
			readonly: true
		} );
		var o = {
			json: json,
			type: "tree",
			value: null,
			caption: null,
			f7: f7
		};
		if ( multiple ) {
			var btnField = _.div( {
				parent: panel.content,
				cssText: "margin-top:5px;padding-top:10px;text-align:right;border-top:solid 1px #718BB7"
			} );
			var btn = _.crt( "button", { innerHTML: "选择", className: "portal_button" }, btnField );
			btn.style.marginRight = "10px";
			_.bindEvent( btn, "click", function() {
				var nodes = _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
					return node.check;
				} );
				if ( !nodes.length ) {
					bi.getMessageTable( {
						type: "warning",
						caption: "您没有选择成员"
					}, msgContainer );
				} else {
					panel.hide();
					f7.input.value = _.map( nodes, "caption" ).slice( 0, 4 ).join( ", " ) + "...";
					o.value = _.map( nodes, "value" );
					o.caption = _.map( nodes, "caption" );
				}
			} );
			bi.updateToPortalStyleButton( btn );
		}
		var initialized = false;
		_.bindEvent( f7.btn, "click", function() {
			if ( !initialized ) {
				post( {
					json: {
						uiid: filterUIID,
						type: "getSqlValue",
						filterItem: json.name,
						parentid: ""
					},
					callback: function( r ) {
						if ( r ) {
							var a = r.split( urlSeparator );
							var i = end = 0;
							tree.setRoot( function() {
								if ( end == a.length ) return;
								var nodes = [];
								end = Math.min( a.length, end + 300 );
								while( i < end ) {
									var node = Node( {
										caption: a[ i++ ],
										value: { value: a[i++], id: a[i++], isLeaf: +a[i++] },
										click: click,
										lazyload: lazyload
									} );
									multiple && ( node.check = false );
									node.value.isLeaf && delete node.lazyload;
									nodes.push( node );
								}
								return nodes;
							} );
						}
					}
				} );
				initialized = true;
			}
			displayF7Panel( panel, f7.root );
		} );
		var dc = json.defaultCaption, dv = json.defaultValue;
		!dc && dv && ( dc = dv );
		if ( dc ) {
			dc = _.unescapeHTML( dc );
			dv = _.unescapeHTML( dv );
			var av = dv.split(",");
			var ac = dc.split(",");
			o.value = new Array(av.length);
			for(var ii=0;ii<av.length;ii++) {
				o.value[ii] = {caption:ac[ii],value:av[ii]};
			} 
//			o.value = [ { caption: dc, value: dv } ];
			f7.input.value = dc;
		}
		filterItems[ "filter_item_" + json.id ] = o;
	}
	
	function displayF7Panel( panel, f7root ) {
		var xy = _.xy( f7root ),
			lft = xy.x + 1, tp = xy.y + f7root.clientHeight;
		_.copyStyle( panel.root, "left,top", [ lft + "px", tp + "px" ] );
		panel.show();
		var delta = tp + panel.root.clientHeight - document.body.scrollTop - document.body.clientHeight + 10;
		// 若panel底边越界，则panel上调至与底边平齐
		if ( delta > 0 ) {
			panel.root.style.top = parseInt(panel.root.style.top) - delta;
		}
	}

	function handleUI( uie, r ) {
		var uitype = uie.uitype;
		// 处理刷新中可能产生的错误对象
		if ( r && r.error ) {
			uie.innerHTML = r.error.message;
			return;
		}
		if ( uitype == "filter" ) {
			handleFilterUI( uie, r );
			filterUIID = uie.uiid;
		} else if ( uitype == "ext_worksheet" ) {
			// 对扩展报表的表格的处理
			handleExtWorksheetUI( uie, r );
		}
	}
	
	function handleFilterUI( uie, ret ) {
		uie.innerHTML = saveJSON( ret );
		bi.updateToPortalStyleButton( uie );
		setJSONComponent();
		// 过滤菜单自动弹出的条件：
		// 1. 在普通模式下，没有页签或者过滤器所在的页签就是当前页签自动弹出
		// 2. 在全屏模式下，过滤数据需要用户手动填写的情况下
//		if ( ( ( !window.tabbedpanel || window.tabbedpanel.selected == obj ) && !opener ) || ( opener && !opener.$filterData ) ) {
//			// 过滤菜单自动弹出
//			if(menuBar){
//				var index = _.indexOf( menuBar.model, function( m ) {
//					return m.caption == "过滤";
//				} );
//				_.extractEvent( menuBar.lis[index], "mouseover" )();
//				_.extractEvent( menuBar.lis[index], "click" )();
//			}
//		}
	    doFilterForm( uie.uiid, "filter_item", "item_used" );
	};

	function handleExtWorksheetUI( uie, ret ) {
		uie.innerHTML = ret;
		handlePage( uie.uiid, uie.uistrategy );
	};
	
	function purge(d) { 
    // alert("purge");
    var a = d.attributes;// 取得DOM对象的所有事件属性
    if (a) { 
        var l = a.length; 
        for ( var i = 0; i < l; i += 1) { 
            var n = a[i].name;// 取得DOM对象事件属性的名称如onclick、onblur等
            if (typeof d[n] === 'function') { 
                d[n] = null;// 清空DOM对象事件属性的值
            } 
        } 
    } 
    a = d.childNodes;// 处理子元素
    if (a) { 
        l = a.length; 
        for (i = 0; i < l; i += 1) { 
            purge(d.childNodes[i]); 
        } 
	} 
  } 
	function handlePage( uiid, uistrategy ) {
		var pageFieldDiv = _.id( "page_" + strategy[ strategy.current ].uuid );
		if ( pageFieldDiv.loaded ) return;
		post( {
			json: {
				uiid: uiid,
				type: "action",
				actionName: "getPage"
			},
			callback: function( r ) {
				r = eval( "(" + r + ")" );
			 if(r.count==1)
			 {
				 pageFieldDiv.loaded = true;
				 pageFieldDiv.style.display="none";//隐藏它
				 return;
			 }
			 else
			 {
			 	 pageFieldDiv.style.display="block";//显示它
			 }
			var pf = Sue.ui.ext.pageFlipper( {
					parent: pageFieldDiv,
					current: r.current + 1,
					total: r.count,
					callback: function( p ) {
						post( {
							json: [
								"1,*;",
								{
									uiid: uiid,
									type: "action",
									actionName: "setPage",
									page: p - 1
								}
							].concat( getRefreshJSON( getUIIDS(), { keepRadarConfig: true } ) ),
							callback: function( r ) {
								refreshUI( r, undefined, {isRadarDialogReload:false} );								
							}
						} );
					},
					size: r.size,
					sizeHook: function( size ) {
						post( {
							json: [
								"1,*;",
								{
									uiid: uiid,
									type: "action",
									actionName: "setPerPageRows",
									rows: size
								}
							].concat( getRefreshJSON( getUIIDS() ) ),
							callback: refreshUI
						} );
					},
					sizeList:
						(env.reportType && env.reportType == "ext") ? [ 20, 30, 50, 100, 200, 500, 1000 ]: [ 10, 15, 20, 25, 50, 100, 1000 ]
				} );
			}
		} );
		pageFieldDiv.loaded = true;
	};

	// isRadarDialogReload
	function refreshUI( r, uiids, param ) {
		var errorMsg;
		var uuid = strategy[ strategy.current ].uuid;
		for( var p in r ) {
			if ( typeof r[p] == "object" && "error" in r[p] ) {
				bi.getMessageTable( {
					type: "error",
					caption: "服务端错误",
					messages: r[p].error.message
				}, _.id( uuid + "msgdiv" ) );
				break;
			}
		}
		_.id( uuid + "msgdiv" ).innerHTML = "";
		uiids = uiids || getUIIDS();
		uiids = _.$A( uiids );
		
		param = param || {};
		pagerReload = param.isPagerReload === undefined ? true : param.isPagerReload;
		
		if(pagerReload)
		{
			var slicerField = _.id( "slicer_" + strategy[ strategy.current ].uuid );
			slicerField.loaded = false;
			var pageFieldDiv = _.id( "page_" + uuid );
			purge(pageFieldDiv);
			pageFieldDiv.innerHTML = "";
			pageFieldDiv.loaded = false;
		}	
		
		for( var i = 0; i < uiids.length; i++ ) 
			handleUI( _.id( uiprix + uiids[i] ), r[ i + 2 ] );
	}	
	
	function getRefreshJSON( uiids, param ) {
		uiids = _.$A( uiids );
		var ret = _.map( uiids, function( uiid ) {
			return _.extend( { uiid: uiid, type: "refresh", withSlicer: "true" }, param || {} );
		} );
		return ret;
	}
	
	function initStrategy( current ) {
		initUI( _.map( getUIIDS(), function( uiid ) { return _.id( uiprix + uiid );	} ) );
		strategy[ current ].initialized = true;
	};
	
	function getPaper() {
		post( {
			json: {
				type: "listPaperSize"
			},
			callback: function( r ) {
				var selector = _.id( "paper_config_size" );
				selector.innerHTML = "";
				_.map( r.split( urlSeparator ), function( s ) {
					selector.options.add( new Option( s, s ) );
					s == "iso-a4" && ( selector.options[ selector.length - 1 ].selected = true );
				} );
				selector.options[ selector.length ] = new Option( "自定义", "custom" );
				_.bindEvent( selector, "change", function() {
					var v = selector.options[ selector.selectedIndex ].value;
					_.id( "paper_config_custom_tr" ).style.display = v == "custom" ? "block" : "none";
				} );
			}
		} );
		getPaper = _.Z;
	};
	
	function getPaperConfigurePanel() {
		var dialog = _.cache( "paper_config_dialog" );
		if ( !dialog ) {
			dialog = _.cache( "paper_config_dialog", Sue.ui.ext.dialog( {
				caption: "导出PDF文件设置",
				width: 395,
				height: 250,
				coveredDocuments: bi.getAllFramesDocuments()
			} ) );
			if(env.reportType && env.reportType == "ext") {
				dialog.setContent( _.loadUIT( "bi_dialog_export_config2" ) );
			}else {
				dialog.setContent( _.loadUIT( "bi_dialog_export_config" ) );
			}
			bi.updateToPortalStyleTextField( dialog.content, {
				backgroundColor: Sue.config.cs[14]
			} );
		}
		dialog.rebindButtonEvent( "确定", function() {
			var param = {
				caption: _.id( "paper_config_title" ).value,
				paperSize: _.id( "paper_config_size" ).value,
				paperWidth: _.id( "paper_config_custom_width" ).value,
				paperHeight: _.id( "paper_config_custom_height" ).value,
				IsLandScape: _.id( "paper_config_direction_vertical" ).checked ? "false" : "true",
				paperMaginLeft: _.id( "paper_config_margin_left" ).value,
				paperMaginTop: _.id( "paper_config_margin_top" ).value,
				paperMaginRight: _.id( "paper_config_margin_right" ).value,
				paperMaginBottom: _.id( "paper_config_margin_bottom" ).value
			};
			if(env.reportType && env.reportType != "ext") {
				param.showSlicer = _.id( "paper_config_slicer_show" ).checked ? "true" : "false";
			}
			exportTo( "pdf", param);
			dialog.hide();
		} );
		return ( getPaperConfigurePanel = _.K( dialog ) )();
	};
	
	function addExportMenu() {
		var pdfDialog, savePanel,previewPanel;
		menuBar.append( {
			caption: "导出",
			menu: {
				items: (
					env.useRepository
					? [/**
						 * { caption: "导出分析片段...", click: function() { var pd =
						 * new
						 * PieceDialog(obj.servletURL,getUIIDS(),getUITypes(),post);
						 * pd.showSave(); return; } }
						 */]
					: []).concat(
					[
//					{
//						caption: "导出PDF...",
//						click: function() {
//							( pdfDialog || ( pdfDialog = getPaperConfigurePanel() ) ).show();
//							_.id( "paper_config_title" ).value = strategy[ strategy.current ].caption;
//							getPaper();
//						}
//					},
					{
						caption: "导出XLS",
						click: _.bind( exportTo, this, "excel", null )
					}])
			}
		} );
		addExportMenu = _.Z;
	};

	function getUIType( uiid ) {
		var uie = _.collect( uiElements, function( e ) {
			return e.uiid == uiid;
		} )[0];
		return uie.uitype;
	}
	
	function getUITypes() {
		var uiids = getUIIDS();
		var a =[];
		for(var i=0;i<uiids.length;i++) {
			var uie = _.collect( uiElements, function( e ) {
				return e.uiid == uiids[i];
			} )[0];
			a.push(uie.uitype);
		}
		return a;
	}
	
	function exportTo( type, param ) {
		post( {
			json: _.extend( {
				type: "export",
				exportType: type,
				exportUIList: (filterUIID ? (filterUIID + ",") : "") + getUIIDS().join( "," )
			}, param ),
			callback: function( r ) {
				// 有些机器上不能正常使用window.open，这里改为用隐藏iframe的方式打开
				// 因为目标是pdf或者xls数据，ie会弹出“打开”“保存”对话框
				_.crt("iframe", {
					src: r
				}, obj.body, "display:none;height:0px;width:0px;position:absolute" );
			}
		} );
	};

	function getUIIDS( sgy ) {
		sgy || ( sgy = strategy[ strategy.current ].caption );
		var a = [];
		for( var i = 0; i < uiElements.length; i++ ) {
			uiElements[i].uistrategy == sgy && a.push( uiElements[i].uiid );
		}
		return a;
	}

	function exportFilterData( filteritem, uiid ) {
		var result = {};
		var counter = 1;
		var element = _.id( filteritem + "_" + uiid + "_" + counter );
		while( element != null ) {
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				result[ counter ] = element.value;
			} else if( element.item == 'FilterSelectableInputBox' ) {
				var o = filterItems[ "filter_item_" + element.id ];
				var value = o.value;
				var caption = o.f7.input.value;
				if ( !value ) value = [];
				result[ counter ] = {
					caption: caption.split( ", " ),
					value: _.map( value, "value" )
				};
			} else if( element.item == 'FilterDatePicker' ) {
				if( _.id( "item_used" + counter ).checked ) {
					var o = filterItems[ "filter_item_" + element.id ];
					result[ counter ] = o.f7.input.value;
				}
			}
	      	counter++;
	      	element = _.id( filteritem + "_" + uiid + "_" + counter );
		}
		window.$filterData = result;
	}
	
	function importFilterData( uiid, data ) {
		var counter = 1;
	   	var element = _.id( "filter_item_" + uiid + "_" + counter );
	   	while( element != null ) {
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				element.value = data[ counter ];
			} else if( element.item == 'FilterSelectableInputBox' ) {
				var o = filterItems[ "filter_item_" + element.id ];
				o.f7.input.value = data[ counter ].caption.join( "," );
				o.value = _.map( data[ counter ].value, function( v ) {
					return {
						value: v
					};
				} );
			} else if ( element.item == 'FilterDatePicker') {
				var o = filterItems[ "filter_item_" + element.id ];
				if ( data[ counter ] ) {
					o.value = o.f7.input.value = data[ counter ];
				}
				// 如果是必选,则将checked强制为true
				var cb = _.id( "item_used" + counter );
				cb.checked = cb.disabled || !!data[ counter ];
			}
	      	counter++;
	      	element = _.id( "filter_item_" + uiid + "_" + counter );
	   	}
	   	doFilterForm( uiid, "filter_item", "item_used" );
	}
	
	function doFilterLoad( uiid, filteritem, item_used, 
		filterSchemeName, filterSchemeValue) {
	   	var counter = 1;
	   	var element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	while( element != null ) {
			var value = filterSchemeValue.match(new RegExp("V" + (counter-1) + "=(.*?)\u0001"));
			var caption = filterSchemeValue.match(new RegExp("C" + (counter-1) + "=(.*?)\u0001"));
			var loadText = "";
			var loadValue = null;
			if(value!=null && value.length >0) 
				loadValue = value[1];
			if(caption!=null && caption.length >0) 
				loadText = caption[1];
			
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				element.value = loadText;
			} else if( element.item == 'FilterSelectableInputBox' ) {
				var o = filterItems[ "filter_item_" + element.id ];
				var captions = loadText ? loadText.split( "\2" ) : [];
				var values = loadValue ? loadValue.split( "\2" ): [];
				
				o.f7.input.value = captions.join( ", " );
				var a = [];
				for( var i = 0; i < captions.length; i++ ) {
					a.push( { caption: captions[i], value: values[i] } );
				}
				o.value = a;
				o.initialized = false;
			} else if ( element.item == 'FilterDatePicker') {
				var o = filterItems[ "filter_item_" + element.id ];
				o.value = o.f7.input.value = loadText;
				// 如果是必选,则将checked强制为true.
				if (_.id( item_used + counter ).disabled) {
					_.id( item_used + counter ).checked = true;
				} 
				else {
					if(loadText!="")
						_.id( item_used + counter ).checked = true;
					else
						_.id( item_used + counter ).checked = false;
				}
			}
	      	counter++;
	      	element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	}
	}
	
	function refreshFilter(schemeName,json,uiid,filteritem,item_used) {
		var schemeSize = filterSchemeItems.length;
		var isFind = -1;
		if(schemeSize > 0) {
			for(var i = 1; i < schemeSize; i++) {
				if(schemeName == filterSchemeItems[i].caption)	{
					isFind = i;
					break;
				}
			}
		}

		var nowValue = "" ;
	   	var counter = 1;
	   	var element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	while( element != null ) {
			nowValue += "V" + (counter - 1) + "=";	
			var value = json[ "V" + counter ];
			if (value!=undefined)
	   			nowValue += value;
	   		nowValue += "\1";
	   		nowValue += "C" + (counter - 1) + "="
	   		var caption = json[ "C" + counter ];
			if (caption!=undefined)		   		
		   		nowValue += caption;
	      	counter++;
	      	element = _.id( filteritem + "_" + uiid + "_" + counter );
			nowValue += "\1";
	   	}
		
		var selected = _.unhash( filterSchemeItems.selected, "key" )[0];
		if( isFind != -1 ) {
			filterSchemeItems[isFind].value = nowValue;
			refreshFilterSchemeMenu( uiid, selected );
		} else {
			var item = {
				caption: json[ "filterName" ],
				value: nowValue
			};
			filterSchemeItems.push( item );
			var menu = _.cache( "filter_scheme_" + uiid + "_menu" );
			menu.select( selected, false );
			menu.disable( selected, false );
			refreshFilterSchemeMenu( uiid, filterSchemeItems.length - 1 );
		}
	}
	
	function doFilterDelete( uiid ) {
		var selected = _.unhash( filterSchemeItems.selected, "key" )[0];
		if (selected == 0) {
			bi.getMessageTable( {
				type: "warning",
				caption: "不能删除默认过滤方案"
			}, _.id( "filter_panel_msgdiv_" + uiid ) );
			return false;
		}
		
		bi.confirm( {
			caption: "删除过滤方案",
			text: "您确认要删除" + filterSchemeItems[selected].caption + "吗？",
			yes: function() {
				var json = {
					uiid: uiid,
					type: "action",
					actionName: "delFilter",
					filterName: filterSchemeItems[selected].caption
				};
			   	
				post( {
					json: json,
					callback: function( r ) {
						if (r == "true") {
							bi.getMessageTable( {
								type: "info",
								caption: "删除过滤方案成功"
							}, _.id( "filter_panel_msgdiv_" + uiid ) );
							filterSchemeItems.splice( selected, 1 );
							refreshFilterSchemeMenu( uiid, selected - 1 );
							var menu = _.cache( "filter_scheme_" + uiid + "_menu" );
							var selector = _.cache( "filter_scheme_" + uiid + "_selector" );
							doFilterLoad(uiid,'filter_item','item_used', 
								filterSchemeItems[ selected - 1 ].caption,
								filterSchemeItems[ selected - 1 ].value )
							return;
						}
						// 操作失败，提示服务端返回的出错原因
						bi.getMessageTable( {
							type: "warning",
							caption: "删除过滤方案失败",
							messages: r
						}, _.id( "filter_panel_msgdiv_" + uiid ) );
					}
				} );
				return false;
			},
			no: _.Z
		} );
	}
	
	function doFilterSave( uiid, filteritem, item_used , save_as) {
		var json = {
			uiid: uiid,
			type: "action",
			actionName: "saveFilter",
			shareStrategy: filterSchemeShareStrategy
		};
	   	var counter = 1;
	   	var element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	while( element != null ) {
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				if( !element.value && element.required == "true") {
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + element.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					return false;
				} else if( element.value ) {
					json[ "V" + element.name ] = [ element.value ];
					json[ "C" + element.name ] = [ element.value ];
				}
			} else if( element.item == 'FilterSelectableInputBox' ) {
				var o = filterItems[ "filter_item_" + element.id ];
				var value = o.value;
				var caption = o.f7.input.value;
				if ( !value ) value = [];
				if( !value.length && o.json.required ) {
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + o.json.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					return false;
				} else if ( value.length ) {
					_.map( value, function( v ) {
						json[ "V" + o.json.name ] = _.map( value, "value" );
						json[ "C" + o.json.name ] = caption.split( ", " );
					} );
				}
			} else if( element.item == 'FilterDatePicker' ) {
				if( _.id( item_used + counter ).checked ) {
					var o = filterItems[ "filter_item_" + element.id ];
					var value = o.value;
					var caption = o.f7.input.value;
					if ( !value && o.json.required ) {
						bi.getMessageTable( {
							type: "warning",
							caption: "请选择" + o.json.title
						}, _.id( "filter_panel_msgdiv_" + uiid ) );
						return false;
					} else if ( value && value.length ) {
						json[ "V" + o.json.name ] = [ value ];
						json[ "C" + o.json.name ] = [ caption ];
					}
				}
			}
	      	counter++;
	      	element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	}

		var selected = _.unhash( filterSchemeItems.selected, "key" )[0];
		if(save_as || selected == 0)
		{
			var fp = _.cache( "filter_panel_" + uiid );
			fp.hide();
			bi.input( {
				caption: "保存过滤方案",
				text: "请输入过滤方案名称：",
				verify: function(filterName) {
    				var str = filterName.replace(/(^\s*)|(\s*$)/g,"");
					if( str == "" ) {
						return {
							type: "warning",
							caption: "过滤方案名称不能为空"
						}
					}
					return true;
				},
				ok: function( filterName ) {
    				var str = filterName.replace(/(^\s*)|(\s*$)/g,"");
					json[ "filterName" ] = str;
					fp.show();
					return saveFilterScheme(json,uiid,filteritem,item_used);
				},
				cancel: function() {
					fp.show();
				}
			} );
			return false;
		}
		
		json[ "filterName" ] = filterSchemeItems[ selected ].caption;
		return saveFilterScheme(json,uiid,filteritem,item_used);
	}
	
	function saveFilterScheme(json,uiid,filteritem,item_used) {
		if(json[ "filterName" ]) {
			post( {
				json: json,
				onServerException: function( error ) {
					bi.getMessageTable( {
						type: "warning",
						caption: "保存过滤方案失败",
						messages: error.message
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
				},
				callback: function( r ) {
					bi.getMessageTable( {
						type: "info",
						caption: "保存过滤方案成功"
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					refreshFilter(r,json,uiid,filteritem,item_used);
					return;
				}
			} );
		}
		return false;
	}
	
	/**
	 * 在不显示菜单的情况下，过滤器有一个以上的必须的过滤项没有值时，有需要显示过滤框
	 * 
	 * 纯属对二次开发人员友好的功能
	 */
	function showFilterUIWhenNoMenu(filterPanelUI)
	{
		var xy=_.xy(filterPanelUI.content.parentElement,obj.body);
		_.copyStyle( filterPanelUI.root, "left,top", [ xy.x + "px", xy.y+ "px" ] );
		filterPanelUI.show();
	};
	function doFilterForm( uiid, filteritem, item_used ) {
		var json = {
			uiid: uiid,
			type: "action",
			actionName: "applyFilter"
		};
	   	var counter = 1;
	   	var element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	while( element != null ) {
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				if( !element.value && element.required == "true")
				{
					if(!menuBar)
					{
						showFilterUIWhenNoMenu(filterPanel);//没有菜单的情况下，显示过滤界面
					}
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + element.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					return false;
				} else if( element.value ) {
					json[ "F" + element.name ] = [element.value];
					json[ "FC" + element.name ] = [element.value];
				}
			} else if( element.item == 'FilterSelectableInputBox' ) {
				var o = filterItems[ "filter_item_" + element.id ];
				var value = o.value;
				var caption = o.caption;
				if ( !value ) value = [];
				if( !value.length && o.json.required ) {
					// 若没有选择且该项是必选，则弹出警告框；若不是必选，不提交到服务端
					if(!menuBar)
					{
						showFilterUIWhenNoMenu(filterPanel);//没有菜单的情况下，显示过滤界面
					}
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + o.json.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					return false;
				} else if ( value.length ) {
					json[ "F" + o.json.name ] = _.map( value, "value" );
					json[ "FC" + o.json.name ] = caption;
				}
			} else if( element.item == 'FilterDatePicker' ) {
				if( _.select( filterPanel.content, "sue", 1, item_used + counter ).checked ) {				
				// if( _.id( item_used + counter ).checked ) {
					var o = filterItems[ "filter_item_" + element.id ];
					var value = o.value;
					if ( !value && o.json.required ) {
						if(!menuBar)
						{
							showFilterUIWhenNoMenu(filterPanel);//没有菜单的情况下，显示过滤界面
						}
						bi.getMessageTable( {
							type: "warning",
							caption: "请选择" + o.json.title
						}, _.id( "filter_panel_msgdiv_" + uiid ) );
						return false;
					} else if ( value && value.length ) {
						json[ "F" + o.json.name ] = [value];
						json[ "FC" + o.json.name ] = [value];
					}
				}
			}
	      	counter++;
	      	element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	}
	   exportFilterData( filteritem, uiid );
		post( {
			json: json,
			callback: function( r ) {
				filterPanel.hide();
				if(env.reportType && env.reportType == "ext") {
					// 对于扩展报表，不需要处理标题，表头，表尾。
					var pageFieldDiv = _.id( "page_" + strategy[ strategy.current ].uuid );
					if(pageFieldDiv)
					{
						pageFieldDiv.innerHTML = "";
						pageFieldDiv.loaded = false;
					}
				} 
				initStrategy( strategy.current );
			}
		} );
		return false;
	};
	
	function doAction( uiid, hName, action, target ) {
		if( hName && hName == target ) return;
		var json = {
			uiid: uiid,
			type: "action",
			actionName: action
		};
		hName && ( json.src = hName );
		target && ( json.dest = target );
		post( {
			json: [	"1,*;", json ].concat( getRefreshJSON( getUIIDS() ) ),
			callback: function( r ) {
				if ( r == "false" ) return;
				refreshUI( r );
			}
		} );
	};
	
	// 将过滤方案选择器控件注入到过滤菜单中。过滤菜单已经在xsl中定义，现在移除xsl修改代价太大，因此这样处理
	function injectFilterSchemeSelector( uiid ) {
		var container = _.id( "filter_scheme_" + uiid );
		var items = eval( container.filterItems );
		// 第一个条目没用
		items.shift();
		filterSchemeItems = items;
		refreshFilterSchemeMenu( uiid, 0 );
		setFilterPermissionMenu( uiid );
	}
	
	// 刷新过滤方案菜单
	function refreshFilterSchemeMenu( uiid, selectedIndex ) {
		var container = _.id( "filter_scheme_" + uiid );
		container.innerHTML = "";
		filterSchemeItems.selected = {};
		var items = filterSchemeItems;
		var click = function( i ) {
			selector.valueText.innerHTML = items[i].caption;
			doFilterLoad( uiid, "filter_item", "item_used", menu.items[i].caption, menu.items[i].value );
		};
		_.map( items, function( item ) {
			return _.extend( item, { click: click } );
		} );
		var	menu = Sue.ui.menu( {
			items: items,
			single: true,
			z: 52
		} );
		menu.select( selectedIndex, true );
		menu.disable( selectedIndex, true );
		var	selector = Sue.ui.ext.selectableLabel( {
			parent: container,
			caption: "方案：",
			valueCaption: items[selectedIndex].caption,
			panel: menu.root,
			color: "#000"
		} );
		var menuID = "filter_scheme_" + uiid + "_menu";
		var selectorID = "filter_scheme_" + uiid + "_selector";
		// 若之前menu和selector存在，则销毁
		var menu0 = _.cache( menuID );
		var selector0 = _.cache( selectorID );
		menu0 && _.gc( menu0.root.root );
		selector0 && _.gc( selector0.root );
		// 缓存新的menu与selector
		_.cache( menuID, menu );
		_.cache( selectorID, selector );
	}
	
	function setFilterPermissionMenu( uiid ) {
		var menu = Sue.ui.menu( {
			single: true,
			z: 52,
			items: [
				{
					caption: "按用户组织",
					value: "0",
					click: click
				},
				{
					caption: "按用户",
					value: "1",
					click: click
				},
				{
					caption: "按组织",
					value: "2",
					click: click
				}
			]
		} );
		menu.select( 0, true );
		menu.disable( 0, true );
		var selector = Sue.ui.ext.selectableLabel( {
			parent: _.id( "filter_permission_" + uiid ),
			caption: "共享策略：",
			valueCaption: "按用户组织",
			panel: menu.root,
			color: "#000"
		} );
		
		function click( i ) {
			selector.valueText.innerHTML = menu.items[i].caption;
			filterSchemeShareStrategy = menu.items[i].value;
			post( {
				json: {
					uiid: uiid,
					type: "action",
					actionName: "getFilterSchemes",
					shareStrategy: menu.items[i].value
				},
				onServerException: function( error ) {
					bi.getMessageTable( {
						type: "error",
						caption: "获取过滤方案失败",
						messages: error.message
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					filterSchemeItems = [ filterSchemeItems[0] ];
					refreshFilterSchemeMenu( uiid, 0 );
				},
				callback: function( r ) {
					var a = eval( r );
					a.unshift( filterSchemeItems[0] );
					filterSchemeItems = a;
					refreshFilterSchemeMenu( uiid, 0 );
				}
			} );
		}
	}
	
	return {
		doFilterForm: doFilterForm,
		doFilterSave: doFilterSave,
		doFilterLoad: doFilterLoad,
		doFilterDelete: doFilterDelete
	};
};

// add by stone_zheng 2009/08/20=========================================
// 以下代码用于记录和关闭与报表关联窗体
var listWnd = {};
/**
 * 注册或注销绑定在指定报表(id)上的窗体 id： 报表的唯一标识 wnd： 绑定的窗体
 */
function registerWnd( id, wnd ) {
	if( !listWnd[id] ) {
		listWnd[id] = new Array();
	}
	listWnd[id].push( wnd );
}

/**
 * 注销指定报表所有窗体
 */
function unRegisterWnd( id ) {
	var listWindows = listWnd[id]; 
	if( listWindows ) {
		for (var i = 0; i < listWindows.length; i++ ) {
			try {
				listWindows[i].closeList();	// 强制关闭List，释放服务端资源
				listWindows[i].close();
			}catch(e) {
				// do nothing 可能窗体已主动关闭或其它原因
			}
		}
		listWnd[id] = null;
	}
}

/**
 * 注销所有报表的所有打开窗体
 */
function unRegisterAllWnd( ) {
	for(var p in listWnd) {
		unregisterWnd(p);
	}
}
// /////////////////////////////////////////////////////////////////////////////
