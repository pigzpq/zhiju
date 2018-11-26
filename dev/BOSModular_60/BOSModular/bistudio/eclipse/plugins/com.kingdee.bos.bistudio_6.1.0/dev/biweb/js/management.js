// 此文件由仪表板管理器和主题配置使用
var robot = ( function() {
	// 当前被选中的行的信息（数组。第0个元素是元信息，1、2、3……是实际值）
	var selectedItem;
	// 保存最后一次show调用
	var refresh = _.Z;
	var bi_tree;
	var table;
	function verifyPermission(param,opr) {
		if ( param.treeType == "dashboardManager" ){
			if(opr == "edit") {
				var edit = cookie.match( /BI_DASHBOARD_CANEDIT\=(\w+);/ )[1];
				if(edit=="false") {
					bi.portalDialog("对不起，您没有仪表板的编辑权限！");
					return false;
				}
			}else if(opr == "del") {
				var del = cookie.match( /BI_DASHBOARD_CANDEL\=(\w+);/ )[1];
				if(del=="false") {
					bi.portalDialog("对不起，您没有仪表板的删除权限！");
					return false;
				}
			}else if(opr == "setHome") {
				var setHome = cookie.match( /BI_DASHBOARD_CANSETHOME\=(\w+);/ )[1];
				if(setHome=="false") {
					bi.portalDialog("对不起，您没有将仪表板的设为首页的权限！");
					return false;
				}
			}else if(opr == "importDashboard") {
				var can = cookie.match( /BI_DASHBOARD_CANIMPORT\=(\w+);/ )[1];
				if(can=="false") {
					bi.portalDialog("对不起，您没有仪表板的导入权限！");
					return false;
				}
			}else if(opr == "exportDashboard") {
				var can = cookie.match( /BI_DASHBOARD_CANEXPORT\=(\w+);/ )[1];
				if(can=="false") {
					bi.portalDialog("对不起，您没有仪表板的导出权限！");
					return false;
				}
			}else if(opr == "publishPortlet") {
				var can = cookie.match( /BI_DASHBOARD_CANPORTLET\=(\w+);/ )[1];
				if(can=="false") {
					bi.portalDialog("对不起，您没有仪表板的发布Portlet权限！");
					return false;
				}
			}
			
			
		} else if ( param.treeType == "reportManager" ) {

			if(opr == "edit") {
				var edit = cookie.match( /BI_THEME_CANEDIT\=(\w+);/ )[1];
				if(edit=="false") {
					bi.portalDialog("对不起，您没有主题的编辑权限！");
					return false;
				}
			}else if(opr == "del") {
				var del = cookie.match( /BI_THEME_CANDEL\=(\w+);/ )[1];
				if(del=="false") {
					bi.portalDialog("对不起，您没有主题的删除权限！");
					return false;
				}
			}else if(opr == "publishPortlet") {
				var can = cookie.match( /BI_THEME_CANPORTLET\=(\w+);/ )[1];
				if(can=="false") {
					bi.portalDialog("对不起，您没有主题的发布Portlet权限！");
					return false;
				}
			}
		}
		return true;
	}
	var h = {
		newDir: {
			icon:"../img/ui-web/table/tbtn_newdirectory.gif",//图标
			caption: "新建目录",
			click: function(param) { 
				if(verifyPermission(param,"edit"))
					bi_tree.newDirectory( document ); 
			}
		},
		newTheme: {
			icon:"../img/ui-web/table/tbtn_newtopic.gif",//图标
			caption: "新建主题",
			click: function(param) { 
				if(verifyPermission(param,"edit"))
					bi_tree.newTheme( document ); 
			}
		},
		newDashBoard: {
			icon:"../img/ui-web/table/tbtn_newdashboard.gif",//图标
			caption: "新建仪表板",
			click: function(param) {
				if(verifyPermission(param,"edit"))
				 	bi_tree.newDashboad( document ); 
			 }
		},
		renameDashBoard: {
			icon:"../img/ui-web/table/tbtn_renamedashboard.gif",//图标
			caption: "重命名仪表板",
			click: function(param) {
				if(!verifyPermission(param,"edit"))
					return;
				if ( selectedItem && !selectedItem.$info.isFolder ) {
					bi_tree.renameDashboard( document, selectedItem[0] );
				} else {
					robot.setMessages( {
						type: "warning",
						caption: "请先选择一个仪表板"
					} );
				}
			 }
		},
		editDashBoard: {
			icon:"../img/ui-web/table/tbtn_editdashboard.gif",//图标
			caption: "编辑仪表板",
			click: function( param ) {
				if(!verifyPermission(param,"edit"))
					return;
							
				if ( selectedItem && !selectedItem.$info.isFolder ) {
					bi_tree.editDashboad();
				} else {
					robot.setMessages( {
						type: "warning",
						caption: "请先选择一个仪表板"
					} );
				}
			}
		},
		editTheme: {
			icon:"../img/ui-web/table/tbtn_edittopic.gif",//图标
			caption: "编辑主题",
			click: function(param) {
				if(!verifyPermission(param,"edit"))			
					return;
				if ( selectedItem && !selectedItem.$info.isFolder ) {
					if (selectedItem.$info.themeReportType == "ext") {
						//选中主题是扩展报表,不允许编辑
						robot.setMessages( {
							type: "warning",
							caption: "扩展报表不允许编辑, 请到业务中心>>扩展报表管理器"
						} );
					} else if(selectedItem.$info.themeReportType == "dupont") {
						//选中主题是杜邦分析,不允许编辑
						robot.setMessages( {
							type: "warning",
							caption: "杜邦分析不允许编辑, 请到业务中心>>企业指标建模控制台"
						} );
					}
					else
						bi_tree.editTheme( document, selectedItem[0], selectedItem[1],selectedItem[2] );
				} else {
					robot.setMessages( {
						type: "warning",
						caption: "请先选择一个主题"
					} );
				}
			}
		},
		renameDir: {
			icon:"../img/ui-web/table/tbtn_renamedirectory.gif",//图标
			caption: "重命名目录",
			click: function(param) {
				if(!verifyPermission(param,"edit"))
					return;			
				if ( selectedItem && selectedItem.$info.isFolder ) {
					bi_tree.renameDirectory( document, selectedItem[0] );
				} else {
					robot.setMessages( {
						type: "warning",
						caption: "请先选择一个目录"
					} );
				}
			}
		},
		erase: {
			icon:"../img/ui-web/table/tbtn_Delete.gif",//图标
			caption: "删除",
			click: function(param) { 
				if(!verifyPermission(param,"del"))
					return;
				if ( selectedItem && !selectedItem.$info.isFolder && selectedItem.$info.themeReportType == "ext") {
					//选中主题是扩展报表,不允许删除
					robot.setMessages( {
						type: "warning",
						caption: "扩展报表不允许删除, 请到业务中心>>扩展报表管理器>>撤销发布"
					} );
				} else if ( selectedItem && !selectedItem.$info.isFolder && selectedItem.$info.themeReportType == "dupont") {
					//选中主题是杜邦分析,不允许删除
					robot.setMessages( {
						type: "warning",
						caption: "杜邦分析不允许删除, 请到业务中心>>企业指标建模控制台>>取消发布"
					} );
				} else {		    
					bi_tree.delNode( document );
				}
			}
		},
		importDashboard: {
			icon:"../img/ui-web/table/tbtn_input.gif",//图标
			caption: "导入",
			click: function(param) { 
				if(!verifyPermission(param,"importDashboard"))
					return;
				  
				bi_tree.importDashboard( document );
			}
		},
		exportDashboard: {
			icon:"../img/ui-web/table/tbtn_output.gif",//图标
			caption: "导出",
			click: function(param) { 
				if(!verifyPermission(param,"exportDashboard"))
					return;
				bi_tree.exportDashboard( document );
			}
		},
		//发布到 portlet 2010-02-25 修改
		publishPortlet: {
			icon:"../img/ui-web/table/tbtn_issuanceportal.gif",//图标
			caption: "发布到Portlet",
			click: function(param) { 
				//暂时不进行权限校验
				if(!verifyPermission(param,"publishPortlet"))
					return;				
				//	if ( selectedItem && !selectedItem.$info.isFolder ) {
				//目前已经支持对文件夹的发布：1/所选不为空 2/非文件夹 or 是主题分析文件夹 2010-02-25 bruce_sha
				if ( selectedItem && (!selectedItem.$info.isFolder||selectedItem.$info.isThemeAnalysFolder=="true")) {
					bi_tree.publishPortlet( document );
				} else {
					robot.setMessages( {
						type: "warning",
						caption: "请先选择一条记录"
					} );
				}
			}
		}
	};
	function show( param, tree, afterLoaded ) {
		bi_tree = tree;
		selectedItem = null;
		refresh = _.bind( show, this, param , tree );
		_.post( {
			url: param.servletURL,
			json: _.extend( param, { action: "openFolder" } ),
			callback: function( r ) {
				_.id( "table_container" ).innerHTML = "";
				//table && _.gc( table.table.table );
				var command = param.treeType == "dashboardManager"
					? "newDir,newDashBoard,renameDir,editDashBoard,renameDashBoard,erase,importDashboard,exportDashboard,publishPortlet"//setHomePage
					: "newDir,newTheme,renameDir,editTheme,erase,publishPortlet";
				var rows = r.split( "\2" );
				table = Sue.ui.table( {
					parent: _.id( "table_container" ),
					rootCSSText: "width:100%",
					rowSelectable: true,
					multipleSelect: param.treeType == "dashboardManager",
					command: _.map( command.split( "," ), function( c ) {
						return {
							icon:h[c].icon,
							caption: h[c].caption,
							execute: _.bind( h[c].click, this, param )
						};
					} ),
					head: _.map( rows[0].split( "\1" ), function( col ) {
						return {
							caption: col
						};
					} ),
					data: _.map( rows.slice( 1 ), function( row ) {
						var a = row.split( "\1" );
						a.$info = eval( "(" + a.shift() + ")" );
						return a;
					} ),
					renderer: [
						{
							col: 0,
							render: function( param ) {
								var icon;
								if ( param.data[ param.row ].$info.isFolder ) {
									icon = "folder";
								} else if(param.data[ param.row ].$info.themeReportType == "olap") {
									icon = "report";
								} else if(param.data[ param.row ].$info.themeReportType == "dashboard") {
									icon = "report";
								} else if(param.data[ param.row ].$info.themeReportType == "ext") {
									icon = "extReport";
								} else if(param.data[ param.row ].$info.themeReportType == "dupont") {
									icon = "dupontReport";
								} else {
									//默认显示
									icon = "report";
								}
								
								param.td.insertBefore( _.crt( "img", {
									src: _.format( "../img/ui-web/%s.gif", icon )
								}, null, "margin-right:4px" ), param.td.firstChild );
							}
						},
						{
							col: 1,
							render: function( param ) {
								var path = param.td.innerHTML;
								// \x03是路径分隔符，由于主题meta标题可以设置为正斜杠，所以这里用不可见的字符\x03分隔
								path = path.replace( /\x03/g, "/" );
								param.td.innerHTML = path;
							}
						},
						{
							row: "*",
							type: "click",
							render: function( param ) {
								selectedItem = param.value;
							}
						},
						{
							row: "*",
							type: "dblclick",
							render: function( param ) {
								if ( !bi_tree ) return;
								if ( param.value.$info.isFolder ) {
									bi_tree.expandToNode( param.value[0] );
								} else if( bi_tree.tree.vm.treeType == "dashboardManager" ) {
									bi_tree.editDashboad();
								}
							}
						}
					]
				} );
				afterLoaded && afterLoaded();
				bi.tryResetBaseIFrameHeight();
			},
			beforeStart: null,
			afterEnd: null
		} );
	}

	// robot的家当
	return {
		//历史原因，只返回单选结果, lzx,2009.11.2
		getSelectedItem: function() {
			return selectedItem;
		},
		//历史原因，只返回单选结果,lzx,2009.11.2
		selectedCount: function() {
			return selectedItem ? 1 : 0;
		},
		getSelectedRows:function()
		{
			return table.selectedRow;
		},
		getSelectedRowDatas:function()
		{
			return table.selectedRowData;
		},
		show: show,
		refresh: function( param ) {
			param = param || {};
			refresh( function() {
				if ( param.selectedCaption ) {
					var data = table.param.data;
					for( var i = 0, len = data.length; i < len; i++ ) {
						if ( data[i][0] == param.selectedCaption ) {
							_.extractEvent( table.table.table.firstChild.childNodes[ i + 1 ], "click" )();
							return;
						}
					}
				}
				selectedItem = null;
			} );
		},
		rowCount: function() {
			return table.param.data.length;
		},
		cell: function(row,col) {
			return table.param.data[row][col];
		},
		row: function(row) {
			return table.param.data[row];
		},
		setMessages: function( msgs ) {
			bi.getMessageTable( msgs, _.id( "message_container" ) );
		}
	}
} )();