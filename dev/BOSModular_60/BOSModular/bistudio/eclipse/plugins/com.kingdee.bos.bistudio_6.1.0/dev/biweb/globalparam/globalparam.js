var split1 = "@/";
var split2 = "@//";
var treeRoot = "";
var lst;

Ext.onReady(function() {
	setSkin();
	treeRoot = window.dialogArguments.treeRoot;// 取得主题分析结点信息
	Ext.util.CSS.swapStyleSheet('theme', cssName);
	_.post({
		url : servletURL,
		beforeStart : _.Z,
		afterEnd : _.Z,
		json : {
			type : "action",
			servletType : "getGlobalParamPermission"
		},
		callback : function(r) {
			var canEditGlobalParam = r.canEditGlobalParam;
			var tabPnl = new Ext.TabPanel({
				activeTab : 0,
				region : 'center',
				border : false,
				layoutOnTabChange : true,
				defaults : {
					autoScroll : true
				},
				enableTabScroll : true,
				items : [{

							title : '分组定义',

							id : 'panel1',

							name : 'panel1',

							layout : 'fit',

							html : _.loadUIT("bi_dialog_globalparam_group"),

							listeners : {
								activate : function(tab) {
									handleActivate(tab);
								}
							}
						},

						// Tab页区域2

						{

							title : '过滤项定义',

							id : 'panel2',

							name : 'panel2',

							layout : 'fit',

							html : _
									.loadUIT("bi_dialog_globalparam_paramdefine"),

							listeners : {
								activate : function(tab) {
									handleActivate(tab);
								}
							}

						},

						// Tab页区域3

						{

							title : '过滤值定义',

							id : 'panel3',

							name : 'panel3',

							layout : 'fit',

							html : _.loadUIT("bi_dialog_globalparam_paramInit"),

							listeners : {
								activate : function(tab) {
									handleActivate(tab);
								}
							}

						}

				]

			});
			// 底层布局面板
			new Ext.Viewport({
						enableTabScroll : true,
						layout : "border",
						items : [tabPnl]
					});
			// 没有权限则删除分组管理了和参数定义
			if (!canEditGlobalParam) {
				tabPnl.remove(1);
				tabPnl.remove(0);
				tabPnl.setActiveTab(0);
			}
		}
	});

	function handleActivate(tab) {
		if (tab.id == "panel1") {

			var btn_groupClose = document.getElementById("btn_groupClose");

			var existGroup = document.getElementById("existGroup");

			bi.updateToPortalStyleButton(btn_groupClose);

			initGroupList();
			_.bindEvent(existGroup, "onclick", function() {
						onGroupClick();
					});

		} else if (tab.id == "panel2") {

			var btn_paramClose = document.getElementById("btn_paramClose");

			var existParam = document.getElementById("existParam");

			bi.updateToPortalStyleButton(btn_paramClose);

			initParamList();
			_.bindEvent(existParam, "onclick", function() {
						onParamClick();
					});
		} else {
			var btn_paramInitSave = document
					.getElementById("btn_paramInitSave");
			bi.updateToPortalStyleButton(btn_paramInitSave);
			var btn_paramInitClose = document
					.getElementById("btn_paramInitClose");
			document.getElementById("paramInit_div").innerHTML = "";
			bi.updateToPortalStyleButton(btn_paramInitClose);
			_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getUserParamValue"
				},
				callback : function(r) {
					if (r.message == "ok") {
						var params = null;
						params = r.list;
						_.post({
							url : servletURL,
							beforeStart : _.Z,
							afterEnd : _.Z,
							json : {
								type : "action",
								servletType : "GlobalParam",
								action : "getGroupParam"
							},
							callback : function(r) {
								var oldGroupId = "";
								var tableindex = 0;
								var table_id = "";
								if (r.message == "ok") {
									lst = r.list;
									for (var i = 0; i < lst.length; i++) {
										var paramvalue = "";
										var paramcaption = "";
										var paramid = lst[i].paramid;
										var paramtitle = lst[i].paramtitle;
										var groupid = lst[i].groupid;
										var groupname = lst[i].groupname;
										var type = lst[i].type;
										var datatype = lst[i].datatype;
										if (oldGroupId != groupid) {// 如果分组不同则新增分组
											table_id = ("paramtable_" + tableindex)
													.toString();
											new Ext.Panel({
												title : "分组名称：" + groupname,// 标题
												collapsible : true,// 右上角上的那个收缩按钮，设为false则不显示
												titleCollapse : true,
												layout : 'fit',
												renderTo : 'paramInit_div',
												html : '<table style="font-size:12px;" border="0" cellpadding=3 cellspacing=3 id='
														+ table_id
														+ '></table>'
											});
											tableindex = tableindex + 1;
											oldGroupId = groupid;
										}
										var tb = document
												.getElementById(table_id);

										var newRow = tb.insertRow();// 添加行

										var newCell = newRow.insertCell();
										newCell.style.width = 20;

										var newCell0 = newRow.insertCell(); // 创建新单元格
										newCell0.style.width = 100;
										newCell0.style.height = 25;
										newCell0.innerText = paramtitle + "：";

										var newCell1 = newRow.insertCell();
										newCell1.style.width = 180;
										newCell1.style.height = 25;
										newCell1.align = "left";

										var newCell2 = newRow.insertCell();
										newCell2.style.width = 50;
										newCell2.style.height = 25;
										newCell2.align = "left";

										for (var y = 0; y < params.length; y++) {
											var id = params[y].fparamid;
											var value = params[y].fparamvalue;
											var caption = params[y].fparamcaption;
											if (paramid == id) {
												paramvalue = value;
												paramcaption = caption;
											}
										}
										// imput类型，不需要按钮
										if (type == "input") {
											newCell1.innerHTML = "<input style='width:150px;' class='inputcss'  id='"
													+ paramid
													+ "' type='text' value='"
													+ paramvalue + "' />";
											newCell2.innerHTML = "<input style='visibility:hidden;width:0px' id='caption_"
													+ paramid + "' />"
											if (datatype == "date") {// date

												var input = document
														.getElementById(paramid);
												var md = new Ext.form.DateField(
														{
															applyTo : input,
															width : 170,
															format : 'Y-m-d',
															emptyText : '请选择日期 ...'
														});
												md.show();
											}
										} else {
											newCell1.innerHTML = "<imput><input class='inputcss' id='caption_"
													+ paramid
													+ "' type='text' style='background-color: #E9E9E9;width:150px;height:22px;' readonly='readonly' value='"
													+ paramcaption
													+ "' /><img  style='cursor:hand;' align='absmiddle' src='../img/ui-web/btn_kpicolor_focus.gif' id='img@"
													+ paramid
													+ "' onClick='javascript:showSelectWin(this.id);'/>";
											newCell2.innerHTML = "<input  id='"
													+ paramid
													+ "' style='visibility:hidden;width:0px'  type='text' value='"
													+ paramvalue + "' />";
										}
									}
								} else {
									Ext.Msg.alert("系统提示", "操作失败：" + r.message);
								}
							}
						});

					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});

		}
	}

});

// 根据当前参数ID显示相应的选择窗口
var paramid = "";
function showSelectWin(param_id) {
	paramid = param_id.split("@")[1];
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getFillteritemByParamId",
					paramId : paramid
				},
				callback : function(r) {
					if (r.message == "ok") {
						if (r.type == "list") {
							listHandler(r, paramid);
						} else if (r.type == "tree") {
							treeHandler(r, paramid);
						}

					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});
}
// 处理过滤器列表型
var handlerWin = null;
function listHandler(r, paramid) {

	handlerWin = new Ext.Window({
				modal : true,
				width : 420,
				height : 350,
				title : "标题",
				html : _.loadUIT("bi_dialog_globalparam_listselect")
			});
	handlerWin.show();

	var btn_addOneSelect = document.getElementById("btn_addOneSelect");
	var btn_delOneSelect = document.getElementById("btn_delOneSelect");
	var btn_addAllSelect = document.getElementById("btn_addAllSelect");
	var btn_delAllSelect = document.getElementById("btn_delAllSelect");

	var btn_doSelectList = document.getElementById("btn_doSelectList");
	var btn_doHandlerWinClose = document
			.getElementById("btn_doHandlerWinClose");

	var exist_list = document.getElementById("exist_list");
	var select_list = document.getElementById("select_list");

	bi.updateToPortalStyleButton(btn_addOneSelect);
	bi.updateToPortalStyleButton(btn_delOneSelect);
	bi.updateToPortalStyleButton(btn_addAllSelect);
	bi.updateToPortalStyleButton(btn_delAllSelect);
	bi.updateToPortalStyleButton(btn_doSelectList);
	bi.updateToPortalStyleButton(btn_doHandlerWinClose);

	btn_addOneSelect = Sue.ui.button({
				parent : btn_addOneSelect,
				cssText : "margin-right:10px",
				caption : "&nbsp;>&nbsp;",
				click : function() {
					addOneSelect(r.multi);
				}
			});

	btn_delOneSelect = Sue.ui.button({
				parent : btn_delOneSelect,
				cssText : "margin-right:10px",
				caption : "&nbsp;<&nbsp;",
				click : function() {
					delOneSelect(r.multi);
				}
			});

	btn_addAllSelect = Sue.ui.button({
				parent : btn_addAllSelect,
				cssText : "margin-right:10px",
				caption : ">>",
				click : function() {
					addAllSelect();
				}
			});

	btn_delAllSelect = Sue.ui.button({
				parent : btn_delAllSelect,
				cssText : "margin-right:10px",
				caption : "<<",
				click : function() {
					delAllSelect();
				}
			});

	if (r.multi == "false") {
		btn_addAllSelect.span.disabled = true;
		btn_delAllSelect.span.disabled = true;
	}
	for (var i = 0; i < r.value.length; i++) {
		var caption = r.value[i].caption;
		var value = r.value[i].fid;
		var hashSelected = false;
		var values = document.getElementById(paramid).value;
		if (values.length > 0) {
			values = values.split(",");
			for (var y = 0; y < values.length; y++) {
				if (values[y] == value) {
					hashSelected = true;
					break;
				}
			}
		}
		if (!hashSelected) {
			exist_list.options.add(new Option(caption, value));
		} else {
			select_list.options.add(new Option(caption, value));
		}
	}
}

function addOneSelect(multi) {
	var exist_list = document.getElementById("exist_list");
	var select_list = document.getElementById("select_list");
	if (exist_list.options.selectedIndex != -1) {
		if (multi == "false") {// 单选
			var l_caption = exist_list
					.options(exist_list.options.selectedIndex).innerText;
			var l_value = exist_list.options(exist_list.options.selectedIndex).value;
			if (select_list.options.length > 0) {
				var r_caption = select_list.options(0).innerText;
				var r_value = select_list.options(0).value;
				select_list.options.remove(0);
				exist_list.options.add(new Option(r_caption, r_value));
			}
			select_list.options.add(new Option(l_caption, l_value));
			exist_list.options.remove(exist_list.options.selectedIndex);

		} else {
			var l_caption = exist_list
					.options(exist_list.options.selectedIndex).innerText;
			var l_value = exist_list.options(exist_list.options.selectedIndex).value;
			select_list.options.add(new Option(l_caption, l_value));
			exist_list.options.remove(exist_list.options.selectedIndex);
		}
	} else {
		Ext.Msg.alert("系统提示", "未选择任何条目!");
	}
}
function delOneSelect(multi) {
	var exist_list = document.getElementById("exist_list");
	var select_list = document.getElementById("select_list");
	if (select_list.options.selectedIndex != -1) {
		if (multi == "false") {
			var r_caption = select_list
					.options(select_list.options.selectedIndex).innerText;
			var r_value = select_list
					.options(select_list.options.selectedIndex).value;

			select_list.options.remove(0);
			exist_list.options.add(new Option(r_caption, r_value));
		} else {
			var caption = select_list
					.options(select_list.options.selectedIndex).innerText;
			var value = select_list.options(select_list.options.selectedIndex).value;
			exist_list.options.add(new Option(caption, value));
			select_list.options.remove(select_list.options.selectedIndex);
		}
	} else {
		Ext.Msg.alert("系统提示", "未选择任何条目!");
	}
}
function addAllSelect() {
	var exist_list = document.getElementById("exist_list");
	var select_list = document.getElementById("select_list");
	for (var i = 0; i < exist_list.options.length; i++) {
		var l_caption = exist_list.options(i).innerText;
		var l_value = exist_list.options(i).value;
		select_list.options.add(new Option(l_caption, l_value));
	}
	for (var y = exist_list.options.length; y > 0; y--) {
		exist_list.options.remove(y - 1);
	}
}
function delAllSelect() {
	var exist_list = document.getElementById("exist_list");
	var select_list = document.getElementById("select_list");
	for (var i = 0; i < select_list.options.length; i++) {
		var r_caption = select_list.options(i).innerText;
		var r_value = select_list.options(i).value;
		exist_list.options.add(new Option(r_caption, r_value));
	}
	for (var y = select_list.options.length; y > 0; y--) {
		select_list.options.remove(y - 1);
	}
}
function doSelectList() {
	var value = "";
	var caption = "";
	var select_list = document.getElementById("select_list");
	for (var i = 0; i < select_list.options.length; i++) {
		var r_value = select_list.options(i).value;
		var r_caption = select_list.options(i).innerText;
		value = value + "," + r_value;
		caption = caption + "," + r_caption;
	}
	document.getElementById(paramid).value = value.substring(1, value.length);
	document.getElementById("caption_" + paramid).value = caption.substring(1,
			caption.length);
	handlerWin.close();
}
// 处理过滤器树型
var tree = null;
function treeHandler(r, paramid) {
	handlerWin = new Ext.Window({
				modal : true,
				width : 270,
				height : 340,
				title : "标题",
				html : _.loadUIT("bi_dialog_globalparam_treeselect")
			});
	handlerWin.show();
	var btn_doSelectTree = document.getElementById("btn_doSelectTree");
	var btn_doHandlerWinClose = document
			.getElementById("btn_doHandlerWinClose");
	bi.updateToPortalStyleButton(btn_doSelectTree);
	bi.updateToPortalStyleButton(btn_doHandlerWinClose);

	// 构造树节点
	var tree_container = document.getElementById("tree_container");
	tree = Sue.ui.tree({
				parent : tree_container,
				caption : "",
				getIcon : function(node, f) {
					return node.expanded && f("folderopen") || node.folder
							&& f("folder") || f("report");
				}
			});
	// 构造根节点并将该根节点与树榜定
	var Node = tree.getNodeConstructor();
	var nodes = [];
	for (var i = 0; i < r.value.length; i++) {
		var checked = false;
		var caption = r.value[i].caption;
		var fid = r.value[i].fid;
		var nodeValue = r.value[i].nodeValue;
		var sql = r.value[i].sql;
		var childColumn = r.value[i].childColumn;
		var captionColumn = r.value[i].captionColumn;
		var valueColumn = r.value[i].valueColumn;
		var parentColumn = r.value[i].parentColumn;
		var dataType = r.value[i].dataType;
		// 给树节点打勾
		var oldValues = document.getElementById(paramid).value.split(",");
		for (var z = 0; z < oldValues.length; z++) {
			if (nodeValue == oldValues[z]) {
				checked = true;
				break;
			}
		}
		var root_node = Node({
					caption : caption,
					value : {
						fid : fid,
						nodeValue:nodeValue,
						sql : sql,
						captionColumn : captionColumn,
						childColumn : childColumn,
						valueColumn : valueColumn,
						parentColumn : parentColumn,
						dataType : dataType
					},
					check : checked,
					noIcon : true,
					lazyload : pieceLazyload2,
					click : _.Z,
					dblclick : _.Z
				});
		tree.setRoot(root_node);
	}
}
function pieceLazyload2(node, callback) {
	var fid = node.value.fid;// 父节点id
	var sql = node.value.sql;// 查询的sql
	var captionColumn = node.value.captionColumn;// 节点显示字段
	var childColumn = node.value.childColumn;// 节点显示字段
	var valueColumn = node.value.valueColumn;// 节点值字段
	var parentColumn = node.value.parentColumn;// 父节点字段
	var dataType = node.value.dataType;// 父节点字段
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getChildrenById",
					fid : fid,
					sql : sql,
					captionColumn : captionColumn,
					childColumn : childColumn,
					valueColumn : valueColumn,
					parentColumn : parentColumn,
					dataType : dataType
				},
				callback : function(r) {
					if (r.message = "ok") {
						var nodes = [];
						var Node = tree.getNodeConstructor();
						for (var i = 0; i < r.value.length; i++) {
							var checked = false;
							var caption = r.value[i].caption;
							var fid = r.value[i].fid;
							var nodeValue = r.value[i].nodeValue;
							var sql = r.value[i].sql;
							var captionColumn = r.value[i].captionColumn;
							var childColumn = r.value[i].childColumn;
							var valueColumn = r.value[i].valueColumn;
							var parentColumn = r.value[i].parentColumn;
							var dataType = r.value[i].dataType;
							// 给树节点打勾
							var oldValues = document.getElementById(paramid).value
									.split(",");
							for (var z = 0; z < oldValues.length; z++) {
								if (nodeValue == oldValues[z]) {
									checked = true;
									break;
								}
							}
							node = Node({
										caption : caption,
										value : {
											fid : fid,
											nodeValue:nodeValue,
											sql : sql,
											captionColumn : captionColumn,
											childColumn : childColumn,
											valueColumn : valueColumn,
											parentColumn : parentColumn,
											dataType : dataType
										},
										check : checked,
										noIcon : true,
										folder : "true",
										click : _.Z,
										lazyload : pieceLazyload2
									});
							nodes.push(node);
						}
						callback(nodes);
					} else {
						callback([]);
					}
				}
			});

}
function doSelectTree() {
	var value = "";
	var caption = "";
	var selectedNodes = tree.root.getAllChildren(tree.root);
	if (selectedNodes.length > 0) {
		for (var i = 0; i < selectedNodes.length; i++) {
			var selectedNode = selectedNodes[i];
			if (selectedNode != null && selectedNode.check == true) {
				value = value + "," + selectedNode.value.nodeValue;
				caption = caption + "," + selectedNode.caption;
			}
		}
	}
	document.getElementById(paramid).value = value.substring(1, value.length);
	document.getElementById("caption_" + paramid).value = caption.substring(1,
			caption.length);
	handlerWin.close();
}
function handlerWinClose() {
	handlerWin.close();
}
// 分组管理
// 初始化分组列表
function initGroupList() {
	var existGroup = document.getElementById("existGroup");
	for (var i = existGroup.options.length - 1; i >= 0; i--) {
		existGroup.options.remove(i);
	}
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getGroupList"
				},
				callback : function(r) {
					if (r.message == "ok") {
						if (r.empty != "true") {
							var info = (r.info).split(split2);
							for (var y = 0; y < info.length; y++) {
								var fid = info[y].split(split1)[0];
								var fname = info[y].split(split1)[1];
								existGroup.options.add(new Option(fname, fid));
							}
						}
					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});
}
// 单击组别名称
function onGroupClick() {
	var existGroup = document.getElementById("existGroup");
	if (existGroup.selectedIndex != -1) {
		var fid = existGroup.options[existGroup.selectedIndex].value;
		var fname = existGroup.options[existGroup.selectedIndex].innerText;
		_.post({
					url : servletURL,
					beforeStart : _.Z,
					afterEnd : _.Z,
					json : {
						type : "action",
						servletType : "GlobalParam",
						action : "getGroupInfo",
						fid : fid
					},
					callback : function(r) {
						if (r.message == "ok") {
							document.getElementById("groupName").value = fname;
							document.getElementById("groupDesc").value = r.desc;
						} else {
							Ext.Msg.alert("系统提示", "操作失败：" + r.message);
						}
					}
				});
	}
}
function doGroupAdd() {
	document.getElementById("groupName").value = "";
	document.getElementById("groupName").focus();
	document.getElementById("groupDesc").value = "";
	document.getElementById("existGroup").value = "";

}

function doGroupDel() {
	var groupName = document.getElementById("groupName").value;
	var groupDesc = document.getElementById("groupDesc").value;
	var existGroup = document.getElementById("existGroup");
	var btn_del = document.getElementById("btn_groupDel");
	if (existGroup.options.selectedIndex != -1) {
		var fid = existGroup.options[existGroup.options.selectedIndex].value;
		_.post({
			url : servletURL,
			beforeStart : _.Z,
			afterEnd : _.Z,
			json : {
				type : "action",
				servletType : "GlobalParam",
				action : "doGroupDel",
				fid : fid,
				groupName : groupName,
				groupDesc : groupDesc
			},
			callback : function(r) {
				if (r.message == "ok") {
					Ext.Msg.alert("系统提示", " 操作已成功！");
					existGroup.options.remove(existGroup.options.selectedIndex);
					document.getElementById("groupName").value = "";
					document.getElementById("groupDesc").value = "";

				} else {
					Ext.Msg.alert("系统提示", "操作失败：" + r.message);
				}
			}
		});
	} else {
		Ext.Msg.alert("系统提示", "请先选择分组！");
	}
}
function doGroupUpdate() {
	var groupName = document.getElementById("groupName").value.replace(
			/(^\s*)|(\s*$)/, "");;
	var groupDesc = document.getElementById("groupDesc").value.replace(
			/(^\s*)|(\s*$)/, "");;
	var existGroup = document.getElementById("existGroup");

	if (groupName.lenght == 0 || groupDesc.length == 0) {
		Ext.Msg.alert("系统提示", "分组名称和分组描述不能为空！");
		return;
	}
	for (var i = 0; i < existGroup.options.length; i++) {
		var name = existGroup.options[i].innerText;
		if (existGroup.options.selectedIndex != i && name == groupName) {
			Ext.Msg.alert("系统提示", "相同分组名称已经存在！");
			return;
		}
	}

	if (existGroup.options.selectedIndex != -1) {// 修改
		var fid = existGroup.options[existGroup.options.selectedIndex].value;
		_.post({
			url : servletURL,
			beforeStart : _.Z,
			afterEnd : _.Z,
			json : {
				type : "action",
				servletType : "GlobalParam",
				action : "doGroupUpdate",
				fid : fid,
				groupName : groupName,
				groupDesc : groupDesc
			},
			callback : function(r) {
				if (r.message == "ok") {
					Ext.Msg.alert("系统提示", " 操作已成功！");
					existGroup.options[existGroup.options.selectedIndex].innerText = groupName;
				} else {
					Ext.Msg.alert("系统提示", "操作失败：" + r.message);
				}
			}
		});

	} else {// 新增
		_.post({
					url : servletURL,
					beforeStart : _.Z,
					afterEnd : _.Z,
					json : {
						type : "action",
						servletType : "GlobalParam",
						action : "doGroupAdd",
						groupName : groupName,
						groupDesc : groupDesc
					},
					callback : function(r) {
						if (r.message == "ok") {
							Ext.Msg.alert("系统提示", " 操作已成功！");
							existGroup.options.add(new Option(groupName, r.id));
						} else {
							Ext.Msg.alert("系统提示", "操作失败：" + r.message);
						}
					}
				});

	}

}
// 过滤项定义
function initParamList() {
	var groups = document.getElementById("groups");
	var existParam = document.getElementById("existParam");
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getGroupList"
				},
				callback : function(r) {
					if (r.message == "ok") {
						if (r.empty != "true") {
							var info = (r.info).split(split2);
							for (var i = groups.options.length - 1; i >= 0; i--) {
								groups.options.remove(i);
							}
							for (var y = 0; y < info.length; y++) {
								var fid = info[y].split(split1)[0];
								var fname = info[y].split(split1)[1];
								groups.options.add(new Option(fname, fid));
							}
						}
					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "getParamList"
				},
				callback : function(r) {
					if (r.message == "ok") {
						if (r.empty != "true") {
							var info = (r.info).split(split2);
							// 参数列表
							for (var i = existParam.options.length - 1; i >= 0; i--) {
								existParam.options.remove(i);
							}
							for (var y = 0; y < info.length; y++) {
								var fid = info[y].split(split1)[0];
								var fparamname = info[y].split(split1)[1];
								var fparamtitle = info[y].split(split1)[2];
								existParam.options
										.add(new Option(fparamname + "("
														+ fparamtitle + ")",
												fid));
							}
						}
					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});

}
function doParamAdd() {

	document.getElementById("paramName").value = "";
	document.getElementById("paramName").focus();
	document.getElementById("filterItem").value = "";
	document.getElementById("groups").value = "";
	document.getElementById("paramTitle").value = "";
	document.getElementById("item_index").value = "";
	document.getElementById("report_path").value = "";
	document.getElementById("existParam").value = "";

}
function doParamDel() {
	var existParam = document.getElementById("existParam");
	if (existParam.options.selectedIndex != -1) {
		var fid = existParam.options[existParam.options.selectedIndex].value;
		_.post({
			url : servletURL,
			beforeStart : _.Z,
			afterEnd : _.Z,
			json : {
				type : "action",
				servletType : "GlobalParam",
				action : "doParamDel",
				fid : fid
			},
			callback : function(r) {
				if (r.message == "ok") {
					Ext.Msg.alert("系统提示", " 操作已成功！");
					existParam.options.remove(existParam.options.selectedIndex);
					document.getElementById("paramName").value = "";
					document.getElementById("filterItem").value = "";
					document.getElementById("groups").value = "";
					document.getElementById("paramTitle").value = "";
				} else {
					if (window.confirm("该全局参数已经被引用,确定删除吗？")) {
						_.post({
							url : servletURL,
							beforeStart : _.Z,
							afterEnd : _.Z,
							json : {
								type : "action",
								servletType : "GlobalParam",
								action : "doComfirmParamDel",
								fid : fid
							},
							callback : function(r) {					
								if (r.message == "ok") {
									Ext.Msg.alert("系统提示", " 操作已成功！");
									existParam.options
											.remove(existParam.options.selectedIndex);
									document.getElementById("paramName").value = "";
									document.getElementById("filterItem").value = "";
									document.getElementById("groups").value = "";
									document.getElementById("paramTitle").value = "";
								}
							}
						})
					}
				}
			}
		});
	} else {
		Ext.Msg.alert("系统提示", "请先选择参数定义！");
	}
}
function doParamSave() {

	var paramName = document.getElementById("paramName").value.replace(
			/(^\s*)|(\s*$)/, "");
	var filterItem = document.getElementById("filterItem").value.replace(
			/(^\s*)|(\s*$)/, "");
	var group = document.getElementById("groups");
	var groupId = group.value.replace(/(^\s*)|(\s*$)/, "");
	var groupName = group.options[group.selectedIndex].innerText;

	var paramTitle = document.getElementById("paramTitle").value.replace(
			/(^\s*)|(\s*$)/, "");
	var item_index = document.getElementById("item_index").value;

	var report_path = document.getElementById("report_path").value;

	var existParam = document.getElementById("existParam");

	if (paramName.lenght == 0 || filterItem.length == 0
			|| paramTitle.length == 0 || groupId.length == 0) {
		Ext.Msg.alert("系统提示", "参数名称、过滤条目、分组、显示标题不能为空！");
		return;
	}

	if (existParam.options.selectedIndex != -1) {// 修改
		var fid = existParam.options[existParam.options.selectedIndex].value;

		_.post({
			url : servletURL,
			beforeStart : _.Z,
			afterEnd : _.Z,
			json : {
				type : "action",
				servletType : "GlobalParam",
				action : "doParamSave",
				fid : fid,
				groupId : groupId,
				paramName : paramName,
				paramTitle : paramTitle,
				caption : filterItem,
				report_path : report_path,
				item_index : item_index
			},
			callback : function(r) {
				if (r.message == "ok") {
					Ext.Msg.alert("系统提示", " 操作已成功！");
					existParam.options[existParam.options.selectedIndex].innerText = groupName
							+ "：   " + paramName + "(" + paramTitle + ")";

				} else {
					Ext.Msg.alert("系统提示", "操作失败：" + r.message);
				}
			}
		});
	} else {// 新增
		_.post({
					url : servletURL,
					beforeStart : _.Z,
					afterEnd : _.Z,
					json : {
						type : "action",
						servletType : "GlobalParam",
						action : "doParamAdd",
						groupId : groupId,
						paramName : paramName,
						paramTitle : paramTitle,
						caption : filterItem,
						report_path : report_path,
						item_index : item_index
					},
					callback : function(r) {
						if (r.message != "exist") {
							if (r.message == "ok") {
								existParam.options.add(new Option(groupName
												+ "：   " + paramName + "("
												+ paramTitle + ")", r.id));
								Ext.Msg.alert("系统提示", " 操作已成功！");
							} else {
								Ext.Msg.alert("系统提示", "操作失败：" + r.message);
							}
						} else {
							Ext.Msg.alert("系统提示", "参数名已经存在!");
						}
					}
				});

	}
}

function onParamClick() {
	var existParam = document.getElementById("existParam");
	if (existParam.selectedIndex != -1) {
		var fid = existParam.options[existParam.selectedIndex].value;
		_.post({
			url : servletURL,
			beforeStart : _.Z,
			afterEnd : _.Z,
			json : {
				type : "action",
				servletType : "GlobalParam",
				action : "getParamInfo",
				fid : fid
			},
			callback : function(r) {
				if (r.message == "ok") {
					document.getElementById("paramName").value = r.fparamname;
					document.getElementById("filterItem").value = r.fparamcaption;
					document.getElementById("groups").value = r.fgroupid;
					document.getElementById("paramTitle").value = r.fparamtitle;
					document.getElementById("item_index").value = r.fparamindex;
					document.getElementById("report_path").value = r.fparamreportpath;
				} else {
					Ext.Msg.alert("系统提示", "操作失败：" + r.message);
				}
			}
		});
	}
}
// 获取参数条目
var itemWin = null;
var report_path = "";
function getReportList() {
	r = treeRoot;
	itemWin = new Ext.Window({
				modal : true,
				width : 450,
				height : 400,
				title : "提取过滤条目",
				html : _.loadUIT("bi_dialog_globalparam_itemlist")
			});
	itemWin.show();

	var btn_selectItemList = document.getElementById("btn_selectItemList");
	var btn_ItemListClose = document.getElementById("btn_ItemListClose");

	bi.updateToPortalStyleButton(btn_selectItemList);
	bi.updateToPortalStyleButton(btn_ItemListClose);
	var tree_container = document.getElementById("tree_container");
	tree = Sue.ui.tree({
				parent : tree_container,
				caption : "",
				getIcon : function(node, f) {
					return node.expanded && f("folderopen") || node.folder
							&& f("folder") || f("report");
				}
			});
	// 构造根节点并将该根节点与树榜定
	var Node = tree.getNodeConstructor();
	var rootNode = Node({
				caption : "主题分析",
				folder : true
			});
	tree.setRoot(rootNode);

	if (r != "empty") {
		var a = r.split("|"), aa;// 按"|"分解返回的字符串
		var nodes = [];
		for (var i = 0, len = a.length; i < len; i++) {
			aa = a[i].split(",");
			if (aa[4] == "olap") {
				nodes.push(Node({
							caption : aa[0],
							value : {
								id : aa[1],
								url : aa[2]
							},
							folder : aa[3] != "false",
							lazyload : aa[3] == "false" ? null : pieceLazyload,
							click : getItemListByReport,
							dblclick : _.Z
						}));
				rootNode.append(nodes);// 将节点加到根节点中
			}

		}
	}

}
function pieceLazyload(node, callback) {
	var path = decodeURIComponent(node.value.url
			.match(/repositoryPath\=(.*?)(&.*?)?$/)[1]);// 获取当前主题的Path
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					servletType : "BIWebUtil",
					id : path,
					treeType : "configReport"
				},
				callback : function(r) {
					if (r != "empty") {
						var nodes = [];
						var a = r.split("|"), aa, node;
						var Node = tree.getNodeConstructor();
						for (var i = 0, len = a.length; i < len; i++) {
							aa = a[i].split(",");
							if (aa[4] == "olap") {
								node = Node({
											caption : aa[0],
											value : {
												id : aa[1],
												url : aa[2]
											},
											folder : aa[3] != "false",
											click : getItemListByReport,
											lazyload : aa[3] == "false"
													? null
													: pieceLazyload
										});
								nodes.push(node);
							}
						}
						callback(nodes);
					} else {
						callback([]);
					}
				}
			});
}
function getItemListByReport(node) {
	var path = decodeURIComponent(node.value.url
			.match(/repositoryPath\=(.*?)(&.*?)?$/)[1]);// 获取当前主题的Path
	report_path = path;
	var item_table = document.getElementById("item_table");
	_.post({
		url : servletURL,
		beforeStart : _.Z,
		afterEnd : _.Z,
		json : {
			type : "action",
			servletType : "GlobalParam",
			action : "getItemListByReport",
			path : path
		},
		callback : function(r) {
			var num = item_table.rows.length;
			for (var i = num - 1; i > 0; i--) {
				item_table.deleteRow(i);
			}
			if (r.message != "empty") {
				if (r.message == "ok") {
					for (var i = 0; i < r.items.length; i++) {
						var caption = (r.items[i]).caption;
						var newRow = item_table.insertRow();
						var newCell0 = newRow.insertCell(); // 创建新单元格
						var newCell1 = newRow.insertCell(); // 创建新单元格
						newCell0.innerHTML = "<input type='radio' name='Item_radio' value='"
								+ i + "'/>";
						newCell1.innerText = caption;
					}
				} else {
					Ext.Msg.alert("系统提示", "操作失败：" + r.message);
				}
			}
		}
	});
}
function doSelectItemList() {
	var Item_radio = document.getElementsByName("Item_radio");
	var item_table = document.getElementById("item_table");
	var selectedIndex = -1;
	var caption = "";
	for (var i = 0; i < Item_radio.length; i++) {
		if (Item_radio[i].checked) {
			selectedIndex = i;
			caption = item_table.rows[i + 1].cells[1].innerText;
			break;
		}
	}
	if (selectedIndex == -1) {
		Ext.Msg.alert("系统提示", "请选择条目！");
	} else {
		document.getElementById("filterItem").value = caption;
		document.getElementById("item_index").value = selectedIndex;
		document.getElementById("report_path").value = report_path;
		itemWinClose();
	}
}
function itemWinClose() {
	itemWin.close();
}
// 保存参数值定义
function doParamInitSave() {
	var ids = "";
	var values = "";
	var captions = "";
	for (var i = 0; i < lst.length; i++) {
		var value = document.getElementById(lst[i].paramid).value.replace(
				/(^\s*)|(\s*$)/, "");
		var caption = document.getElementById("caption_" + lst[i].paramid).value
				.replace(/(^\s*)|(\s*$)/, "");
		if (value.length > 0) {
			ids = ids + lst[i].paramid + split2;
			values = values + value + split2;
		} else {
			ids = ids + lst[i].paramid + split2;
			values = values + "empty" + split2;
		}
		if (caption.length > 0) {
			captions = captions + caption + split2;
		} else {
			captions = captions + "empty" + split2;
		}
	}
	_.post({
				url : servletURL,
				beforeStart : _.Z,
				afterEnd : _.Z,
				json : {
					type : "action",
					servletType : "GlobalParam",
					action : "doParamInitSave",
					ids : ids.substring(0, ids.length - split2.length),
					values : values.substring(0, values.length - split2.length),
					captions : captions.substring(0, captions.length
									- split2.length)
				},
				callback : function(r) {
					if (r.message == "ok") {
						Ext.Msg.alert("系统提示", " 操作已成功！");
					} else {
						Ext.Msg.alert("系统提示", "操作失败：" + r.message);
					}
				}
			});
}
