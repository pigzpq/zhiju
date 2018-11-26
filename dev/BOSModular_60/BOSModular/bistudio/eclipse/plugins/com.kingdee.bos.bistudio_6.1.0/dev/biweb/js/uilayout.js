// 这个方法同时在report.jsp和report_loader.htm中被使用
// report是支持页签的报表页面，因此传入的obj是tab对象
// 而report_loader是老的报表页面，传入的obj是一个JSON对象
// 区别：调用obj的isTab方法可以判断
// lzx note: report_loader用在穿透，全屏显示

function loadReport( obj,from ) {
	var env;
	// 获取该report相关的环境变量
	_.get( {
		//增加： 处理目录发布为Portlet后session的问题 2010-03-02 bruce_sha
		url: obj.url+"&from="+from,
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
					else if(env.reportType == "dupont")
						json[i].servletType = "dupontReport";
				}
			}
		} else {
			// 单个传递
			json.pageId || ( json.pageId = env.pageId );
			// 对于其它报表，请求时提交额外的参数：servletType : "extReport" | "dupontReport"
			if(env.reportType) {
				if(env.reportType == "ext")
					json.servletType = "extReport";
				else if(env.reportType == "dupont")
					json.servletType = "dupontReport";
			}
		}
		return cfg;
	}, _.post );
	obj.report = Report( obj, env, post );
	// 兼容老的主题分析
	obj.isTab() || ( uilayout = obj.report );
};

function Report( obj, env, post ) {
	var urlSeparator = env.urlSeparator;
	var reportId = _.uuid();
	var uiprix = "ui", uiElements = [], strategy = [], showMemberDrillIcon = false, showDataDrillOption = false, slicerDisplayWithMultipleRow = false;
	var swiftSelectPanel, controlMenu = {}, chartDrillPanel, worksheetDrillPanel;
	var filterPanel, filterJSON, filterItems = {}, filterUIID;
	var filterSchemeItems, filterSchemeShareStrategy = "0";
	var radarChartSettingDialog, radarDialogReload = false;
	var chartType;
	var worksheets = [], imgs = [];
	strategy.current = 0;
	var menuBar;
	var fullscreenHook;
	var predictStatus = false;	// 是否预测状态
	var btnPredict;				// 预测按纽
	var btnReset;				// 预测状态下的还原按纽
	var _dupontTree;			// 杜邦树
	if(env.reportType && env.reportType == "dupont") {	
		menuBar = obj.menubar = Sue.ui.menubar( {
			parent: obj.body,
			fontColor: Sue.config.cs[9]
		} );
		btnPredict = Sue.ui.button( {
			parent: menuBar.ul,
			type: "switch",
			caption: "预 测",
			click: function(){
				// 需要通知相应的树控件
				predictStatus = btnPredict.span.pressed;
				_dupontTree.getCustomView().setAnalysable(predictStatus);
				btnReset.span.disabled = !predictStatus;
			}
		} );
		btnReset = Sue.ui.button({
			parent: menuBar.ul,
			caption: "还 原",
			disable: true,
			click: function() {
				// 需要还原预测之前的值
				_dupontTree.getCustomView().clearAllEdited();
			}
		});
		btnReset.span.disabled = !predictStatus;
	} else {
		menuBar = obj.menubar = Sue.ui.menubar( {
			parent: obj.body,
			fontColor: Sue.config.cs[9]
		} );
		// tabbed条件下可以使用全屏功能
		if ( /fullscreen\=yes/.test( location.href ) ) {
			menuBar.append( {
				caption: "退出全屏并关闭",
				click: fullscreenHook = function() {
					window.close();
				}
			} );
			if ( opener && typeof opener.$currentStrategy == "number" ) {
				strategy.current = opener.$currentStrategy;
			}
		} else if ( obj.isTab() ) {
			menuBar.append( {
				caption: "全屏显示",
				click: fullscreenHook = function() {
					window.$currentStrategy = strategy.current;
					window.open( _.format("../html/report_loader.htm?servletURL=%s&load=%s&fullscreen=yes", obj.servletURL, obj.url ), "", "fullscreen=yes,scrollbars=yes" );
				}
			} );
		}
	
		if ( fullscreenHook ) {
			_.unbindEvent( menuBar.lis[0] );
			_.bindEvent( menuBar.lis[0], "click", fullscreenHook );
		}
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
			sb.push( "<table id='layout_" + uuid + "' class='tablelayout_container' cellpadding='0' cellspacing='0' style='display:none'>" );
			sb.push( "<tr><td class=\"report_msgdiv\"><div id='" + uuid + "msgdiv' style='display:none'></div></td></tr>" );
			sb.push( "<tr><td><div id='" + uuid + "title' class='strategy_title' style='display:none'>" );
			sb.push( title );
			sb.push( "</div></td></tr>" );
			sb.push( "<tr><td class='tablelayout'><div class='slicer_field' id='slicer_" );
			sb.push( uuid );
			sb.push( "'></div>" );
			sb.push( "<div class='page_field' id='page_" );
			sb.push( uuid );
			sb.push( "'></div>" );
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
				sb.push( "'></div></td></tr>" );
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
				parent: document.body,
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
			menuBar.append( item );
			// 关闭的时候菜单状态恢复。主要是过滤菜单是用duck typing实现的，这里必须设置一下
			filterPanel.hide = _.link( filterPanel.hide, item.menu.root.hide );
		}
		loadUI( uies );
	};
	
	function loadUI( uies ) {
		uies instanceof Array || ( uies = [ uies ] );
		_.id( "layout_" + strategy[ strategy.current ].uuid ).style.display = "block";
		_.id( strategy[ strategy.current ].uuid ).style.display = "block";
		radarChartSettingDialog && radarChartSettingDialog.destroy();
		radarChartSettingDialog = null;
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
					if ( !strategy.initialized && strategy.length > 1 ) {
						var click = function( i ) {
								// 若待切换方案没有一图一表，那么将“选项”菜单的“表图交换”禁用，否则启用
								var index = _.indexOf( menuBar.model, function( m ) { return m.caption == "选项"; } );
								menuBar.model[ index ].menu.disable( 0, strategy[ i ].n != 2 );
								_.id( strategy[ strategy.current ].uuid ).style.display = "none";
								_.id( strategy[ i ].uuid ).style.display = "block";
								strategy.current = i;
								strategy[i].initialized || initStrategy( i );
							},
							items = _.map( strategy, function( s ) {
								return {
									caption: s.caption,
									selected: false,
									click: click
								};
							} );
						_.extend( items[ strategy.current ], { selected: true, disable: true } );
						menuBar.append( {
							caption: "切换方案",
							menu: {
								items: items,
								single: true
							}
						} );
						strategy.initialized = true;
					}
					if(env.reportType && env.reportType == "ext") {
						addExportMenu();
					} else if(env.reportType && env.reportType == "dupont") {
						// 添加标题
						var uuid = strategy[ strategy.current ].uuid;						
						_.id( uuid + "title" ).style.display = "block";
					} else {
						addExportMenu();
						addOptionMenu();
						if(env.useRepository)
					   	{// 如果从bi中心进入，则显示分析片段菜单
					    	addAnalyseMenu();// 添加分析片段菜单
					   	}
						// 显示备注信息
						var uuid = strategy[ strategy.current ].uuid;
						_.id( uuid + "title" ).style.display = "block";
						_.id( uuid + "memoHead" ).style.display = "block";
						_.id( uuid + "memoTail" ).style.display = "block";
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
			var ac = dc.split(env.urlSeparator);
			o.value = new Array(av.length);
			for( var ii = 0; ii < av.length; ii++ ) {
				o.value[ii] = {caption:ac[ii],value:av[ii]};
			} 
// o.value = [ { caption: dc, value: dv } ];
			f7.input.value = ac.join(", ");	//用逗号分隔显示
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
			parent: document.body,
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
			var ac = dc.split(env.urlSeparator);
			o.value = new Array(av.length);
			for(var ii=0;ii<av.length;ii++) {
				o.value[ii] = {caption:ac[ii],value:av[ii]};
			} 
// o.value = [ { caption: dc, value: dv } ];
			f7.input.value = ac.join(", ");	//用逗号分隔显示，更直观
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
			// 雷达图的特殊处理。由于用户设置出错，要提供重新设置的机会
			if ( uitype == "chart" && chartType == "Radar" ) {
				Sue.ui.button( {
					parent: _.div( {
						parent: uie,
						cssText: "margin-top:10px"
					} ),
					caption: "设置",
					click: _.bind( displayRadarChartSettingDialog, this, uie.uiid )
				} );
			}
			return;
		}
		if ( uitype == "filter" ) {
			handleFilterUI( uie, r );
			filterUIID = uie.uiid;
		} else if ( uitype == "worksheet" ) {
			uie.$drillIcons = null;
			worksheets.push( uie );
			handleWorksheetUI( uie, r );
		} else if ( uitype == "chart" ) {
			handleChartUI( uie, r );
		} else if ( uitype == "ext_worksheet" ) {
			// 对扩展报表的表格的处理
			handleExtWorksheetUI( uie, r );
		} else if (uitype == "dupont") {
			// 对杜邦分析的展示
			handelDupontUI( uie, r );
		}
	}
	
	function handleFilterUI( uie, ret ) {
		uie.innerHTML = saveJSON( ret );
		env.useRepository && injectFilterSchemeSelector( uie.uiid );
		bi.updateToPortalStyleButton( uie );
		setJSONComponent();		
		// 在全屏模式下，过滤数据需要用户手动填写的情况下		
		if ( /fullscreen\=yes/.test( location.href ) && opener.$filterData ) {
			// 全屏的话，从母页面获取数据注入过滤器
			importFilterData( uiElements[0].uiid, opener.$filterData );
		}
	    doFilterForm( uie.uiid, "filter_item", "item_used" );
	};
	// 显示过滤菜单：
    function showFilterWin(){
    	if ( ( ( !window.tabbedpanel || window.tabbedpanel.selected == obj ) && !opener ) || ( opener && !opener.$filterData ) ) {
			// 过滤菜单自动弹出
			var index = _.indexOf( menuBar.model, function( m ) {
				return m.caption == "过滤";
			} );
			_.extractEvent( menuBar.lis[index], "mouseover" )();
			_.extractEvent( menuBar.lis[index], "click" )();
		}
    }
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
	
	
	function handleWorksheetUI( uie, ret ) {
		
		purge(uie);
		var content = handleConstraintUI( ret );

		// createWorksheetPanel(uie,content);
		uie.innerHTML = content;
		bindWorksheetExpandImage( uie );
		handleMemberDrillIcon( uie );
		handleDataDrillOption(uie);
		// if ( strategy[ strategy.current ].n == 1 ) {
		handlePage( uie.uiid, uie.uistrategy );
		// }
		handleDimensionPenetrate( uie );
		handleDataDrill(uie);
	};
	
	function handleChartUI( uie, ret ) {
		ret = handleConstraintUI( ret );
		createChartPanel2(uie,ret);
// var o = createChangeChartUI( uie.uiid , ret );
// var changeTypeDiv = o.div;
// var isRadar = o.isRadar;
// //debugger;
// createChartPanel(uie,o.div,o.ret,o.isRadar);
		
		// uie.innerHTML = o.ret;
		// uie.insertBefore( changeTypeDiv, uie.firstChild );
		// handlePage( uie.uiid, uie.uistrategy );
	};
	
	function createChartPanel2(uie,ret)
	{
		var uiid = uie.uiid;
		var panelid = "ChartPanel" + uie.uiid;
		uie.innerHTML = '<div id="'+panelid+'"/>';
		var containerid = "ChartContainer" + uie.uiid;
		var content = document.createElement("div");
		var pattern = /json\:ChangeChartType(\{[\u0000-\uFFFF]*?\})json\:end/;
		var json = eval( "(" + ret.match( pattern )[1] + ")" );
		var showChangeChartType = json.show;
		var chartType = json.type;
		var isRadar=json.type=="Radar";
		if(showChangeChartType)
			ret = ret.replace( pattern, "" ); // 去掉json段
		var chartContent = ret;
		content.innerHTML = chartContent;
        var chartConfig = _.find( content, function( e ) {
		return e.tagName && e.tagName.toLowerCase() == "chartconfig";
		}, 1 )[0];
        var w = parseInt(chartConfig.mwidth);
		var h = parseInt(chartConfig.mheight);

		content = '<div id="' + containerid + '">'+chartContent+"</div>";
		
		var chartPanel = new Ext.Panel({
			// draggable: 'true',
			collapsible : 'true',
			// autoScroll : 'true',
       	 	// title: 'dddd',
       	 	width: 2+w,
       	 	height: 37+h,
        	renderTo: Ext.get(panelid),
        	tbar: [
        		''
        	],
        	html: content
        });
        var rz = new Ext.Resizable(chartPanel.getId(),{
			wrap:true,
			pinned:true,
    		resizeChild : true,
    		width: 4+w,
    		height: 41+h,
    		minWidth:200,
        	minHeight:200,
        	dynamic:true

		});
		rz.on("resize",function(src,w,h){
				post( {
						json: [
							"1,2",
							{
								uiid: uiid,
								type: "action",
								actionName: "setSize",
								width:w-8,
								height:h-41
							}
						].concat( getRefreshJSON( uiid ) ),
						callback: function( r ) {
							refreshUI( r, uiid ,{isPagerReload:false});
						}
					} );
			
		});		
        var tb = chartPanel.getTopToolbar();
		if(showChangeChartType==true)
		{
			tb.add('<input type="text" id="changeTypeCombo'+uiid+'" size="10"/>');
			var names = "Bar,Bar_H,Bar3D,Bar3D_H,StackedBar,StackedBar_H,StackedBar3D,StackedBar3D_H,MultiPie,MultiPie_H,Line,Area,Area_H,StackedArea,StackedArea_H,BarLine,CombinedBarLine,Radar".split( "," ),
			captions = "柱状图,柱状图(水平),3D柱状图,3D柱状图(水平),叠加柱状图,叠加柱状图(水平),3D叠加柱状图,3D叠加柱状图(水平),饼图(按列),饼图(按行),折线图,区域图,区域图(水平),叠加区域图,叠加区域图(水平),柱线图,组合柱线图,雷达图".split( "," );			
			var data = [];
			var index; // 选中索引
			for(i=0;i<names.length;i++)
			{
				if(names[i]==chartType)
					index = i;
				data[i] = [names[i],captions[i]];
			}
			var store = new Ext.data.SimpleStore({
        	fields: ['name', 'caption'],
       	 	data : data
    		});
	    	var combo = new Ext.form.ComboBox({
    	    	store: store,
        		displayField:'caption',
        		typeAhead: false,
        		mode: 'local',
        		editable : false,
        		forceSelection: false,
        		triggerAction: 'all',
        		emptyText:'',
        		selectOnFocus:false,
        		minListWidth:150,
        		applyTo: "changeTypeCombo"+uiid,
        		listeners:{
                	"select":function(src,record,index){
                        chartType = names[index];
						post( {
							json: [
							"1,2",
							{
								uiid: uiid,
								type: "action",
								actionName: "changeChartType",
								chartType: chartType
							}
						].concat( getRefreshJSON( uiid ) ),
						callback: function( r ) {
							refreshUI( r, uiid ,{isPagerReload:false});
						}
					} );
                 	}
    			}
			});
			combo.setValue(captions[index]);
		}
		if(isRadar)
		{
			tb.add({
        		text : "设置",
        		handler: function(){
					 displayRadarChartSettingDialog( uiid );
        		}
        	});
		}
		
		// 注：由于ComboBox本身不支持输入值，故用两个input来模拟，其中一个不显示，一个用来输入
		tb.add('显示前N行:');
		tb.add('<input type="text" id="changeTopNValueCombo'+uiid+'" size="4" />');
		tb.add('<input type="text" style="width:0" id="changeTopNValueCombo2'+uiid+'" />');
		var n = chartConfig.topN_Value;
		var other = chartConfig.topN_Other;
		var names1 = "5,10,20,30,50,100,-1".split(","),
		captions1 = "5,10,20,30,50,100,全部".split( "," );
		var data = [];
		var index; // 选中索引
		for(i=0;i<names1.length;i++)
		{
			if(names1[i]==n)
				index = i;
			data[i] = [names1[i],captions1[i]];
		}
		var store = new Ext.data.SimpleStore({
        	fields: ['name', 'caption'],
       	 	data : data
    	});
		
		var combo = new Ext.form.ComboBox({
    	    	store: store,
        		displayField:'caption',
        		typeAhead: false,
        		mode: 'local',
        		editable : false,
        		forceSelection: false,
        		triggerAction: 'all',
        		emptyText:'',
        		fieldLabel:'',
        		selectOnFocus:false,
        		minChars:5,
        		applyTo: "changeTopNValueCombo2"+uiid,
        		listeners:{
                	"select":function(src,record,index){
                        value = names1[index];
						post( {
							json: [
							"1,2",
							{
								uiid: uiid,
								type: "action",
								actionName: "changeChartTopNValue",
								value: value
							}
							].concat( getRefreshJSON( uiid ) ),
							callback: function( r ) {
								refreshUI( r, uiid ,{isPagerReload:false});
							}
						} );
                 	}
    			}
		});
		if(index>0)
			combo.setValue(captions1[index]);
		else
			combo.setValue(n);
		
		eval("changeTopNValueCombo"+uiid).value = index>0?captions1[index]:n;
		Ext.get("changeTopNValueCombo"+uiid).on("keypress",function(event)
			{
				value = eval("changeTopNValueCombo"+uiid).value;
				if(event.keyCode==13) // 回车
				{
					if(/^[0-9]+$/.test(value))
					{
						event.cancelBubble = true;
						event.preventDefault();
						combo.disable();
						post( {
							json: [
							"1,2",
							{
								uiid: uiid,
								type: "action",
								actionName: "changeChartTopNValue",
								value: value
							}
							].concat( getRefreshJSON( uiid ) ),
							callback: function( r ) {
								refreshUI( r, uiid ,{isPagerReload:false});
								combo.enable();
							}
						} );
						
					}
					else
					{
						alert("必须输入整数");
						eval("changeTopNValueCombo"+uiid).focus();
					}
					event.returnvalue = false;
					return false;
				}
			
			}
		);

		
		var checkbox = new Ext.form.Checkbox({
			boxLabel:"汇总其它",
			checked: "true"==other
		});
		tb.add(checkbox);
		checkbox.on("check",function(src,b)
				{
					value = b?"true":"false";
					post( {
						json: [
						"1,2",
						{
							uiid: uiid,
							type: "action",
							actionName: "changeChartTopNOther",
							other: value
						}
						].concat( getRefreshJSON( uiid ) ),
						callback: function( r ) {
							refreshUI( r, uiid , {isPagerReload:false} );
						}
					} );
				}
		);		
		
		tb.add('&nbsp;&nbsp;文字排布:');
		tb.add('<input type="text" style="width:35px" id="changeCategoryLabelAllign'+uiid+'" />');
		var n = chartConfig.categoryLabelAllign;
		var names2 = "Auto,Horizon,Down45,Up45,Down90,Up90".split(","),
		captions2 = "自动,水平,斜下,斜上,向下,向上".split( "," );
		var data2 = [];
		var index=0; // 选中索引
		for(i=0;i<names2.length;i++)
		{
			if(names2[i]==n)
				index = i;
			data2[i] = [names2[i],captions2[i]];
		}
		var store2 = new Ext.data.SimpleStore({
        	fields: ['name', 'caption'],
       	 	data : data2
    	});
		
		var combo = new Ext.form.ComboBox({
    	    	store: store2,
        		displayField:'caption',
        		typeAhead: false,
        		mode: 'local',
        		editable : false,
        		forceSelection: false,
        		triggerAction: 'all',
        		emptyText:'',
        		fieldLabel:'',
        		selectOnFocus:false,
        		minChars:5,
        		applyTo: "changeCategoryLabelAllign"+uiid,
        		listeners:{
                	"select":function(src,record,index){
                        value = names2[index];
						post( {
							json: [
							"1,2",
							{
								uiid: uiid,
								type: "action",
								actionName: "setCategoryLabelAllign",
								value: value
							}
							].concat( getRefreshJSON( uiid ) ),
							callback: function( r ) {
								refreshUI( r, uiid ,{isPagerReload:false});
							}
						} );
                 	}
    			}
		});
		eval("changeCategoryLabelAllign"+uiid).value = captions2[index];
	}
	
	function createWorksheetPanel(uie,content)
	{
		var panelid = "WorkhseetPanel" + uie.uiid;
		uie.innerHTML = '<div id="'+panelid+'"/>';
		
		var tb = new Ext.Toolbar();
		
		var panel = new Ext.Panel({
			// draggable: 'true',
			// collapsible : 'true',
			autoScroll  : 'true',
       	 	// title: 'dddd',
       	 	// width: 600,
       	 	// height: 400,
        	renderTo: Ext.get(panelid),
        	tbar: tb,
        	html: content
        });
        
// tb.add(
// '-'
// );
        // var tb = panel.getTopToolbar();
// tb.add(
// {
// text:'Button w/ Menu',
// iconCls: 'bmenu', // <-- icon
// //menu: menu // assign menu by instance
// }//,
// new Ext.Toolbar.MenuButton({
// text: 'Split Button',
// handler: onButtonClick,
// tooltip: {text:'This is a QuickTip with autoHide set to false and a title',
// title:'Tip Title', autoHide:false},
// iconCls: 'blist',
// // Menus can be built/referenced by using nested menu config objects
// menu : {items: [
// {text: '<b>Bold</b>', handler: onItemClick},
// {text: '<i>Italic</i>', handler: onItemClick},
// {text: '<u>Underline</u>', handler: onItemClick}, '-',{
// text: 'Pick a Color', handler: onItemClick, menu: {
// items: [
// new Ext.menu.ColorItem({selectHandler:function(cp, color){
// Ext.example.msg('Color Selected', 'You chose {0}.', color);
// }}), '-',
// {text:'More Colors...', handler:onItemClick}
// ]
// }},
// {text: 'Extellent!', handler: onItemClick}
// ]}
// }),
// '-',
// {
// text: 'Toggle Me',
// enableToggle: true,
// toggleHandler: onItemToggle,
// pressed: true
// }
// );
	}
	

	
	
	// 态绑定展开图片的点击事件（解决界面回车的bug）
	function bindWorksheetExpandImage( uie ) {
		_.map( _.find( uie, function( e ) {
			return e && e.sue == "worksheetExpandImage";
		} ), function( img ) {
			_.bindEvent( img, "click", _.bind( doWorksheetExpand, this, uie.uiid, img.id ) );
		} );
	}
	
	function handleDataDrill( uie ) {
		var table = uie.firstChild.firstChild;
		_.bindEvent( table, "click", function() {
		
			if(showDataDrillOption!=true)
				return;

			var src = event.srcElement;
			if(src.className=="cell-odd"||src.className=="cell-even")
			{
				// alert("row:"+src.row+",column:"+src.column);
				showDataDrill(uie.uiid,src.row,src.column,strategy[strategy.current].reportTitle);
			}
		});
	}
	function handleDimensionPenetrate( uie ) {
		var dimensionLink = uie.firstChild.firstChild.dimensionLink;
		if ( !dimensionLink ) return;
		var a = dimensionLink.split("||");
		_.map( a, function( dl ) {
			var dlName = dl.match(/^(.*)@/)[1],
				dlLevel = dl.match(/@(.*?)$/)[1];
			var suffix = dlLevel == "0" ? "\\.\\[.+?\\]" : ( _.fill( "\\.\\[[^\\[\\]]+\\]", +dlLevel, "" ) + "$" );
			var ths = _.find( uie, function( e ) {
				return e.tagName
					&& e.tagName.toLowerCase() == "th"
					&& e.memberUniqueName
					&& new RegExp( "^\\[" + dlName + "\\]" + suffix ).test( e.memberUniqueName );
			} );
			_.map( ths, function( th ) {
				var linker = _.crt( "span", {
					innerHTML: th.innerText || th.textContent
				}, null, "color:blue;text-decoration:underline;cursor:pointer" );
				linker.style.marginLeft = th.lastChild.style.marginLeft;
				th.lastChild.replaceChild( linker, _.select( th, "nodeValue", 1, linker.innerHTML ) );
				_.bindEvent( linker, "click", function() {
					showDimensionPenetrate2( uie.uiid, th.spanId );
				} );
			} );
		} );
	}
	
	function showDataDrill( uiid, row, column, reportTitle) {
		var url = "../list/dlgList.htm?pageId=" + env.pageId + "&uiid=" + uiid +
			"&row=" + row +"&column=" + column + "&reportCaption=" + reportTitle + "&spanId=-1" + "&url=" + env.url ;
		var width = screen.availWidth;
		var height = screen.availHeight;
		var dlg = window.open( url, "_blank", "resizable=yes,left=0,top=0,height=" + height + ",width=" + width + 
			",status=no,toolbar=no,menubar=no,location=no");
		registerWnd( obj.url, dlg );
	}
	
	/**
	 * 采用弹出IE新窗体的方式来显示序时簿 注意：需要对该报表页面注册弹出窗，在关闭该页签时，需要关闭所有弹出的列表框。
	 */
	function showDimensionPenetrate2( uiid, spanId) {
		var url = "../list/dlgList.htm?pageId=" + env.pageId + "&uiid=" + uiid +
			"&spanId=" + spanId + "&url=" + env.url;
		var width = screen.availWidth;
		var height = screen.availHeight;
		var dlg = window.open( url, "_blank", "resizable=yes,left=0,top=0,height=" + height + ",width=" + width + 
			",status=no,toolbar=no,menubar=no,location=no");
		registerWnd( obj.url, dlg );
	}
	
	function showDimensionPenetrate( uiid, spanId ) {
		post( {
			json: {
				uiid: uiid,
				type: "action",
				actionName: "doLink",
				spanId: spanId
			},
			callback: function( r ) {
				// 换成第二种穿透的显示方式 (非模态态的对话框)
				showDimensionPenetrateUI2( uiid, r );
			}
		} );
	}
	
	/**
	 * 采用弹出对话框(非模态)方式来显示序时簿 注意：需要对该报表页面注册弹出窗，在关闭该页签时，需要关闭所有弹出的列表框。
	 */
	function showDimensionPenetrateUI2( uiid, r ) {
		var param = { uiid:uiid, r:r, post:post, obj:obj };
		var dlg = window.showModelessDialog("../list/dlgList.htm",param,
			"status:no;dialogWidth:550px;dialogHeight:410px;resizable:yes;");
		registerWnd( obj.url, dlg );
	}
	
	function showDimensionPenetrateUI( uiid, r, dialog ) {
		var o = eval( "(" + r + ")" );
		if ( !dialog ) {
			var dialog = Sue.ui.ext.dialog( {
				caption: "维度穿透",
				width: Math.max( o.width, 500 ),
				height: 400,
				closeAction: "close",
				destroyHook: function() {
					post( {
						json: {
							uiid: uiid,
							type: "action",
							actionName: "closeList",
							listId: o.listUUID
						}
					} );
				}
			} );
			dialog.content.style.cssText = "padding:10px";
		}
		dialog.setContent( _.loadUIT( "bi_dialog_dimension_penetrate" ) );
		
		f( "titleDiv" ).innerHTML = o.title;
		f( "pageHeadDiv" ).innerHTML = o.pageHead;
		var tableDiv = f( "tableDiv" );
		tableDiv.style.width = Math.max( o.width, 500 ) - 20;
		var table = Sue.ui.table( {
			parent: tableDiv,
			rootCSSText: "table-layout:fixed",
			cellCSSText: "white-space:nowrap;word-break:keep-all",
			scroll: {
				height: 180
			},
			command: {
				caption: "导出XLS",
				execute: function() {
					post( {
						json: {
							uiid: uiid,
							type: "action",
							actionName: "exportList",
							listId: o.listUUID,
							exportType: "excel"
						},
						callback: function( r ) {
							// 有些机器上不能正常使用window.open，这里改为用隐藏iframe的方式打开
							// 因为目标是pdf或者xls数据，ie会弹出“打开”“保存”对话框
							_.crt("iframe", {
								src: r
							}, obj.body, "display:none;height:0px;width:0px;position:absolute" );
						}
					} );
				}
			},
			head: _.map( o.head, function( c ) {
				return {
					caption: c,
					hook: [ {
						callback: function() {
							this.style.cursor = "pointer";
							this.value = this.innerHTML;
							this.asc = 0;
							if ( this.value == o.sortColumn ) {
								_.crt( "img", {
									src: "../img/ui-web/arrow_" + ( o.sortASC ? "up" : "down" ) + ".gif"
								}, this );
								this.asc = o.sortASC;
							}
						}
					}, {
						type: "click",
						callback: function( head, table ) {
							_.map( _.find( table.table.tr( 0 ), function( e ) {
								return e.tagName && e.tagName.toLowerCase() == "th";
							} ), function( th ) {
								th.innerHTML = th.value;
							} );
							this.asc = 1 - this.asc;
							_.crt( "img", {
								src: "../img/ui-web/arrow_" + ( this.asc ? "up" : "down" ) + ".gif"
							}, this );
							post( {
								json: {
									uiid: uiid,
									type: "action",
									actionName: "sortList",
									listId: o.listUUID,
									column: this.value,
									asc: this.asc + ""
								},
								callback: function( r ) {
									showDimensionPenetrateUI( uiid, r, dialog );
								}
							} );
						}
					} ]
				};
			} ),
			data: o.data
		} );
		tableDiv.style.height = tableDiv.clientHeight + 30 + "px";
		f( "pageTailDiv" ).innerHTML = o.pageTail;
		var pf = Sue.ui.ext.pageFlipper( {
			parent: f( "pageDiv" ),
			current: o.currentPage,
			total: o.totalPage,
			callback: function( page ) {
				post( {
					json: {
						uiid: uiid,
						type: "action",
						actionName: "setListPage",
						page: page,
						listId: o.listUUID
					},
					callback: function( r ) {
						showDimensionPenetrateUI( uiid, r, dialog );
					}
				} );
			}
		} );		
		
		function f( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
	}
	
	
	// 处理切片条,处理完把json串删除掉返回，即传入的ret被截去json返回
	function handleConstraintUI( ret ) {
		var constraintDiv = _.id( "slicer_" + strategy[ strategy.current ].uuid ); // strategy表示分析方案
		var rowFlipImage = _.crt( "img", {
			src: "../img/ui-web/toggle1.gif"
		}, null, "margin-right:10px;cursor:pointer" );
		_.bindEvent( rowFlipImage, "click", function() {
			slicerDisplayWithMultipleRow = !slicerDisplayWithMultipleRow;
			setSlicerDisplayStyle();
		} );
		var pattern = /json(\{[\u0000-\uFFFF]*?\})json\:end/g, matcher, lastType;
		if ( !constraintDiv.loaded ) {
			if ( /json(\{[\u0000-\uFFFF]*?\})json\:end/.test( ret ) ) {
				constraintDiv.innerHTML = "";
				constraintDiv.appendChild( rowFlipImage );
			}
			while( matcher = pattern.exec( ret ) ) {
				var json = eval( "(" + matcher[1] + ")" );
				if ( json.type != lastType ) {
					var lineSpan = _.crt( "span", {
						isContainer: true
					}, constraintDiv, "padding-top:10px" );
					lastType = json.type;
				}
				handleConstraint( lineSpan, json );
				constraintDiv.loaded = true;
			}
		}
		setSlicerDisplayStyle();
		return ret.replace( pattern, "" );
		
		function setSlicerDisplayStyle() {
			if ( slicerDisplayWithMultipleRow ) {
				rowFlipImage.src = "../img/ui-web/toggle3.gif";
			} else {
				rowFlipImage.src = "../img/ui-web/toggle1.gif";
			}
			_.map( _.find( constraintDiv, function( e ) {
				return e.tagName && e.tagName.toLowerCase() == "span" && e.isContainer;
			} ).slice(1), function( e ) {
				e.style.display = slicerDisplayWithMultipleRow ? "block" : "inline";
				e.style.marginLeft = slicerDisplayWithMultipleRow ? "26px" : "0px";
			} );
		}
	};
	
	function handleDataDrillOption( uie ) {
		var ths = _.find( uie, function( e ) { return e.className=="cell-even"||e.className=="cell-odd" ; } );
		for( var i = 0, len = ths.length; i < len; i++ ) {
				if(!ths[i].$style)
				  ths[i].$style = ths[i].style;
				if(showDataDrillOption)
					ths[i].style.cursor = "hand";
				else
					ths[i].style.cursor = "point";
			}
	}
	
	function handleMemberDrillIcon( uie ) {
		var icons = uie.$drillIcons;
		if ( !icons && !showMemberDrillIcon ) return;
		if ( !icons ) {
			icons = [];
			var ths = _.find( uie, function( e ) { return e.memberUniqueName && !/^\[Measures\]/.test( e.memberUniqueName ); } ),
				img = _.crt( "img", { src: "../img/ui-web/drill.gif" }, null, "display:inline;border:none;cursor:hand" ),
				icon,
				click = function() {
					function sue( id ) {
						return _.select( panel, "sue", 1, id );
					};
					// var panel = worksheetDrillPanel;
					// if ( !panel ) {
// panel = Sue.ui.panel( {
// parent: document.body,
// rootCSSText: "position:absolute;border:solid 1px
// #718BB7;background-color:#FFF;z-index:51",
// popup: true
// } );
// panel.content.innerHTML = _.loadUIT( "bi_dialog_drill_member" );
						panel = document.createElement('div');
						panel.innerHTML = _.loadUIT( "bi_dialog_drill_member" );
						var win = new Ext.Window({
							title		: '钻取',
                			layout      : 'fit',
                			width       : 300,
                			height      : 230,
                			closeAction :'hide',
                			plain       : true,
                			resizable	: false,
                			items		: [panel]
						});
		
						_.bindEvent( sue( "bi_dialog_drill_member_cancel" ), "click", function(){win.close();} );
						_.bindEvent( sue( "bi_dialog_drill_member_ok" ), "click", function() {
							var actionName = _.find( sue( "bi_dialog_drill_member_radio" ), function( e ) { return e.checked; } )[0].value;
							post( {
								json: [
									"1,*;",
									{
										uiid: uie.uiid,
										type: "action",
										actionName: actionName,
										spanId: panel.spanId
									}
								].concat( getRefreshJSON( getUIIDS() ) ),
								callback: function( r ) {
									refreshUI( r, getUIIDS() );
								}
							} );
							win.close();
						} );
						// bi.updateToPortalStyleButton( panel.root );
						// worksheetDrillPanel = panel;
					panel.spanId = this.parentNode.parentNode.spanId;
					win.show();
					
// panel.spanId = this.parentNode.parentNode.spanId;
// panel.show();
// var xy = _.xy( this );
// var x = xy.x + 3, y = xy.y + 9;
// // 判断弹出框的位置，避免越出页面边界
// if ( x + panel.root.clientWidth > document.body.clientWidth ) {
// x -= panel.root.clientWidth;
// }
// if ( y + panel.root.clientHeight > document.body.clientHeight ) {
// y -= panel.root.clientHeight;
// }
// _.copyStyle( panel.root, "left,top", [ x + "px", y + "px" ] );
					post( {
						json: {
							uiid: uie.uiid,
							type: "action",
							actionName: "getSpanInfo",
							spanId: this.parentNode.parentNode.spanId
						},
						callback: function( r ) {
							function f( uniqueName ) {
								var info = _.collect( infos, function( info ) { return info.uniqueName == uniqueName; } )[0],
									radios = _.find( sue( "bi_dialog_drill_member_radio" ), function( e ) { return e.tagName && e.tagName.toLowerCase() == "input"; } );
								for( var i = 0; i < radios.length; i++ ) {
									radios[i].disabled = radios[i].checked = false;
								}
								info.isLeaf && ( radios[0].disabled = radios[1].disabled = true );
								info.isRoot && ( radios[2].disabled = true );
								for( var i = 0; i < radios.length; i++ ) {
									if ( !radios[i].disabled ) {
										radios[i].checked = true;
										sue( "bi_dialog_drill_member_ok" ).disabled = false;
										return;
									}
								}
								sue( "bi_dialog_drill_member_ok" ).disabled = true;
							}
							var a = r.split( urlSeparator ),
								infos = [],
								current;
							for( var i = 0; i < a.length; ) {
								if ( i == a.length - 1 ) {
									current = a[i];
									break;
								}
								/^\[Measures\]/.test( a[i+1] ) ? i += 5 : infos.push( {
									name: a[i++],
									uniqueName: a[i++],
									caption: a[i++],
									isLeaf: !!( a[i++] == "1" ),
									isRoot: !!( a[i++] == "1" )
								} );
							}
							sue( "bi_dialog_drill_member_position" ).innerHTML = _.map( infos, "caption" ).join( "," );
							var td = sue( "bi_dialog_drill_member_select" );
							td.innerHTML = "";
							for( var i = 0; i < infos.length; i++ ) {
								i == current && ( td.innerHTML = infos[i].caption, f( infos[i].uniqueName ) );
							}
						}
					} );
			};
			
			for( var i = 0, len = ths.length; i < len; i++ ) {
				icon = img.cloneNode( false );
				_.bindEvent( icon, "click", click );
				ths[i].lastChild.appendChild( icon );
				icons.push( icon );
			}
			uie.$drillIcons = icons;
		}
		var visible = showMemberDrillIcon ? "visible" : "hidden";
		for( var i = 0, len = icons.length; i < len; i++ ) {
			icons[i].style.visibility = visible;
		}
	};
	
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
// if(r.count==1)
// {
// pageFieldDiv.loaded = true;
// return;
// }
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
	
	function handleConstraint( constraintDiv, json ) {
		
		// 是否可移动
		if(json.canMove=="true")
		{
			var img = _.crt( "img", { src: "../img/worksheet/menu_icon.gif" }, constraintDiv, "vertical-align:middle;cursor:hand;margin-right:5px" );
			_.bindEvent( img, "click", function() {
				createMenu( json.uiid, json.uniqueName, img );
			} );
		}
		var selector = json.type == "slicer" ? handleSlicer( json ).root : handleAxis( json ).root;
		
		constraintDiv.appendChild( selector );
		
	};
	
	
	function displayRadarChartSettingDialog( uiid ) {
		// 在数据刷新后对话框放弃缓存
		if ( radarDialogReload && radarChartSettingDialog ) {
			radarChartSettingDialog.destroy();
			radarChartSettingDialog = null;
		}
		if ( radarChartSettingDialog ) {
			radarChartSettingDialog.show();
			_.center( radarChartSettingDialog.root );
			_.select( radarChartSettingDialog.content, "sue", 1, "msgDiv" ).innerHTML = "";
			return;
		}
		var dialog = radarChartSettingDialog = Sue.ui.ext.dialog( {
			caption: "雷达图参数设置",
			width: 470,
			height: 330
		} );
		dialog.setContent( _.loadUIT( "bi_dialog_radar_setting" ) );
		dialog.addButton( "确定", function() {
			if ( targetIndex == null || !nodes[targetIndex] ) {
				warn( "您还没有选择雷达图目标值" );
				return;
			}
			if ( minIndex == null || !nodes[minIndex] ) {
				warn( "您还没有选择雷达图最差值" );
				return;
			}
			post( {
				json: [
					"1,2",
					{
						uiid: uiid,
						type: "action",
						actionName: "configRadarChart",
						targetIndex: targetIndex,
						targetValues: nodes[targetIndex].data || null,
						minIndex: minIndex,
						minValues: nodes[minIndex].data || null,
						factIndexies: _.map( _.unhash( factIndexies, "key" ), parseInt ),
						displayName: !!sue( "radar_setting1" ).checked,
						displayValue: !!sue( "radar_setting2" ).checked,
						fillBackground: !!sue( "radar_setting3" ).checked
					} ].concat( getRefreshJSON( uiid, { keepRadarConfig: true } ) ),
				callback: function( r ) {
					refreshUI( r, uiid,{isPagerReload:false} );
					// 这个刷新只刷新雷达图。因此雷达图面板不需要重新加载
					radarDialogReload = false;
				}
			} );
			dialog.hide();
			function warn( msg ) {
				bi.getMessageTable( {
					type: "warning",
					caption: msg
				}, msgDiv );
			}
		} );
		var sue = _.curry( _.select )( dialog.content, "sue", 1 );
		var treeContainer = sue( "tree_container" ),
			factBtn = sue( "factBtn" ),
			targetBtn = sue( "targetBtn" ),
			minBtn = sue( "minBtn" ),
			targetSDBtn = sue( "targetSDBtn" ),
			minSDBtn = sue( "minSDBtn" ),
			msgDiv = sue( "msgDiv" ),
			hintDiv = sue( "hintDiv" );
		var btnValue;
		_.bindEvent( factBtn, "click", function() {
			targetBtn.release();
			minBtn.release();
			btnValue = "fact";
			hintDiv.innerHTML = "请选择<b><font style='color:#008203'>实际值</font></b>，可多选";
		} );
		_.bindEvent( targetBtn, "click", function() {
			factBtn.release();
			minBtn.release();
			btnValue = "target";
			hintDiv.innerHTML = "请选择<b><font style='color:#1549B3'>目标值</font></b>，只能单选";
		} );
		_.bindEvent( minBtn, "click", function() {
			factBtn.release();
			targetBtn.release();
			btnValue = "min";
			hintDiv.innerHTML = "请选择<b><font style='color:#B3380D'>最差值</font></b>，只能单选";
		} );
		_.bindEvent( targetSDBtn, "click", function() {
			_.extractEvent( targetBtn.span, "click" )();
			displayRadarChartTargetOrMinColumnSelfDefinitionValueConfigDialog( {
				pntDialog: dialog,
				caption: "雷达图目标值录入",
				name: "目标值",
				uiid: uiid,
				save: saveInTree
			} );
		} );
		_.bindEvent( minSDBtn, "click", function() {
			_.extractEvent( minBtn.span, "click" )();
			displayRadarChartTargetOrMinColumnSelfDefinitionValueConfigDialog( {
				pntDialog: dialog,
				caption: "雷达图最差值录入",
				name: "最差值",
				uiid: uiid,
				save: saveInTree
			} );
		} );
		var btns = bi.updateToPortalStyleButton( dialog.content, "sue" );
		factBtn = btns.factBtn;
		targetBtn = btns.targetBtn;
		minBtn = btns.minBtn;
		factBtn.press();
		var positions,
			targetIndex,
			minIndex,
			factIndexies = {};
		post( {
			json: [ "*;" ].concat( _.map( [ "getColumnPositions", "getRadarTargetIndex", "getRadarMinIndex" ], function( actionName ) {
				return {
					uiid: uiid,
					type: "action",
					actionName: actionName
				};
			} ) ),
			group: true,
			callback: function( r, i ) {
				i == 1
				? ( positions = eval( r ) )
				: i == 2
					? ( targetIndex = parseInt( r ) )
					: ( minIndex = parseInt( r ), init() );
			}
		} );
		
		_.center( dialog.root );
		
		var tree = Sue.ui.tree( {
				parent: treeContainer,
				caption: "雷达图参数值",
				showSelectShadow: false
			} ),
			Node = tree.getNodeConstructor(),
			nodes = [],
			sd = 0;
		
		function init() {
			var	color;
			for( var i = 0, len = positions.length; i < len; i++ ) {
				nodes.push( Node( {
					caption: positions[i],
					captionCSSText: "color:" + ( i == targetIndex ? "#1549B3" : i == minIndex ? "#B3380D" : "#008203" ),
					value: i == targetIndex ? "target" : i == minIndex ? "min" : ( factIndexies[i] = 1, "fact" ),
					index: i,
					check: true,
					checkHook: function( node ) {
						node.check = !node.check;
						click( node );
					},
					click: click
				} ) );
			}
			tree.setRoot( nodes );
			radarDialogReload = false;
		}
		
		function click( node ) {
			if ( btnValue == "fact" ) {
				if ( node.value == "fact" ) {
					if ( node.check = !node.check ) {
						factIndexies[node.index] = 1;
					} else {
						node.value = "";
						delete factIndexies[node.index];
					}
				} else if ( node.data ) {
					// 实际值不能选择自定义类型
					bi.getMessageTable( {
						type: "warning",
						caption: "实际值不能使用自定义参数"
					}, msgDiv );
				} else {
					node.value == "target" && ( targetIndex = null );
					node.value == "min" && ( minIndex = null );
					factIndexies[node.index] = 1;
					node.value = "fact";
					node.check = true;
				}
			} else if ( btnValue == "target" ) {
				if ( node.value == "target" ) {
					node.value = "";
					node.check = false;
					targetIndex = null;
				} else {
					targetIndex = cancel( targetIndex );
					node.value == "min" && ( minIndex = null );
					node.value == "fact" && ( delete factIndexies[node.index] );
					node.value = "target";
					node.check = true;
				}
			} else if ( btnValue == "min" ) {
				if ( node.value == "min" || minIndex == node ) {
					node.value = "";
					node.check = false;
					minIndex = null;
				} else {
					minIndex = cancel( minIndex );
					node.value == "target" && ( targetIndex = null );
					node.value == "fact" && ( delete factIndexies[node.index] );
					node.value = "min";
					node.check = true;
				}
			} else {
				// 未选择的项
				node.value = btnValue;
				node.check = true;
				if ( node.data && btnValue == "fact" ) {
					// 实际值不能选择自定义类型
					bi.getMessageTable( {
						type: "warning",
						caption: "实际值不能使用自定义参数"
					}, msgDiv );
				} else if ( btnValue == "fact" ) {
					factIndexies[ node.index ] = 1;
				} else if ( btnValue == "target" ) {
					targetIndex = cancel( targetIndex );
				} else if ( btnValue == "min" ) {
					minIndex = cancel( minIndex );
				}
			}
			refresh( node );
			
			function cancel( index ) {
				if ( index != null ) {
					nodes[index].value = "";
					nodes[index].check = false;
					refresh( nodes[index] );
				}
				return node.index;
			}
		}
		
		function refresh( node ) {
			var color = !node.check
				? "#000"
				: node.value == "fact"
					? "#008203"
					: node.value == "target"
						? "#1549B3"
						: "#B3380D";
			node.setCaption( node.caption, "color:" + color );
			node.vm.setCheck( node, node.check, null );
		}
		
		// 将自定义标准值或者最差值存储入树
		function saveInTree( param ) {
			if ( param.node ) {
				param.node.data = param.data;
			} else {
				var node = Node( {
					caption: "自定义值" + ++sd,
					value: "",
					data: param.data,
					index: nodes.length,
					check: false,
					click: click,
					checkHook: function( node ) {
						node.check = !node.check;
						click( node );
					},
					dblclick: function( node ) {
						displayRadarChartTargetOrMinColumnSelfDefinitionValueConfigDialog( _.extend( param, {
							node: node
						} ) );
					}
				} );
				nodes.push( node );
				tree.setRoot( node );
				click( node );
			}
		}
	}
	
	// 显示雷达图录入自定义目标值或者最差值对话框
	function displayRadarChartTargetOrMinColumnSelfDefinitionValueConfigDialog( param ) {
		param.pntDialog.hide();
		var dialog = Sue.ui.ext.dialog( {
			caption: param.caption,
			width: 450,
			height: 390,
			closeAction: "close",
			destroyHook: function() {
				gc();
				param.pntDialog.show();
			}
		} );
		dialog.content.style.padding = "10px";
		dialog.addButton( "确定", function() {
			// 检查数据是否已经填写完整
			var zfill = false;
			var a = _.unhash( data, "value" );
			a.length = rowCount;
			for( var i = 0; i < rowCount; i++ ) {
				if ( !a[i] || a[i][2] === "" ) {
					a[i] = pdata ? pdata[i] : ( zfill = true, 0 );
				} else {
					a[i] = a[i][2];
				}
			}
			zfill
				? bi.confirm( {
					caption: param.name + "录入确认",
					text: _.format( "您录入的%s数据不完整，系统将以0填充缺失的数据，是否继续？", param.name ),
					yes: function() {
						submit();
					},
					no: _.Z,
					parentDialog: dialog
				} )
				: submit();
			
			function submit() {
				dialog.destroy();
				param.save( _.extend( param, {
					data: a
				} ) );
			}			
		} );
		_.extend( dialog.content.style, {
			padding: "10px",
			verticalAlign: "top"
		} );
		var rowCount;
		var PAGE_SIZE = 10;
		// 上一次编辑保存的数据，由参数从外部传入
		var pdata = param.data;
		// 由于涉及到翻页，这里不使用数组，而使用hash表
		var data = {};
		// 局部表格缓存
		var cache = {};
		// 取第1页表格
		loadTable( 1 );
				
		function loadTable( page ) {
			if ( cache[ page ] ) {
				dialog.content.firstChild
					? dialog.content.replaceChild( cache[ page ].node, dialog.content.firstChild )
					: dialog.setContent( cache[ page ].node );
			} else {
				// 请求行头数据
				post( {
					json: {
						uiid: param.uiid,
						type: "action",
						actionName: "getRowPositions",
						page: parseInt( page ),
						pageSize: PAGE_SIZE
					},
					callback: function( r ) {
						var o = eval( "(" + r + ")" ),
							positions = o.positions,
							index,
							a = [];
						rowCount = o.rowCount;
						var base = ( page - 1 ) * PAGE_SIZE;
						for( var i = 0, len = positions.length; i < len; i++ ) {
							index = base + i + 1;
							a.push( data[ index ] = [ index, positions[i], "" ] );
						}
						var div = _.div();
						var table = Sue.ui.table( {
							parent: div,
							rootCSSText: "width:100%;font-size:12px",
							cssText: _.format( "width:100%;font-size:12px;display:block;border:solid 1px %s;border-collapse:collapse", Sue.config.cs[4] ),
							rowSelectable: true,
							command: [
								{
									caption: "填充全部",
									execute: function() {
										var value = table.getSelectedCellContent( 2 ) || "";
										for( var row in data ) {
											data[row][2] = +value;
										}
										if ( !pdata ) {
											pdata = [];
											pdata.length = rowCount;
										}
										pdata = _.map( pdata, _.K( +value ) );
										for( var page in cache ) {
											cache[page].table.render( {
												col: 2,
												render: function( param ) {
													param.td.firstChild.innerHTML = value;
													param.td.firstChild.style.backgroundColor = "";
												}
											} );
										}
									}
								},
								{
									caption: "清空全部",
									execute: function() {
										pdata = null;
										for( var row in data ) {
											data[row][2] = "";
										}
										for( var page in cache ) {
											cache[page].table.render( {
												col: 2,
												render: function( param ) {
													param.td.firstChild.innerHTML = "";
												}
											} );
										}
									}
								}
							],
							head: [
								{
									caption: "行号",
									width: "34px"
								},
								{
									caption: "行区行数据"
								},
								{
									caption: param.name,
									width: "120px"
								}
							],
							data: a,
							renderer: {
								col: 2,
								render: function( param ) {
									var td = param.td;
									td.title = "双击进入编辑状态";
									td.style.padding = "0px";
									var div = _.div( {
										parent: param.td,
										cssText: "height:100%;padding:2px 15px 0px 0px;text-align:right"
									} );
									// 有历史数据使用历史数据
									pdata && ( div.innerHTML = a[ param.row ][2] = pdata[ base + param.row ] );
									// 双击进入编辑状态
									_.bindEvent( div, "dblclick", function() {
										td.title = "";
										_.extend( div.style, {
											textAlign: "left",
											backgroundColor: "#FFF"
										} );
										div.contentEditable = true;
										try {
											div.focus();
										} catch ( e ) {}
									} );
									// 焦点移开退出编辑状态
									_.bindEvent( div, "blur", function() {
										var value = div.innerHTML,
											invalid = value && !/^[\+\-]?(([1-9]\d*)|0)(\.\d+)?$/.test( value );
										td.title = invalid ? "无效值，请更正" : "双击进入编辑状态";
										_.extend( div.style, {
											textAlign: "right",
											backgroundColor: invalid ? "#F00" : ""
										} );
										div.contentEditable = false;
										a[ param.row ][2] = value;
									} );
									// 回车退出编辑状态
									_.bindEvent( div, "keydown", function( event ) {
										if ( event.keyCode == 13 ) {
											_.extractEvent( div, "blur" )();
											return false;
										}
									} );
								}
							}
						} );
						var pf = Sue.ui.ext.pageFlipper( {
							parent: div,
							rootCSSText: "margin:10px 0px",
							current: page,
							total: o.pageCount,
							callback: function( page ) {
								loadTable( page );
							}
						} );
						// 片段存入缓存
						cache[ page ] = {
							node: div,
							table: table
						};
						dialog.content.firstChild
							? dialog.content.replaceChild( div, dialog.content.firstChild )
							: dialog.setContent( div );
					}
				} );
			}
		}
		
		// 清除局部缓存的DOM对象
		function gc() {
			for( var p in cache ) {
				_.gc( cache[p].node );
				cache[p].node = null;
				delete cache[p].node;
				cache[p].table = null;
				delete cache[p].table;
				cache[p] = null;
			}
			cache = null;
		}
	}
	
	function handleSlicer( json ) {
		var panel = Sue.ui.panel( {
				parent: document.body,
				rootCSSText: "width:250px;position:absolute;display:none;background-color:#FFF;border:solid 1px #718BB7;padding:10px;z-index:50",
				popup: true
			} ),
			filter = Sue.ui.ext.filter( {
				parent: panel.content,
				onSearch: function() {
					if ( /^\s*$/.test( filter.input.value ) ) return;
					var r = filter.getRegExp();
					filter.setResult( _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						var match = r.test( node.caption );
						node.div.lastChild.style.backgroundColor = match ? "#CCC" : "#FFF";
						if ( match ) {
							while( node = node.parent ) node.expand();
						}
						return match;
					} ) );
				},
				onGoto: function( node ) {
					var xy = _.xy( node.div, treeContainer );
					treeContainer.scrollTop = xy.y;
				}
			} ),
			treeContainer = _.div( { parent: panel.content, cssText: "width:250px;height:150px;overflow:auto;padding-right:10px" } ),
			tree = Sue.ui.tree( {
				parent: treeContainer,
				caption: json.title
			} ),
			Node = tree.getNodeConstructor(),
			click = function( node ) {
				selector.valueText.innerHTML = node.caption;
				panel.hide();
				post( {
					json: [
						"1,*;",
						{
							uiid: json.uiid,
							type: "action",
							actionName: "changeSlicer",
							memberUniqueName: node.value
						}
					].concat( getRefreshJSON( getUIIDS() ) ),
					callback: refreshUI
				} );
			},
			lazyload = function( node, callback ) {
				post( {
					json: {
						uiid: json.uiid,
						type: "action",
						actionName: "getSlicerChildren",
						memberUniqueName: node.value
					},
					callback: function( r ) {
						var a = r.split( urlSeparator ),
							i = end = 0;
						callback( function() {
							if ( end == a.length ) return;
							var nodes = [];
							end = Math.min( a.length, end + 300 );
							while( i < end ) {
								nodes.push( Node( {
									caption: a[ i++ ],
									value: a[ i++ ],
									click: click,
									lazyload: a[ i++ ] != "0" ? null : lazyload
								} ) );
							}
							return nodes;
						} );
					}
				} );
			},
			selector = Sue.ui.ext.selectableLabel( {
				caption: json.title,
				valueCaption: json.defaultValue,
				panel: panel,
				color: "#B3380D",
				bgcolor: Sue.config.cs[7],
				click: function() {
					// 加载树根
					post( {
						json: {
							uiid: json.uiid,
							type: "action",
							actionName: "getSlicerChildren",
							hierarchyName: json.uniqueName
						},
						callback: function( r ) {
							var a = r.split( urlSeparator ),
								i = end = 0;
							tree.setRoot( function() {
								if ( end == a.length ) return;
								var nodes = [];
								end = Math.min( a.length, end + 300 );
								while( i < end ) {
									nodes.push( Node( {
										caption: a[ i++ ],
										value: a[ i++ ],
										click: click,
										lazyload: a[ i++ ] != "0" ? null : lazyload
									} ) );
								}
								return nodes;
							} );
						}
					} );
					// lazyload
					delete this.click;
				}
			} );
		
		return selector;
	};
	
	// 切片条上行和列上面的维度
	function handleAxis( json ) {
		var panel = Sue.ui.panel( {
				parent: document.body,
				rootCSSText: "width:250px;position:absolute;display:none;background-color:#FFF;border:solid 1px #718BB7;padding:10px;z-index:50",
				popup: true
			} ),
			msgContainer = _.div( {
				parent: panel.content,
				cssText: "display:none;margin-bottom:10px"
			} ),
			filter = Sue.ui.ext.filter( {
				parent: panel.content,
				onSearch: function() {
					if ( /^\s*$/.test( filter.input.value ) ) return;
					var r = filter.getRegExp();
					filter.setResult( _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						var match = r.test( node.caption );
						node.div.lastChild.style.backgroundColor = match ? "#CCC" : "#FFF";
						if ( match ) {
							while( node = node.parent ) node.expand();
						}
						return match;
					} ) );
				},
				onGoto: function( node ) {
					var xy = _.xy( node.div, treeContainer );
					treeContainer.scrollTop = xy.y;
				}
			} ),
			table = _.table( "{*}2!width:100%", panel.content ),
			treeContainer = _.div( { parent: table.td( 0, 0 ), cssText: "width:250px;height:150px;overflow:auto;padding-right:10px" } ),
			tree = Sue.ui.tree( {
				parent: treeContainer,
				caption: json.title
			} ),
			Node = tree.getNodeConstructor(),
			click = function( node, e ) {
				e.button == 1 && displayTreeSelectorHelperMenu( node, [ e.clientX + "px", e.clientY + "px", panel.root.style.zIndex + 1 ], Node );
			},
			lazyload = function( node, callback ) {
				post( {
					json: {
						uiid: json.uiid,
						type: "action",
						actionName: "getSlicerChildren",
						memberUniqueName: node.value
					},
					callback: function( r ) {
						var a = r.split( urlSeparator ),
							i = end = 0;
						callback( function() {
							if ( end == a.length ) return;
							var nodes = [];
							end = Math.min( a.length, end + 300 );
							while( i < end ) {
								nodes.push( Node( {
									uiid: json.uiid,
									caption: a[ i++ ],
									value: a[ i++ ],
									check: false,
									click: click,
									lazyload: a[ i++ ] != "0" ? null : lazyload
								} ) );
							}
							return nodes;
						} );
					}
				} );
			},
			selector = Sue.ui.ext.selectableLabel( {
				valueCaption: json.title,
				panel: panel,
				color: json.type == "axis_row" ? "#1549B3" : "#008203",
				bgcolor: Sue.config.cs[7],
				click: function() {
					var _this = this;
					post( {
						json: {
							uiid: json.uiid,
							type: "action",
							actionName: "getSlicerChildren",
							hierarchyName: json.uniqueName
						},
						callback: function( r ) {
							var a = r.split( urlSeparator ),
								i = end = 0;
							tree.setRoot( function() {
								if ( end == a.length ) return;
								var nodes = [];
								end = Math.min( a.length, end + 300 );
								while( i < end ) {
									nodes.push( Node( {
										uiid: json.uiid,
										caption: a[ i++ ],
										value: a[ i++ ],
										check: false,
										click: click,
										lazyload: a[ i++ ] != "0" ? null : lazyload
									} ) );
								}
								return nodes;
							}, function() {
								( _this.click = function() { refreshAxisMember( tree, json ) } )();
							} );
						}
					} );
				}
			} ),
			btnField = _.div( {
				parent: table.td( 1, 0 ),
				cssText: "margin-top:5px;padding-top:10px;text-align:right;border-top:solid 1px #718BB7"
			} ),
			btn = Sue.ui.button( {
				parent: btnField,
				caption: "选择",
				cssText: "margin-right:0px",
				click: function() {
					var nodes = _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						return node.check;
					} );
					if ( !nodes.length ) {
						bi.getMessageTable( {
							type: "warning",
							caption: "您没有选择成员"
						}, panel.content.firstChild );
					} else {
						panel.hide();
						post( {
							json: [
								"1,*;",
								{
									uiid: json.uiid,
									type: "action",
									actionName: "changeHierarchyMembers",
									hierarchyName: json.uniqueName,
									memberUniqueNames: _.map( nodes, "value" )
								}
							].concat( getRefreshJSON( getUIIDS() ) ),
							callback: refreshUI
						} );
					}
				}
			} );
			
		return selector;
	};
	
	// 刷新轴上当前显示的成员
	function refreshAxisMember( tree, json ) {
		// 从服务器获取成员列表
		post( {
			json: {
				uiid: json.uiid,
				type: "action",
				actionName: "getVisibleMember",
				hierarchyName: json.uniqueName
			},
			callback: function( r ) {
				var lazyloaded = {};
				// 按照成员列表设置成员的checkbox。若成员在树上还没有加载，则调用父成员惰性加载
				( function( map, parentNode ) {
					var nodes = parentNode ? parentNode.children || [] : tree.getNodes(),
						node, pnt;
					for( var i = 0, len = nodes.length; i < len; i++ ) {
						node = nodes[i];
						if ( node.check === false && map[ node.value ] ) node.vm.setCheck( node, true );
						else if ( node.check === true && !map[ node.value ] ) node.vm.setCheck( node, false );
						delete map[ node.value ];
					}
					nodes = _.hash( nodes, "value", _.I );
					for( var p in map ) {
						pnt = null;
						while( p.indexOf( "." ) != -1 && !pnt ) {
							p = p.substring( 0, p.lastIndexOf( "." ) );
							pnt = nodes[ p ];
						}
						pnt && !lazyloaded[ pnt.value ] && ( lazyloaded[ pnt.value ] = true, pnt.vm.lazyload( pnt, _.bind( arguments.callee, this, map, pnt ) ) );
					}
				} )( _.hash( r.split( urlSeparator ), _.I, true ) );
			}
		} );
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
		radarDialogReload = param.isRadarDialogReload === undefined ? true : param.isRadarDialogReload;
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
					[{
						caption: "导出PDF...",
						click: function() {
							( pdfDialog || ( pdfDialog = getPaperConfigurePanel() ) ).show();
							_.id( "paper_config_title" ).value = strategy[ strategy.current ].caption;
							getPaper();
						}
					},
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
	
	function addOptionMenu() {
		menuBar.append( {
			caption: "选项",
			menu: {
				items: [
					{
						caption: "表图交换",
						disable: strategy[ strategy.current ].n != 2,
						click: function( i, selected ) {
							var uiids = getUIIDS();
							var one = _.id( uiprix + uiids[0] ),
								onep = one.parentNode,
								two = _.id( uiprix + uiids[1] ),
								twop = two.parentNode;
							onep.removeChild( one );
							twop.removeChild( two );
							onep.appendChild( two );
							twop.appendChild( one );
						}
					}, {
						caption: "启用钻取",
						selected: false,
						click: function( i, selected ) {
							showMemberDrillIcon = selected;
							for( var i = 0; i < worksheets.length; i++ ) 
								handleMemberDrillIcon( worksheets[i] );
							// for( var i = 0; i < imgs.length; i++ )
							// imgs[i].useMap = showMemberDrillIcon ?
							// imgs[i].$useMap : "";
						}
					}, {
						caption: "启用数据穿透",
						selected: false,
						click: function( i, selected ) {
							showDataDrillOption = selected;
							for( var i = 0; i < worksheets.length; i++ ) 
								handleDataDrillOption( worksheets[i] );
						}
					}, {
						caption: "排序排名",
						click: function( i ) {
							var param = {};
							var uiids = getUIIDS();
							post({
								beforeStart: null,
								afterEnd: null,
								async: false,
								json:{
									type: "action",
									actionName: "getSortInfo",
									uiid: uiids[0]
								},
								callback:function(r){
									param = eval( "(" + r + ")" );
								}
							});
							window.showModalDialog("../sort/dlgSort.htm",param,
								"status:no;dialogWidth:500px;dialogHeight:500px;");
							if( !param.cancel ) {
								// 提交排序请求
								post( {
									json: [
										"1,*;",
										{
											type: "action",
											actionName: "doSort",
											uiid: uiids[0],
											sort: param.sort,
											sortMode: param.sortMode,
											sortParam: param.sortParam,
											sortPosition: param.sortPosition											
										}
									].concat( getRefreshJSON( getUIIDS() ) ),
									callback: refreshUI
								} );
							}
						}
					}
				]
			}
		} );		
		addOptionMenu = _.Z;
	}
	
	function addAnalyseMenu() {
		var pdfDialog, savePanel,previewPanel;
		menuBar.append( {
			caption: "分析片段",
			menu: {
				items: (
					env.useRepository
					? [ {
						caption: "导出分析片段...",
						click: function() {
							var pd = new PieceDialog(obj.servletURL,getUIIDS(),getUITypes(),post);
							pd.showSave();
							return;
						}
					} ]
					: []).concat(
					[{
						caption: "浏览分析片段...",	
						click: function() {
							var path = decodeURIComponent(obj.url.match( /repositoryPath\=(.*?)(&.*?)?$/)[1]);
							getPiece(decodeURIComponent(path));// 根据主题path取得该主题所有片段
						}
					}])
			}
		} );
		addAnalyseMenu = _.Z;
	}
	
	/**
	 * 获取当前主题的所有片段
	 */
    function getPiece(path){
    	post( {
				json: {
						type: "action",
						actionName: "getPieceByRepositoryPath",
						action:"getPieceByRepositoryPath",
						servletType:"BIWebUtil",
						id:"-1",
						path: path
					  },
				callback: function( r ) {
							displayPiece(r);// 显示片段选择窗口
						}
				} 
			);
    }
	/**
	 * 显示片段选择窗口
	 */
	var tree;
	function displayPiece(r){
		    var div = document.createElement( "div" );
		    // 构造树
		    tree = Sue.ui.tree( {
						parent: div,
						caption: "",
						getIcon: function( node, f ) {
						return node.expanded && f( "folderopen" )
						|| node.folder && f( "folder" )
						|| f( "report" );
						}
			} );
			// 构造根节点并将该根节点与树榜定
			var Node = tree.getNodeConstructor();		
		    var rootNode = Node({
							caption: "片段",
							folder: true
	        }); 
		    tree.setRoot(rootNode);
		    
		    if ( r != "empty" ) {
		    var  a= r.split( "|" ),aa;// 按"|"分解返回的字符串
			var nodes = [];
			for( var i = 0, len = a.length; i < len; i++ ) {		
				aa = a[i].split( "," );
				nodes.push( Node( {
					caption: aa[0],
					value: { id: aa[1] ,url:aa[2]},
					folder: aa[3] != "false",
					lazyload: aa[3] == "false"?null:pieceLazyload,
					click: _.Z,
					dblclick:openPieceWindow
				} ) );
			}		
			rootNode.append( nodes );// 将节点加到根节点中
		    }
	          
	        var dialog=Sue.ui.ext.dialog
	        (
	              {
		          caption: "浏览分析片段",
		          width: 300,
		          height:350,
		          top:200
		          }
		    );
		    
		    dialog.addButton("预览", function() {
		    	// 浏览片段信息
		    	var selectedNode = tree.getSelectedNode();
		    	if ( !selectedNode ) return;    
		        if(selectedNode.folder) return;
		        var nodePath=selectedNode.value.url;
                var pieceUrl = "../html/piece.htm?path=" + nodePath + "&url=" + obj.servletURL;
                window.showModalDialog( pieceUrl, null, "dialogWidth=800px;dialogHeight=600px;center=yes;help=no;status=no;scroll=yes" );
               
		    });
		    // div样式
		    div.style.padding = "10px";	  
		    div.style.backgroundColor="#FFFFFF";
		    div.style.height=270;
		    div.style.width=270;
		    div.style.position="absolute";
		    div.style.left=15;
		    div.style.top=40;
		    div.style.border="solid 1px #718BB7";
		    div.style.overflow="auto";
		    
		    dialog.setContent(div);			
	}
	function openPieceWindow(){
			// 浏览片段信息
			var selectedNode = tree.getSelectedNode();
			if ( !selectedNode ) return;    
			if(selectedNode.folder) return;
			var nodePath=selectedNode.value.url;
	        var pieceUrl = "../html/piece.htm?path=" + nodePath + "&url=" + obj.servletURL;
	        window.showModalDialog( pieceUrl, null, "dialogWidth=800px;dialogHeight=600px;center=yes;help=no;status=no;scroll=yes" );
	       
	}
	function pieceLazyload( node, callback ) {
		var path = decodeURIComponent(obj.url.match( /repositoryPath\=(.*?)(&.*?)?$/)[1]);// 获取当前主题的Path
		post( {
 			json: {
					type: "action",
					actionName: "getPieceByRepositoryPath",
					action:"getPieceByRepositoryPath",
					servletType:"BIWebUtil",
					id:node.value.id,
					path:decodeURIComponent(path)
			},
			callback: function( r ) {
				if ( r != "empty" ) {
					var nodes = [];
					var a = r.split( "|" ), aa, node;
					var Node = tree.getNodeConstructor();
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							folder: aa[3] != "false",
							click: _.Z,
							lazyload: aa[3] == "false" ?null:pieceLazyload 
						} ) ;
						nodes.push( node );
					}
					callback( nodes );
				} else {
					callback( [] );
				}
			}
		});
	}

	function getUIIDS( sgy ) {
		sgy || ( sgy = strategy[ strategy.current ].caption );
		var a = [];
		for( var i = 0; i < uiElements.length; i++ ) {
			uiElements[i].uistrategy == sgy && a.push( uiElements[i].uiid );
		}
		return a;
	}
	
	function doWorksheetExpand( uiid, spanId ) {
		post( {
			json: [
				"1,*;",
				{
					uiid: uiid,
					type: "action",
					actionName: "doExpandCollapse",
					spanId: spanId
				}
			].concat( getRefreshJSON( getUIIDS() ) ),
			callback: refreshUI
		} );
	};
	
	function doSelectRow( uiid, rownum ) {
		post( {
			json: [
				"1,*;",
				{
					uiid: uiid,
					type: "action",
					actionName: "doSelectRow",
					rownum: rownum
				}
			].concat( getRefreshJSON( getUIIDS() ) ),
			callback: refreshUI
		} );
	};
		
	var drillMemberWin;
	function doDrillThrough2( uiid, uniqueNames, captions, event ) {
		uniqueNames = _.map( uniqueNames.split( "||" ), function( uniqueName ) {
			uniqueName = unescape( uniqueName );
			return {
				uniqueName: uniqueName.substring( 0, uniqueName.length - 2 ),
				isLeaf: +uniqueName.charAt( uniqueName.length - 2 ),
				isRoot: +uniqueName.charAt( uniqueName.length - 1 )
			};
		} );
		captions = _.map( captions.split( "||" ), unescape );
		var selectorTD;		
		if(drillMemberWin&&drillMemberWin!=null)
		{
			drillMemberWin.close();
		}
			var panel = document.createElement("div");
			panel.innerHTML = _.loadUIT( "bi_dialog_drill_member" );
		  	drillMemberWin = new Ext.Window({
				title		: '钻取',
                layout      : 'fit',
                width       : 300,
                height      : 230,
                closeAction :'hide',
                plain       : true,
                resizable	: false,
                items		: [panel]
			});
			
			drillMemberWin.apanel = panel;
		
		
		function sue( id ) {
				return _.select( drillMemberWin.apanel, "sue", 1, id );
		};
		
		_.bindEvent( sue( "bi_dialog_drill_member_cancel" ), "click", function(){
			drillMemberWin.hide();
			} );
		_.bindEvent( sue( "bi_dialog_drill_member_ok" ), "click", function() {
			var actionName = _.find( sue( "bi_dialog_drill_member_radio" ), function( e ) { return e.checked; } )[0].value;
				post( {
					json: [
						"1,*;",
						{
							uiid: uiid,
							memberUniqueName: selectorTD.selector.options[ selector.selectedIndex ].value,
							type: "action",
							actionName: actionName
						}
					].concat( getRefreshJSON( getUIIDS() ) ),
					callback: refreshUI
				} );
				drillMemberWin.hide();
			} );
		
		var current = uniqueNames.length - 1;
		sue( "bi_dialog_drill_member_position" ).innerHTML = captions.join( "," );
		
		selectorTD = sue( "bi_dialog_drill_member_select" );
		selectorTD.selector = _.crt( "select", null, selectorTD);  	
		_.bindEvent( selectorTD.selector, "change", function() {
				setRadioDisabled.call( selectorTD.selector, selectorTD.uniqueNames );
			} );
		var selector = selectorTD.selector;
		selectorTD.innerHTML = "";
		selectorTD.uniqueNames = uniqueNames;
		
		selectorTD.appendChild( selector );
		for( var i = 0; i < uniqueNames.length; i++ ) {
			var option = new Option( captions[i], uniqueNames[i].uniqueName );
			selector.options.add( option );
			i == current && ( option.selected = true );
		}
		setRadioDisabled.call( selector, uniqueNames );
		
		drillMemberWin.show();		

		
		function setRadioDisabled( uniqueNames ) {
			var uniqueName = this.options[ this.selectedIndex ].value,
				o = _.collect( uniqueNames, function( o ) {
					return o.uniqueName == uniqueName;
				} )[0],
				radios = _.find( sue( "bi_dialog_drill_member_radio" ), function( e ) { return e.tagName && e.tagName.toLowerCase() == "input"; } );
			for( var i = 0; i < radios.length; i++ ) {
				radios[i].disabled = radios[i].checked = false;
			}
			o.isLeaf && ( radios[0].disabled = radios[1].disabled = true );
			o.isRoot && ( radios[2].disabled = true );
			for( var i = 0; i < radios.length; i++ ) {
				if ( !radios[i].disabled ) {
					radios[i].checked = true;
					sue( "bi_dialog_drill_member_ok" ).disabled = false;
					return;
				}
			}
			sue( "bi_dialog_drill_member_ok" ).disabled = true;
		};
				
	};
	
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
	
	function doFilterForm( uiid, filteritem, item_used ) {
		var json = {
			uiid: uiid,
			type: "action",
			actionName: "applyFilter"
		};
		// debugger;
	   	var counter = 1;
	   	var element = _.id( filteritem + "_" + uiid + "_" + counter );
	   	while( element != null ) {
			if( element.tagName.toLowerCase() == "input" && element.type == 'text' ) {
				if( !element.value && element.required == "true")
				{
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + element.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					showFilterWin();
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
					bi.getMessageTable( {
						type: "warning",
						caption: "请选择" + o.json.title
					}, _.id( "filter_panel_msgdiv_" + uiid ) );
					showFilterWin();
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
						bi.getMessageTable( {
							type: "warning",
							caption: "请选择" + o.json.title
						}, _.id( "filter_panel_msgdiv_" + uiid ) );
						showFilterWin();
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
					pageFieldDiv.innerHTML = "";
					pageFieldDiv.loaded = false;
				} else if(env.reportType && env.reportType == "dupont") {	
					// 暂时不需要其它内容.
				
				} else {
					var memoInfos = eval( r.match( /^true(.*)$/ )[1] );
					var stgy = _.hash( strategy, "caption", _.I );
					_.map( memoInfos, function( memo ) {
						var uuid = stgy[ memo.caption ].uuid;
						_.id( uuid + "title" ).innerHTML = memo.title;
						_.id( uuid + "memoHead" ).innerHTML = memo.head;
						_.id( uuid + "memoTail" ).innerHTML = memo.tail;
					} );
					_.id( "slicer_" + strategy[ strategy.current ].uuid ).loaded = false;
					var pageFieldDiv = _.id( "page_" + strategy[ strategy.current ].uuid );
					pageFieldDiv.innerHTML = "";
					pageFieldDiv.loaded = false;
					radarDialogReload = true;
					_.map( strategy, function( s ) {
						s.initialized = false;
					} );
				}
				initStrategy( strategy.current );
			}
		} );
		return false;
	};
	
	function displayTreeSelectorHelperMenu( node, xyz, Node,filter ) {
		var menu = ( function() {
			var f = function( a, check ) {
				for( var i = 0, len = a.length; i < len; i++ ) a[i].check === !check && a[i].vm.setCheck( a[i], check );
			};
			return Sue.ui.menu( {
				z: 52,
				items: [ {
					caption: "选择同级别节点",
					click: function() {
						f( menu.node.parent.children, true );
					}
				},
				{
					caption: "取消同级别节点",
					click: function() {
						f( menu.node.parent.children, false );
					}
				},
				{
					caption: "选择子节点",
					click: function() {
						var node = menu.node;
						if ( !node.children ) {
							if ( !node.lazyload ) return;
							node.vm.lazyload( node, function() {
								if ( node.children ) f( node.children, true );
							} );
						} else {
							f( node.children, true );
						}
					}
				},
				{
					caption: "取消子节点",
					click: function() {
						if ( !menu.node.children ) return;
						f( menu.node.children, false );
					}
				},
				{
					caption: "选择后代节点",
					click: function() {
						
						if(filter)
						{
							( function ( node ) {
								if ( node.lazyload ) {
									node.vm.lazyload( node, _.bind( arguments.callee, this, node ) );
								} else if ( node.children ) {
									var a = node.children;
									for( var i = 0, len = a.length; i < len; i++ ) {
										a[i].check === false && a[i].vm.setCheck( a[i], true );
										arguments.callee( a[i] );
									}
								}
							} )( menu.node );

							return;
						}
						else
						{
							// 满足招商局多层大数据量的需求做的改进算法
							digNode( menu.node );
							
							function digNode( node ) {
								if ( node.lazyload ) {
									delete node.lazyload;
									loadDescendant( node );
									node.expand();
								} else if ( node.children ) {
									node.expand();
									var a = node.children;
									for( var i = 0, len = a.length; i < len; i++ ) {
										a[i].check === false && a[i].vm.setCheck( a[i], true );
										digNode( a[i] );
									}
								}
							}			
	
							function loadDescendant( node ) {
								post( {
									json: {
										uiid: menu.node.uiid,
										type: "action",
										actionName: "getSlicerDescendant",
										memberUniqueName: node.value
									},
									callback: function( r ) {
										r = eval( "(" + r + ")" );
										if ( r.children ) {
											appendChildNode( node, r.children );
										}
									}
								} );
							}
							
							function appendChildNode( p, children ) {
								if ( !children ) return;
								var childrenNodes = _.map( children, function( child ) {
									var childNode = Node( {
										uiid: menu.node.uiid,
										caption: child.caption,
										value: child.value,
										check: true,
										click: menu.node.click
									} );
									p.append( childNode );
									return childNode;
								} );
								// 分层延时加载，防止浏览器停止JavaScript执行
								window.setTimeout( function() {
									for( var i = 0; i < children.length; i++ ) {
										children[i].children && appendChildNode( childrenNodes[i], children[i].children );
									}
								}, 50 );
							}
						}
					}
				},
				{
					caption: "取消后代节点",
					click: function() {
						if ( !menu.node.children ) return;
						f( menu.node.getAllChildren(), false );
					}
				} ]
			} );
		} )();
		menu.node = node;
		_.copyStyle( menu.root.root, "left,top,zIndex", xyz );
		menu.root.show();
	};
	
	function generateMenu( hierarchies, uiid, hName, img ) {
		var menu = controlMenu[ _.format( "control_menu_%s_%s", uiid, hName ) ] || ( function() {
			var f = _.curry( _.bind, 6 )( doAction, this, uiid, hName, "moveTo" ),
				g = _.curry( _.bind, 6 )( doAction, this, uiid, hName ),
				h = function( action ) {
					var items = [],
						names = hierarchies.names, captions = hierarchies.captions;
					for( var i = 0; i < names.length; i++ ) {
						names[i] != hName && items.push( {
							caption: captions[i],
							click: g( action, names[i] )
						} );
					}
					return { items: items };
				},
				menu = Sue.ui.menu( {
					items: [ {
						caption: "行列交换",
						click: _.bind( doAction, this, uiid, null, "swapAxis" )
					},
					{
						caption: "移动到",
						sub: {
							items: [ {
								caption: "切片",
								click: f( "slicer" )
							},
							{
								caption: "行头",
								click: f( "rows" )
							},
							{
								caption: "列头",
								click: f( "columns" )
							} ]
						}
					},
					{
						caption: "移动到前",
						sub: h( "moveBefore" )
					},
					{
						caption: "移动到后",
						sub: h( "moveAfter" )
					},
					{
						caption: "交换",
						sub: h( "swapHierarchy" )
					} ]
				} );
				return controlMenu[ _.format( "control_menu_%s_%s", uiid, hName ) ] = menu;
		} )(),
			xy = _.xy( img );
		
		menu.root.show();
		var x = xy.x;
		// 避免菜单越过页面边界
		if ( x + menu.root.root.clientWidth > document.body.clientWidth ) {
			x = x + img.clientWidth - menu.root.root.clientWidth;
		}
		_.copyStyle( menu.root.root, "left,top", [ x + "px", xy.y + img.offsetHeight + "px" ] );
	};
	
	function createMenu( uiid, hName, img ) {
		post( {
			json: {
				uiid: uiid,
				type: "action",
				actionName: "getAllHierarchy"
			},
			callback: function( r ) {
				var names = [], captions = [],
					a = r.split( urlSeparator );
				for( var i = 0; i < a.length; ) {
					names.push( a[i++] );
					captions.push( a[i++] );
				}
				var hierarchies = { names: names, captions: captions };
				( createMenu = _.bind( generateMenu, this, hierarchies ) )( uiid, hName, img );
			}
		} );
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

	// add by stone_zheng 2009/12/29=========================================
	// 以下代码用于处理杜邦客户端
	/**
	 * 生成杜邦的客户端UI
	 * 
	 * @param uie
	 * @param ret
	 *            服务端的返回串 包括：条件区 + 分析区
	 */
	function handelDupontUI( uie, ret ) {
		// 添加测试的 杜邦条件区
		var content = handleDupontConditionUI(ret);
		
		// 添加内容区
		_dupontTree = new HorizontalTree();
		var parser = new XmlParser();
		parser.parse(content);
		var view = parser.getView();
		_dupontTree.setCustomView(view);
		_dupontTree.setModel(parser.getTreeModel());
		view.setAnalysable(predictStatus);
		view.setAnalysisCallBackFun(predict);
		
		var div = _dupontTree.createUI(5, 5);
		div.style.position = "relative";
		div.style.left = 0;
		div.style.top = 0;
		uie.innerHTML = "";
		uie.appendChild(div);
	};	
	
	/**
	 * 处理杜邦的条件区 从服务端返回信息中，提取条件区的信息
	 */
	function handleDupontConditionUI( ret ) {
		var constraintDiv = _.id( "slicer_" + strategy[ strategy.current ].uuid ); // strategy表示分析方案
		var pattern = /json(\{[\u0000-\uFFFF]*?\})json\:end/g, matcher, lastType;
		if ( !constraintDiv.loaded ) {
			if ( /json(\{[\u0000-\uFFFF]*?\})json\:end/.test( ret ) ) {
				constraintDiv.innerHTML = "";
			}
			while( matcher = pattern.exec( ret ) ) {
				var json = eval( "(" + matcher[1] + ")" );
				if ( json.type != lastType ) {
					var lineSpan = _.crt( "span", {
						isContainer: true
					}, constraintDiv, "padding-top:10px" );
					lastType = json.type;
				}
				handleDupontCondition( lineSpan, json );
				constraintDiv.loaded = true;
			}
		}
		return ret.replace( pattern, "" );
	};
	
	/**
	 * 按单选和多选的不同，使用不同的选择器
	 */
	function handleDupontCondition( div, json ) {
		
		var selector = json.type == "single" ? handleSingle( json ).root : handleMulti( json ).root;
		div.appendChild( selector );
	};
	
	/**
	 * 单选的选择器
	 */
	function handleSingle( json ) {
		var panel = Sue.ui.panel( {
				parent: document.body,
				rootCSSText: "width:250px;position:absolute;display:none;background-color:#FFF;border:solid 1px #718BB7;padding:10px;z-index:50",
				popup: true
			} ),
			filter = Sue.ui.ext.filter( {
				parent: panel.content,
				onSearch: function() {
					if ( /^\s*$/.test( filter.input.value ) ) return;
					var r = filter.getRegExp();
					filter.setResult( _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						var match = r.test( node.caption );
						node.div.lastChild.style.backgroundColor = match ? "#CCC" : "#FFF";
						if ( match ) {
							while( node = node.parent ) node.expand();
						}
						return match;
					} ) );
				},
				onGoto: function( node ) {
					var xy = _.xy( node.div, treeContainer );
					treeContainer.scrollTop = xy.y;
				}
			} ),
			treeContainer = _.div( { parent: panel.content, cssText: "width:250px;height:150px;overflow:auto;padding-right:10px" } ),
			tree = Sue.ui.tree( {
				parent: treeContainer,
				caption: json.title
			} ),
			Node = tree.getNodeConstructor(),
			click = function( node ) {
				selector.valueText.innerHTML = node.caption;
				panel.hide();
				post( {
					json: [
						"1,*,",
						{
							uiid: json.uiid,
							type: "action",
							actionName: "changeDimensionMember",
							dimension: node.dim,
							members: [ node.value ],
							predictStatus: predictStatus
						}
					].concat( getDupontTreeStatus(_dupontTree, getUIIDS()))
					.concat( getRefreshJSON( getUIIDS() ) ),
					callback: function(r) {
						refreshDupontUI(r);
					}
				} );
			},
			lazyload = function( node, callback ) {
				post( {
					json: {
						uiid: json.uiid,
						type: "action",
						actionName: "getDimensionChildren",
						dimension: node.dim,
						nodeValue: node.value
					},
					callback: function( r ) {
						var a = r.split( urlSeparator ),
							i = end = 0;
						callback( function() {
							if ( end == a.length ) return;
							var nodes = [];
							end = Math.min( a.length, end + 300 );
							while( i < end ) {
								nodes.push( Node( {
									dim: a[ i++ ],
									caption: a[ i++ ],
									value: a[ i++ ],
									click: click,
									lazyload: a[ i++ ] != "0" ? null : lazyload
								} ) );
							}
							return nodes;
						} );
					}
				} );
			},
			selector = Sue.ui.ext.selectableLabel( {
				caption: json.title,
				valueCaption: json.defaultCaption,
				panel: panel,
				color: "#B3380D",
				bgcolor: Sue.config.cs[7],
				disableClick: json.canChange != "true",
				click: function() {
					// 加载树根
					post( {
						json: {
							type: "action",
							uiid: json.uiid,
							actionName: "getDimensionChildren",
							dimension: json.dimension
						},
						callback: function( r ) {
							var a = r.split( urlSeparator ),
								i = end = 0;
							tree.setRoot( function() {
								if ( end == a.length ) return;
								var nodes = [];
								end = Math.min( a.length, end + 300 );
								while( i < end ) {
									nodes.push( Node( {
										dim: a[ i++ ],
										caption: a[ i++ ],
										value: a[ i++ ],
										click: click,
										lazyload: a[ i++ ] != "0" ? null : lazyload
									} ) );
								}
								return nodes;
							} );
						}
					} );
					// lazyload
					delete this.click;
				}
			} );
		
		return selector;
	};
	
	/**
	 * 多选的选择器
	 */
	function handleMulti( json ) {
		var panel = Sue.ui.panel( {
				parent: document.body,
				rootCSSText: "width:250px;position:absolute;display:none;background-color:#FFF;border:solid 1px #718BB7;padding:10px;z-index:50",
				popup: true
			} ),
			msgContainer = _.div( {
				parent: panel.content,
				cssText: "display:none;margin-bottom:10px"
			} ),
			filter = Sue.ui.ext.filter( {
				parent: panel.content,
				onSearch: function() {
					if ( /^\s*$/.test( filter.input.value ) ) return;
					var r = filter.getRegExp();
					filter.setResult( _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						var match = r.test( node.caption );
						node.div.lastChild.style.backgroundColor = match ? "#CCC" : "#FFF";
						if ( match ) {
							while( node = node.parent ) node.expand();
						}
						return match;
					} ) );
				},
				onGoto: function( node ) {
					var xy = _.xy( node.div, treeContainer );
					treeContainer.scrollTop = xy.y;
				}
			} ),
			table = _.table( "{*}2!width:100%", panel.content ),
			treeContainer = _.div( { parent: table.td( 0, 0 ), cssText: "width:250px;height:150px;overflow:auto;padding-right:10px" } ),
			tree = Sue.ui.tree( {
				parent: treeContainer,
				caption: json.title
			} ),
			Node = tree.getNodeConstructor(),
			click = function( node, e ) {
				e.button == 1 && displayTreeSelectorHelperMenu( node, [ e.clientX + "px", e.clientY + "px", panel.root.style.zIndex + 1 ], Node );
			},
			lazyload = function( node, callback ) {
				post( {
					json: {
						uiid: json.uiid,
						type: "action",
						actionName: "getDimensionChildren",
						dimension: node.dim,
						nodeValue: node.value
					},
					callback: function( r ) {
						var a = r.split( urlSeparator ),
							i = end = 0;
						callback( function() {
							if ( end == a.length ) return;
							var nodes = [];
							end = Math.min( a.length, end + 300 );
							while( i < end ) {
								nodes.push( Node( {
									uiid: json.uiid,
									dim: a[ i++ ],
									caption: a[ i++ ],
									value: a[ i++ ],
									check: false,
									click: click,
									lazyload: a[ i++ ] != "0" ? null : lazyload
								} ) );
							}
							return nodes;
						} );
					}
				} );
			},
			selector = Sue.ui.ext.selectableLabel( {
				caption: json.title,
				valueCaption: json.defaultCaption.split(urlSeparator).join(","),
				panel: panel,
				color: json.type == "axis_row" ? "#1549B3" : "#008203",
				bgcolor: Sue.config.cs[7],
				disableClick: json.canChange != "true",
				click: function() {
					var _this = this;
					post( {
						json: {
							uiid: json.uiid,
							type: "action",
							actionName: "getDimensionChildren",
							dimension: json.dimension							
						},
						callback: function( r ) {
							var a = r.split( urlSeparator ),
								i = end = 0;
							tree.setRoot( function() {
								if ( end == a.length ) return;
								var nodes = [];
								end = Math.min( a.length, end + 300 );
								while( i < end ) {
									nodes.push( Node( {
										uiid: json.uiid,
										dim: a[ i++ ],										
										caption: a[ i++ ],
										value: a[ i++ ],
										check: false,
										click: click,
										lazyload: a[ i++ ] != "0" ? null : lazyload
									} ) );
								}
								return nodes;
							}
							);
						}
					} );
					// lazyload
					delete this.click;
				}
			} ),
			btnField = _.div( {
				parent: table.td( 1, 0 ),
				cssText: "margin-top:5px;padding-top:10px;text-align:right;border-top:solid 1px #718BB7"
			} ),
			btn = Sue.ui.button( {
				parent: btnField,
				caption: "选择",
				cssText: "margin-right:0px",
				click: function() {
					var nodes = _.collect( tree.root.getAllChildren( "dfs" ), function( node ) {
						return node.check;
					} );
					if ( !nodes.length ) {
						bi.getMessageTable( {
							type: "warning",
							caption: "您没有选择成员"
						}, panel.content.firstChild );
					} else {
						panel.hide();
						post( {
							json: [
								"1,*,",
								{
									uiid: json.uiid,
									type: "action",
									actionName: "changeDimensionMember",
									dimension: nodes[0].dim,
									members: _.map( nodes, "value" ),
									predictStatus: predictStatus
								}
							].concat( getDupontTreeStatus(_dupontTree, getUIIDS()))
							.concat( getRefreshJSON( getUIIDS() ) ),
							callback: function(r) {
								refreshDupontUI(r);
							}
						} );
					}
				}
			} );
			
		return selector;
	};
	
	/**
	 * 预测操作 提交预测值和预测状态 由杜邦组件回调用。
	 * 
	 * @param nodeId
	 *            更改的节点ID
	 * @param measureNumber
	 *            更改的度量编号
	 * @param value
	 *            更改后的值
	 */
	function predict( nodeId, measureNumber, value, isRecoverValue) {
		post( {
			json: [
				"1,*;",
				{
					uiid: getUIIDS()[0],
					type: "action",
					actionName: "changeValue",
					node: nodeId,
					measures: measureNumber,
					value: value,
					recover: (isRecoverValue ? "true" : "false")
				}
			].concat( getDupontTreeStatus(_dupontTree, getUIIDS()))
			.concat( getRefreshJSON( getUIIDS() ) ),
			callback: function(r) {
				refreshDupontUI(r);
			}
		} );
	}

	/**
	 * 返回的前两个值可以忽略，直接取第3个值进行杜邦刷新 为兼容原有刷新，将刷新内容的key设置为 2
	 */
	function refreshDupontUI(r) {
		refreshUI( { 2: r[3] } );
	}
	
	/**
	 * 提交杜邦树的当前展开状态
	 */	
	function getDupontTreeStatus(tree, uiids) {
		var treeStatus;
		// 获取当前的树状态
		treeStatus = getTreeExpandedStatus(tree.getModel());
		uiids = uiids || getUIIDS();
		return {
			uiid: uiids[0],
			type: "action",
			actionName: "submitTreeStatus",
			treeStatus: treeStatus
		};
	}
	
	return {
		doDrillThrough: doDrillThrough2,
		doFilterForm: doFilterForm,
		doFilterSave: doFilterSave,
		doFilterLoad: doFilterLoad,
		doFilterDelete: doFilterDelete,
		doSelectRow: doSelectRow,
		doWorksheetExpand: doWorksheetExpand
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
