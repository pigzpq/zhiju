/**
 * 列表(序事簿)的实现
 * add by stone_zheng 2009/08/17
 */
 
/**
 * 构造器
 * uiid : 		列表对应表格组件(BI报表)的id
 * obj：	  		BI报表的页面(列表的父页面)
 * post： 		BI报表的ajax请求封装(包含了BI报表的页面等信息，此处直接用来作为列表的请求)
 * parentDiv：	列表的父Div
 * 
 */
function DataList( uiid, obj, post, parentDiv) 
{
	this.uiid = uiid;			
	this.obj = obj;				
	this.post = post;			
	this.parentDiv = parentDiv;	
	this.sortColumns = {};		//记录列表的排序列信息
	this.filterColumns = {};	//记录过滤信息
	this.sortCounter = 1;		//用来确定排序优先级
}

/**
 * 显示列表
 * r：服务端返回的数据(数据格式参看服务端worklist组件)
 */
DataList.prototype.show = function( r )
{
	var _this = this;	//为了给嵌套函数调用DataList的成员。
	if( r )
		//如果有传入结果集，则使用最新的结果来刷新
		this.o = eval( "(" + r + ")" );
	this.parentDiv.innerHTML = _.loadUIT( "bi_dialog_dimension_penetrate" );
	f( "titleDiv" ).innerHTML = this.o.title;
	f( "pageHeadDiv" ).innerHTML = this.o.pageHead;
	document.title = this.o.title;
	var tableDiv = f( "tableDiv" );
	listTable = Sue.ui.table( {
		parent: tableDiv,
		rootCSSText: "table-layout:fixed",
		cellCSSText: "white-space:nowrap;word-break:keep-all",
		scroll: {
			height: document.body.clientHeight - 180
		},
		command:{
			caption: "导出XLS",
			execute: function() {
				_this.post( {
					json: {
						uiid: _this.uiid,
						type: "action",
						actionName: "exportList",
						listId: _this.o.listUUID,
						exportType: "excel"
					},
					callback: function( r ) {
						// 有些机器上不能正常使用window.open，这里改为用隐藏iframe的方式打开
						// 因为目标是pdf或者xls数据，ie会弹出“打开”“保存”对话框
						_.crt("iframe", {
							src: r
						}, _this.obj.body, "display:none;height:0px;width:0px;position:absolute" );
					}
				} );
			}
		},
		head: _.map( this.o.head, function( c ) {
			return {
				caption: c,
				hook: [ {
					callback: function() {
						this.style.cursor = "pointer";
						this.value = this.innerHTML;
						var sortFlag = 0;
						if(_this.sortColumns[this.value] && _this.sortColumns[this.value] != 0 ) {
							sortFlag = (_this.sortColumns[this.value] > 0 ? 1 : -1)	
						}
						_this.setColumnFlag( this, sortFlag ,(!!_this.filterColumns[this.value]) )
					}
				}, {
					type: "click",
					callback: function( head, table ) {
						var sortMethod;
						var __this = this;
						var curColumn = this.value; //当前选中的列名
						var columnType = _this.o.type[curColumn];
						var menu_items = [
							{
								caption: "升序",
								click: function () {sort(1, curColumn);}
							},
							{
								caption: "降序",
								click:  function () {sort(-1, curColumn);}
							},
							{
								caption: "取消排序",
								click:  function () {sort(0, curColumn);}
							},
							{
								caption: "—————",
								click: _.Z
							},
							{
								caption: "筛选",
								click: function() {
									if(columnType == "string") {
										//文本字段，提供列表筛选方式：(取该字段的唯一值进行筛选
										var ret;
										_this.post({
											async: false,
											json:{
												uiid: _this.uiid,
												type: "action",
												actionName: "getColumnValues",
												listId: _this.o.listUUID,
												column: curColumn
											},
											callback:function( r ) {
												ret = r;
											}
										});
										var p = {};
										p.filtercolumn = curColumn;
										var r = ret.split("\3");
										if (r.length >= 2) {
											p.allcolumn = r[0];		//所有可选列
											p.columnvalues = r[1];
										} else {
											p.allcolumn = r[0];
											p.columnvalues = r[0];
										}
										p.ret = null;	//返回值 null表示选择了取消
										window.showModalDialog("filter_list.htm", p,
											"status:no;dialogWidth:360px;dialogHeight:460px;");
										if( !p.cancel ) {
											_this.post({
												json: {
													uiid: _this.uiid,
													type: "action",
													actionName: "filterList",
													filterMethod: "list",
													filterType: p.filterType,
													listId: _this.o.listUUID,
													column: curColumn,
													filterValue: p.ret
												},
												callback:function( r ) {
													_this.filterColumns[curColumn] = p.ret;
													_this.show(r);
												}
											});
										}
									} else if(columnType == "number" || columnType == "date") {
										//数值或日期字段，提供范围选择方式进行筛选
										var p = {};
										p.filtercolumn = curColumn;
										p.columnType = columnType;
										if( _this.filterColumns[curColumn] ) {
											p.filterValue = _this.filterColumns[curColumn];
										}else
											p.filterValue = null;	
										window.showModalDialog("filter_range.htm", p,
											"status:no;dialogWidth:360px;dialogHeight:460px;");
										if( !p.cancel ) {
											var fv = _.map(p.filterValue.condition,function( x ){
													return x.operator + x.value ;
											}).join("\1");
											_this.post({
												json: {
													uiid: _this.uiid,
													type: "action",
													actionName: "filterList",
													filterMethod: "condition",
													filterType: p.filterValue.type,
													listId: _this.o.listUUID,
													column: curColumn,
													filterValue: fv
												},
												callback:function( r ) {
													_this.filterColumns[curColumn] = p.filterValue;
													_this.show(r);
												}
											});
										}	
									}
								}	
							},
							{
								caption: "取消筛选",
								click: function() {
									//判定当前列是否有筛选条件，如果有则发请求。
									if(_this.filterColumns[curColumn]) {
										_this.post({
											json: {
												uiid: _this.uiid,
												type: "action",
												actionName: "filterList",
												filterMethod: "cancel",
												listId: _this.o.listUUID,
												column: curColumn
											},
											callback:function(r) {
												_this.filterColumns[curColumn] = null;
												_this.show(r);
											}
										})	
									}
								}
							}];

						//如果当前处理过滤情况，则可以使用取消过滤
						if(!_this.filterColumns[this.value]) {
							//未筛选，不需要取消菜单
							menu_items.splice(5,1);
						}
						
						if(_this.sortColumns[this.value] && _this.sortColumns[this.value] != 0 ) {
							if (_this.sortColumns[this.value] > 0 ) {
								//升序，不需要升序菜单
								menu_items.splice(0,1);
							} else {
								//降序，不需要降序菜单
								menu_items.splice(1,1);
							}	
						} else	{
							//未排序，不需要取消菜单
							menu_items.splice(2,1);	
						}
						
						var menu = Sue.ui.menu({ items: menu_items });
						var xyz = [ window.event.x + "px", window.event.y + "px", 52 ];
						_.copyStyle( menu.root.root, "left,top,zIndex", xyz );
						menu.disable(2,true);	//分隔符菜单项只读
						menu.root.show();
						
						/**
						 * 排序
						 * sortMethod：1：升序  -1：降序  0：取消排序
						 */
						function sort( sortMethod, sortColumn) {
							if(!addSortColumn( _this.sortColumns, sortColumn, sortMethod ))
								//没有变化，不需要重新排序
								return;
								
//							_this.setColumnFlag( __this, sortMethod, (!!_this.filterColumns[sortColumn]) );
							
							//将排序信息转换为数组，并按优先级先后顺序排序，最优先的在前。
							var a = [];
							for( var p in _this.sortColumns ) {
								a.push ( {key:p, value:_this.sortColumns[p]} );
							}
							a.sort(function( a1, a2 ) {
								return Math.abs( a2.value ) - Math.abs( a1.value );
							});
							_this.post( {
								json: {
									uiid: _this.uiid,
									type: "action",
									actionName: "sortList2",
									listId: _this.o.listUUID,
									sortColumnInfos: _.map(a,
											function(x){
												if(x.value > 0)
													return x.key + "\1" + "1";
												else if(x.value < 0)
													return x.key + "\1" + "-1";
												else
													return x.key + "\1" + "0";	
											}).join("\2")										
								},
								callback: function( r ) {
									_this.show(r);
								}
							} );
						}
						
						/**
						 * 新增排序
						 * sortColumns: 排序的串  [{key:columnname,asc:1},……]     
						 * column: 排序的列名
						 * sortMethod: 排序方式：1：升序  -1：降序  0：不排序
						 * 采取栈的方式，后进先排。
						*/
						function addSortColumn ( sortColumns, column, sortMethod ) 
						{
							if(sortMethod == 0) {
								//删除某个排序的元素
								if( !sortColumns[column] || sortColumns[column] == 0 )
									return false;
								sortColumns[column] = 0;
							} else if(sortMethod == 1) {
								//添加升序
								if( sortColumns[column] && sortColumns[column] == _this.sortCounter )
									return false; 
								sortColumns[column] = (++_this.sortCounter);
							} else if(sortMethod == -1) {
								//添加降序
								if( sortColumns[column] && sortColumns[column] == -_this.sortCounter )
									return false;
								sortColumns[column] = -(++_this.sortCounter);
							}	
							return true;
						}
					}
				} ]
			};
		} ),
		data: this.o.data,
		colType: this.o.type
	} );
	f( "pageTailDiv" ).innerHTML = this.o.pageTail;
	var pf = Sue.ui.ext.pageFlipper( {
		parent: f( "pageDiv" ),
		current: this.o.currentPage,
		total: this.o.totalPage,
		callback: function( page ) {
			_this.post( {
				json: {
					uiid: _this.uiid,
					type: "action",
					actionName: "setListPage",
					page: page,
					listId: _this.o.listUUID
				},
				callback: function( r ) {
					_this.show(r);
				}
			} );
		},
		size: _this.o.perPageRows, 
		sizeHook: function( size ) {
			//发送变更分页方式的请求，并返回新的数据
			_this.post( {
				json: {
					uiid: _this.uiid,
					type: "action",
					actionName: "setListPerPageRows",
					listId: _this.o.listUUID,
					perPageRows: size
				},
				callback: function( r ) {
					_this.show(r);
				}
			} );
		},
		sizeList: [ 10, 15, 20, 25, 50, 100, 1000 ]
	} );
	
	function f( value ) {
		return _.select( _this.parentDiv, "sue", 1, value );
	}
}


	
/**
 * 设置列的排序图标
 * headColumn：列名
 * sortMethod：排序方式 0：不排序 1：升序 -1：降序
 * filterFlag: 过滤方式 true: 过滤 false：无过滤
 */
DataList.prototype.setColumnFlag = function( headColumn, sortMethod, filterFlag) 
{
	headColumn.innerHTML = headColumn.value;
	if ( sortMethod != 0 ) {
		_.crt( "img", {
			src: "../img/ui-web/arrow_" + ( sortMethod == 1 ? "up" : "down" ) + ".gif"
		}, headColumn );
	}
	if ( filterFlag ) {
		_.crt( "img", {
			src: "../img/ui-web/tbtn_billfilter" + ".gif"
		}, headColumn );
	}
}

/**
 * 数据列表关闭时发送请求，服务端销毁相关资源
 */	
DataList.prototype.destroy = function() 
{
	this.post( {
		async: false,
		beforeStart: null,
		afterEnd: null,
		json: {
			uiid: this.uiid,
			type: "action",
			actionName: "closeList",
			listId: this.o.listUUID
		}
	} );
}
