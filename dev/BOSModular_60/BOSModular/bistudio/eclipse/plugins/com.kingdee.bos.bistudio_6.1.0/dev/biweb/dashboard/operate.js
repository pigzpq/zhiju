//该文件定义操作。包括工具栏按钮对应的操作，设计区对象选中操作等。

var _oSelectionModel = new SelectionModel();//选中模

///////////////////////////////////////////////////////////
// 以下 _xxx() 函数中的xxx与工具栏按钮定义时的函数名称一致
///////////////////////////////////////////////////////////
function _save()
{   
    if(_oModel.isEmpty()){
	    bi.portalDialog("仪表板不能为空！");
	}else{
		var sXml=_oModel.save();
		if(sXml!="duplicate")//如果对象名不重复则执行保存操作
		{
			_env.save(sXml, function( error ) {
				if ( error ) {
					bi.portalDialog("保存仪表板失败！出错原因：" + error.message);
				} else {
					bi.portalDialog("保存仪表板成功");
				}
			});
		}
	}
}

function _upload()
{
	var resDlg = new ResourceDialog(_env.servletURL);
	resDlg.showUpload();
}

function _preview()
{
	window.dashboardXml = _oModel.save();
	//var scrollSize = 50;
	var sArg = 'dialogWidth:' + screen.availWidth +'px; dialogHeight:'
		+ screen.availHeight + 'px; help:no; scroll:yes; status:no; resizable:yes;'; 
	var bReturn = showModalDialog("show_dashboard.htm?requestType=post&url="  
		+ _env.servletURL + "&servletType=BIDashBoard" , window, sArg);
}

function _delete()
{
	var oSelected = _oSelectionModel.getLastSelected();
	if(oSelected instanceof Layout)//选中单元格，清空其子
	{
		if(confirm("您确定要清除选中单元格里的内容吗？"))
		{
			var iLen = _oSelectionModel.aSelected.length;
			for(var i = 0; i < iLen; i++)
			{
				var oLayout = _oSelectionModel.aSelected[i];
				var oCell = oLayout.oLayoutTable.getChild(oLayout.iRowIdx, oLayout.iColIdx);
				oLayout.oLayoutTable.removeChild(oCell);
			}
			_oModel.setDirty(true);
		}
	}
	else if(oSelected instanceof AbstractCell)//选中单元对象，删除掉
	{
		if(confirm("您确定要删除选中对象吗？"))
		{
			var iLen = _oSelectionModel.aSelected.length;
			var oSelectTargetAfterDelete;
			for(var i = 0; i < iLen; i++)
			{
				var oCell = _oSelectionModel.aSelected[i];
				var oLayout = oCell.oLayout;
				if(oCell.hasLayout())//在布局表格中
				{
					oLayout.oLayoutTable.removeChild(oCell);
					if(!oSelectTargetAfterDelete)
					{
						oSelectTargetAfterDelete = oLayout;
					}
				}
				else//在可切换组件集合中
				{
					_oModel.oSwitchableCtrlsManager.removeCell(oCell);
					_oModel.oSwitchableCtrlsManager.syncUI();
				}
			}
			
			if(oSelectTargetAfterDelete)
			{
				_oSelectionModel.addSelected(oSelectTargetAfterDelete);
			}
			_oModel.setDirty(true);
		}
	}
	else
	{
		alert("未选中删除目标。");
	}
}

function _insertRow()
{
	if(_oSelectionModel.aSelected.length == 0)
	{
		alert("请选中要插入行的目标位置。");
		return;
	}
	if(_oSelectionModel.aSelected.length > 1)
	{
		alert("插入行的目标位置必须唯一。");
		return;
	}
	var oSelected = _oSelectionModel.getLastSelected();
	var oLayout;
	if(oSelected instanceof Layout)//选中单元格
	{
		oLayout = oSelected;
	}
	else if(oSelected instanceof AbstractCell)//选中单元对象
	{
		if(oSelected.hasLayout())//在布局表格中
		{
			oLayout = oSelected.oLayout;
		}
		else//在可切换组件集合中
		{
			alert("请选中要插入行的目标位置。");
			return;
		}
	}
	var oParms = new Object();
	oParms.sTypeText = "行";
	oParms.oLayoutTable = oLayout.oLayoutTable;
	oParms.oLimited = _oModel.oLimited;
	_wrapHTMLPageInDialog( 
	{
		uri: "dlgInsertRowCol.htm",
		width: 240,
		height: 200,
		param: oParms,
		callback: function(returnValue) 
		{
			if(!returnValue)
			{
				return;
			}
			var bBeforeThis = oParms.bBeforeThis;
			var iInsertNums = oParms.iInsertNums;
			
			_oSelectionModel.clearSelected();
			var oLayoutTable = oLayout.oLayoutTable;
			var iRowIdx = oLayout.iRowIdx;
			var iColIdx = oLayout.iColIdx;
			if(!bBeforeThis)
			{
				var mb = oLayoutTable.getMergeBlock(iRowIdx, iColIdx);
				if(mb)
				{
					iRowIdx = mb.iBottom;
				}
			}
			for(var i = 0; i < iInsertNums; i++)
			{
				var iNewRowIdx = oLayoutTable.insertRow(iRowIdx, bBeforeThis, 20);
				//添加选中，不一定是这次循环新插入的，但一定是循环这一批的。
				var iAddSelectIdx = iNewRowIdx + i;
				var oNewSelected = new Layout(oLayoutTable, iAddSelectIdx, iColIdx);
				_oSelectionModel.addSelectedInner(oNewSelected, true, false);//加[Ctrl]，多选
			}
			//整个UI重建
			_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
			_oSelectionModel.syncUI("selected");
			_oModel.setDirty(true);
		}
	});
}

function _deleteRow()
{
	if(_oSelectionModel.aSelected.length == 0)
	{
		alert("请选中要删除行的任一单元格。");
		return;
	}
	var oSelected = _oSelectionModel.getLastSelected();
	var oLayout;
	if(oSelected instanceof Layout)//选中单元格
	{
		oLayout = oSelected;
	}
	else
	{
		alert("请选中表格的单元格，以确定要删除的行。");
		return;
	}
	if(!confirm("您确定要删除选中单元格所在的整行吗？"))
	{
		return;
	}
	//要删除的行号，在array中唯一
	var aRowIdxs = new Array();
	for(var i = 0; i < _oSelectionModel.aSelected.length; i++)
	{
		oSelected = _oSelectionModel.aSelected[i];
		var bExist = false;
		for(var j = 0; j < aRowIdxs.length; j++)
		{
			if(aRowIdxs[j] == oSelected.iRowIdx)
			{
				bExist = true;
				break;
			}
		}
		if(!bExist)
		{
			aRowIdxs.push(oSelected.iRowIdx);
		}
	}
	var oLayoutTable = oLayout.oLayoutTable;
	if(aRowIdxs.length == oLayoutTable.iRows)
	{
		alert("不能把表格全部行都删除。");
		return;
	} 
	//从小到大排序
	aRowIdxs.sort(function(iNum1, iNum2){return iNum1 - iNum2});
	//从大到小删除
	for(var i = aRowIdxs.length - 1; i >= 0; i--)
	{
		oLayoutTable.deleteRow(aRowIdxs[i]);
	}
	_oSelectionModel.clearSelected();
	_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
	_oModel.setDirty(true);
}

function _insertCol()
{
	if(_oSelectionModel.aSelected.length == 0)
	{
		alert("请选中要插入行的目标位置。");
		return;
	}
	if(_oSelectionModel.aSelected.length > 1)
	{
		alert("插入行的目标位置必须唯一。");
		return;
	}
	var oSelected = _oSelectionModel.getLastSelected();
	var oLayout;
	if(oSelected instanceof Layout)//选中单元格
	{
		oLayout = oSelected;
	}
	else if(oSelected instanceof AbstractCell)//选中单元对象
	{
		if(oSelected.hasLayout())//在布局表格中
		{
			oLayout = oSelected.oLayout;
		}
		else//在可切换组件集合中
		{
			alert("请选中要插入行的目标位置。");
			return;
		}
	}
	var oParms = new Object();
	oParms.sTypeText = "列";
	oParms.oLayoutTable = oLayout.oLayoutTable;
	oParms.oLimited = _oModel.oLimited;
	_wrapHTMLPageInDialog( 
	{
		uri: "dlgInsertRowCol.htm",
		width: 240,
		height: 200,
		param: oParms,
		callback: function(returnValue) 
		{
			if(!returnValue)
			{
				return;
			}
			var bBeforeThis = oParms.bBeforeThis;
			var iInsertNums = oParms.iInsertNums;
			
			_oSelectionModel.clearSelected();
			var oLayoutTable = oLayout.oLayoutTable;
			var iRowIdx = oLayout.iRowIdx;
			var iColIdx = oLayout.iColIdx;
			if(!bBeforeThis)
			{
				var mb = oLayoutTable.getMergeBlock(iRowIdx, iColIdx);
				if(mb)
				{
					iColIdx = mb.iRight;
				}
			}
			for(var i = 0; i < iInsertNums; i++)
			{
				var iNewColIdx = oLayoutTable.insertCol(iColIdx, bBeforeThis, 50);
				//添加选中，不一定是这次循环新插入的，但一定是循环这一批的。
				var iAddSelectIdx = iNewColIdx + i;
				var oNewSelected = new Layout(oLayoutTable, iRowIdx, iAddSelectIdx);
				_oSelectionModel.addSelectedInner(oNewSelected, true, false);//加[Ctrl]，多选
			}
			//整个UI重建
			_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
			_oSelectionModel.syncUI("selected");
			_oModel.setDirty(true);
		}
	});
}
function _deleteCol()
{
	if(_oSelectionModel.aSelected.length == 0)
	{
		alert("请选中要删除列的任一单元格。");
		return;
	}
	var oSelected = _oSelectionModel.getLastSelected();
	var oLayout;
	if(oSelected instanceof Layout)//选中单元格
	{
		oLayout = oSelected;
	}
	else
	{
		alert("请选中表格的单元格，以确定要删除的列。");
		return;
	}
	if(!confirm("您确定要删除选中单元格所在的整列吗？"))
	{
		return;
	}
	//要删除的列号，在array中唯一
	var aColIdxs = new Array();
	for(var i = 0; i < _oSelectionModel.aSelected.length; i++)
	{
		oSelected = _oSelectionModel.aSelected[i];
		var bExist = false;
		for(var j = 0; j < aColIdxs.length; j++)
		{
			if(aColIdxs[j] == oSelected.iColIdx)
			{
				bExist = true;
				break;
			}
		}
		if(!bExist)
		{
			aColIdxs.push(oSelected.iColIdx);
		}
	}
	var oLayoutTable = oLayout.oLayoutTable;
	if(aColIdxs.length == oLayoutTable.iCols)
	{
		alert("不能把表格全部列都删除。");
		return;
	} 
	//从小到大排序
	aColIdxs.sort(function(iNum1, iNum2){return iNum1 - iNum2});
	//从大到小删除
	for(var i = aColIdxs.length - 1; i >= 0; i--)
	{
		oLayoutTable.deleteCol(aColIdxs[i]);
	}
	_oSelectionModel.clearSelected();
	_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
	_oModel.setDirty(true);
}

function _merge()
{
	if(_oSelectionModel.aSelected.length <= 1
		|| !(_oSelectionModel.aSelected[0] instanceof Layout))
	{
		alert("融合操作必须选中多个目标单元格，并形成块状。");
		return;
	}
	
	var oLayoutTable = _oSelectionModel.aSelected[0].oLayoutTable;
	var iRows = oLayoutTable.iRows;
	var iCols = oLayoutTable.iCols;
	
	//初始化选中标志
	var aaSelected = new Array();
	for(var i = 0; i < iRows; i++)
	{
		aaSelected[i] = new Array();
		for(var j = 0; j < iCols; j++)
		{
			aaSelected[i][j] = false;
		}
	}
	
	var aMbToRemove = new Array();
	//选中单元格的最大最小行列号
	var iMinRow = 32767;
	var iMaxRow = -1;
	var iMinCol = 32767;
	var iMaxCol = -1;
	for(var i = 0; i < _oSelectionModel.aSelected.length; i++)
	{
		var oLayout = _oSelectionModel.aSelected[i];
		var mb = oLayout.oLayoutTable.getMergeBlock(oLayout.iRowIdx, oLayout.iColIdx)
		if(mb)//选中集合中带有融合块
		{
			aMbToRemove.push(mb);
			for(var r = mb.iTop; r <= mb.iBottom; r++)
			{
				for(var c = mb.iLeft; c <= mb.iRight; c++)
				{
					aaSelected[r][c] = true;
				}
			}
			iMinRow = (mb.iTop < iMinRow ? mb.iTop : iMinRow);
			iMaxRow = (mb.iBottom > iMaxRow ? mb.iBottom : iMaxRow);
			iMinCol = (mb.iLeft < iMinCol ? mb.iLeft : iMinCol);
			iMaxCol = (mb.iRight > iMaxCol ? mb.iRight : iMaxCol);
		}
		else
		{
			aaSelected[oLayout.iRowIdx][oLayout.iColIdx] = true;
			iMinRow = (oLayout.iRowIdx < iMinRow ? oLayout.iRowIdx : iMinRow);
			iMaxRow = (oLayout.iRowIdx > iMaxRow ? oLayout.iRowIdx : iMaxRow);
			iMinCol = (oLayout.iColIdx < iMinCol ? oLayout.iColIdx : iMinCol);
			iMaxCol = (oLayout.iColIdx > iMaxCol ? oLayout.iColIdx : iMaxCol);
		}
	}
	
	//记录最左上的子对象
	var oCellMostLeftTop;
	//被融合掉的其它单元对象要删掉，同时也作为包含多个单元对象的标记
	var aCellsToRemove = new Array();
	//能否组成块状
	var bIsBlock = true;
	for(var i = 0; i < iRows; i++)
	{
		for(var j = 0; j < iCols; j++)
		{
			if(i >= iMinRow && i <= iMaxRow && j >= iMinCol && j <= iMaxCol)
			{
				if(!aaSelected[i][j])
				{
					//在最大最小之间，但没有选中
					bIsBlock = false;
					break;
				}
				
				var oCell = oLayoutTable.getChild(i, j);
				if(oCell)
				{
					if(!oCellMostLeftTop)
					{
						oCellMostLeftTop = oCell;
					}
					else
					{
						aCellsToRemove.push(oCell);
					}
				}
			}
			else
			{
				if(aaSelected[i][j])
				{
					//不在最大最小之间，却选中了
					bIsBlock = false;
					break;
				}
			}
		}
		if(!bIsBlock)
		{
			alert("选中目标不是块状，不能融合。");
			return;
		}
	}
	
	if(aCellsToRemove.length > 0 
		&& !confirm("选中单元格中包含多个单元对象，融合后只能保留最左上的一个。您确定进行融合吗？"))
	{
		return;
	}
	
	for(var i = 0; i < aMbToRemove.length; i++)
	{
		oLayoutTable.removeMergeBlock(aMbToRemove[i]);
	}
	oLayoutTable.addMergeBlock(iMinRow, iMinCol, iMaxRow, iMaxCol);

	//融合后保留最左上的单元对象
	if(oCellMostLeftTop)
	{
		oCellMostLeftTop.oLayout.iRowIdx = iMinRow;
		oCellMostLeftTop.oLayout.iColIdx = iMinCol;
	}
	//其它的单元对象删掉
	for(var i = 0; i < aCellsToRemove.length; i++)
	{
		oLayoutTable.removeChild(aCellsToRemove[i]);
	}
	
	oLayoutTable.optimize();
	
	//整个UI重建
	_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
	//选中融合后的整块
	var oLayout = new Layout(oLayoutTable, iMinRow, iMinCol, oLayout ? oLayout.name : "");
	_oSelectionModel.addSelected(oLayout);
	_oModel.setDirty(true);
}

function _unMerge()
{
	//单选单元格
	if(_oSelectionModel.aSelected.length == 1
		&& (_oSelectionModel.getLastSelected() instanceof Layout))
	{
		var oLayout = _oSelectionModel.getLastSelected();
		//且为融合块
		var aMbs = oLayout.oLayoutTable.aMergeBlocks;
		for(var i = 0; i < aMbs.length; i++)
		{
			var mb = aMbs[i];
			if(mb.isMainCell(oLayout.iRowIdx, oLayout.iColIdx))
			{  
				aMbs.splice(i, 1);
				//整个UI重建
				_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
				//重画选中
				_oSelectionModel.syncUI("selected");
				_oModel.setDirty(true);
				return;
			}
		}
		//原来拆分是融合的反操作，09-8-12增加未融合单元格的“拆分”功能
		var oParms = new Object();
		oParms.oLayoutTable = oLayout.oLayoutTable;
		oParms.oLimited = _oModel.oLimited;
		_wrapHTMLPageInDialog( 
		{
			uri: "dlgSplit.htm",
			width: 240,
			height: 180,
			param: oParms,
			callback: function(returnValue) 
			{
				if(!returnValue)
				{
					return;
				}
				var iRowNums = oParms.iRowNums;
				var iColNums = oParms.iColNums;
				if(iRowNums > 1 || iColNums > 1)
				{
					oLayout.oLayoutTable.split(oLayout.iRowIdx, oLayout.iColIdx, iRowNums, iColNums);
					_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
					_oSelectionModel.syncUI("selected");
					_oModel.setDirty(true);
				}
			}
		});
		return;
	}
	alert("拆分操作必须单选表格的单元格。");
}

function _layoutSetting()
{
	var oParms = new Object();
	oParms.servletURL = _env.servletURL;
	oParms.iWidth = (_oModel.oLayoutTable == null ? 800 : _oModel.oLayoutTable.getWidth());
	oParms.iHeight = (_oModel.oLayoutTable == null ? 600 : _oModel.oLayoutTable.getHeight());
	oParms.iRows = (_oModel.oLayoutTable == null ? 2 : _oModel.oLayoutTable.iRows);
	oParms.iCols = (_oModel.oLayoutTable == null ? 2 : _oModel.oLayoutTable.iCols);
	oParms.sBackgroundPic = _oModel.sBackgroundPic;
	oParms.sBackgroundScale = _oModel.sBackgroundScale;
	oParms.sBackgroundColor = _oModel.sBackgroundColor;
	oParms.oLimited = _oModel.oLimited;
	
	_wrapHTMLPageInDialog( {
		uri: "dlgLayout.htm",
		width: 550,
		height: 400,
		param: oParms,
		callback: function( returnValue ) {
			if ( !returnValue ) return;
			_oModel.sBackgroundPic = oParms.sBackgroundPic;
			_oModel.sBackgroundScale = oParms.sBackgroundScale;
			_oModel.sBackgroundColor = oParms.sBackgroundColor;
			_oDesignArea.updateUI();
				
			var bRowsChanged = true;
			var bColsChanged = true;
			var newRows = oParms.iRows;
			var newCols = oParms.iCols;
			var newHeight = oParms.iHeight;
			var newWidth = oParms.iWidth;
			var oLayoutTable = _oModel.oLayoutTable;
			if(oLayoutTable == null)
			{
				oLayoutTable = new LayoutTable(newRows, newCols);
				_oModel.oLayoutTable = oLayoutTable;
				oLayoutTable.setSizeChangedListener(function(iWidth, iHeight)
					{
						_oDesignArea.setSize(iWidth, iHeight);
					});
			}
			else
			{
				var oldRows = oLayoutTable.iRows;
				var oldHeight = oLayoutTable.getHeight();
				bRowsChanged = (oldRows != newRows || oldHeight != newHeight);
				oLayoutTable.setRows(newRows);
				
				var oldCols = oLayoutTable.iCols;
				var oldWidth = oLayoutTable.getWidth();
				bColsChanged = (oldCols != newCols || oldWidth != newWidth);
				oLayoutTable.setCols(newCols);
			}
			oLayoutTable.setHeight(newHeight);
			oLayoutTable.setWidth(newWidth);
			
			if(bRowsChanged || bColsChanged)
			{
				//重新做UI		
				_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
				_oModel.setDirty(true);
				_oSelectionModel.aSelected.splice(0, _oSelectionModel.aSelected.length);
			}
		}
	} );
}

function _propertySetting()
{
	var aTargets = _oSelectionModel.aSelected;
	if(aTargets.length == 0)
	{
		alert("未选中设置属性的目标。");
		return;
	}
	
	var oTarget = null;
	if(aTargets.length == 1)
	{
		oTarget = aTargets[0];
	}
	else
	{
		if(!aTargets[0].isMultiSettingSupported())
		{
			alert("该类型对象不支持多选设置属性。");
			return;
		}
		//拼一个新对象，融合多选属性
		oTarget = aTargets[0].clone();
		for(var i = 1; i < aTargets.length; i++)
		{
			oTarget.mergePropertyFrom(aTargets[i]);
		}
	}
	
	if(oTarget != null)
	{
		oTarget.propertySetting( function() {
			if(aTargets.length > 1)
			{
				//oTarget应用回每一个对象
				for(var i = 0; i < aTargets.length; i++)
				{
					aTargets[i].applyProperty(oTarget);
				}
			}
			_oModel.setDirty(true);
			_oModel.buildUI(_oDesignArea.oHtmlDesignContainer);
			_oSelectionModel.syncUI("selected");
		} );
	}
}

function _linkResource()
{
	var aTargets = _oSelectionModel.aSelected;
	if(aTargets.length == 0)
	{
		alert("未选中链接资源的目标对象。");
		return;
	}
	
	var oTarget = null;
	if(aTargets.length == 1)
	{
		oTarget = aTargets[0];
	}
	else
	{
		alert("不允许多选对象链接资源。");
		return;
	}
	if((oTarget instanceof AbstractCell) && oTarget.isCanLinkResource())
	{
		oTarget.linkResource( function() {
			_oModel.setDirty( true );
		} );
	}
	else
	{
		alert("当前选中目标不支持链接资源。");
	}

}

function _bindResource()
{
	var aTargets = _oSelectionModel.aSelected;
	if(aTargets.length == 0)
	{
		alert("未选中绑定资源的目标对象。");
		return;
	}
	
	var oTarget = null;
	if(aTargets.length == 1)
	{
		oTarget = aTargets[0];
	}
	else
	{
		alert("不允许多选对象绑定资源。");
		return;
	}
	if((oTarget instanceof AbstractCell) && oTarget.isMustBindResource())
	{
		oTarget.bindResource( function() {
			_oModel.setDirty( true );
		} );
	}
	else
	{
		alert("当前选中目标不支持绑定资源。");
	}
}

function _variantsDefine()
{
	_wrapHTMLPageInDialog( {
		uri: "dlgVarDef.htm",
		width: 640,
		height: 480,
		param: _oModel.oVariantsManager
	} );
}

function _datasourceManage() {
	var dialog = _.cache("dashboard_datasourcemanager");
	if ( !dialog ) {
		dialog = Sue.ui.ext.dialog( {
			caption: "数据源管理",
			width: 650,
			height: 550
		} );
		_.cache("dashboard_datasourcemanager", dialog);
		dialog.setContent( _.loadUIT("bi_dialog_dashboard_datasourcemanager") );
				
		var instance = null;
		
		var datasourceName = f("datasourceName");
		var maxRowCount = f( "maxRowCount" );
		var saveLocationSelect = f( "datasourceSaveLocation" );
		var datasourceTypeSelect = f("datasourceType");
		
		var cbDataCenter = f("cbdatacenter");
		var dataCenterList = f("datacenterlist");
	
		dataCenterList.disabled = true;
		_.bindEvent(cbDataCenter, "click", function( e ) {
   		dataCenterList.disabled = !cbDataCenter.checked;
	   		if(cbDataCenter.checked&&!cbDataCenter.inited)
	   		{
	   			initDataCenter();
	   		}
    	});
		function initDataCenter(defaultDataCenter)
		{
			if(!cbDataCenter.inited)
			{
				_.post( {
					url: _env.servletURL,
					json: {
						servletType: "getDataCenterList",
						async: false
					},
					callback: function( r ) 
					{
						var dcs = eval(r);
						if(!dcs)
						dcs = [];
						if(!(dcs instanceof Array))
							dcs = [dcs];
						for(i=0;i<dcs.length;i++)
						{
							var opt  =new Option(dcs[i],dcs[i]);
							if(dcs[i]==defaultDataCenter)
							opt.selected = true;
							dataCenterList.options[i] = opt;
						}
					}
				});
				cbDataCenter.inited = true;
			}
		}
		
		/*
		 * 屏蔽存储库共享
		_.bindEvent(f("newFolderIcon"), "click", function() {
			var pNode = tree.getSelectedNode();
			if ( !pNode || !pNode.folder ) {
				alert("请先选中一个目录，新目录将在这个目录上建立");
			} else {
				bi.input( {
					caption: "新建目录",
					text: "请输入新目录的名称：",
					//parentDialog: dialog,
					verify: function( folderName ) {
						folderName = folderName.replace( /(^\s*)|(\s*$)/g, "" );
						if ( !folderName ) {
							return {
								type: "warning",
								caption: "请输入新建目录名称"
							};
						} else if ( folderName > 80 ) {
							return {
								type: "warning",
								caption: "目录名称不能超过80个字符"
							};
						}
						return true;
					},
					ok: function( folderName ) {
						_.post( {
							url: webUtilServlet,
							json: {
								servletType: bi_tree_util.ServletType_BIWebUtil,
								action: "createDataSourceFolder",
								folderName: folderName,
								// TODO: 怎么指定父节点路径
								parentPath: "/"
							},
							callback: function() {
								var cNode = Node( {
									caption: folderName,
									folder: true,
									click: _.Z
								} );
								pNode.append( cNode );
							}
						} );
					}
				} );
			}
		} );
		*/
		_.bindEvent(f("newIcon"), "click", function() {
			instance = null;
			datasourceName.value = "";
			maxRowCount.value = "1000";
			tp.doSelect(tab0.uuid);
			saveLocationSelect.selectedIndex = 0;
			datasourceTypeSelect.selectedIndex = 0;
			dataSourceContentTextarea.value = "";
			dataSourceDescriptionTextarea.value = "";
			totalRowCount.innerHTML = "0";
			vList = oList = null;
			outputColumnCount = 0;
			validColumnDiv.innerHTML && _.gc(validColumnDiv.firstChild);
			outputColumnDiv.innerHTML && _.gc(outputColumnDiv.firstChild);
			tree.clearSelectedNode();
			btns.releaseContentArea.span.disabled = true;
			btns.getTableColumnsBtn.span.disabled = false;
			dataSourceContentTextarea.readOnly = false;
		} );
		_.bindEvent(f("saveIcon"), "click", function() {
			var datasourceType = datasourceTypeSelect.options[datasourceTypeSelect.selectedIndex].value;
			var saveLocation = saveLocationSelect.options[saveLocationSelect.selectedIndex].value;
			
			if (!datasourceName.value) {
				alert("请填写数据源名称");
				try {
					datasourceName.focus();
				} catch( e ) {}
				return;
			}
			if ( !/^[a-zA-Z]\w*$/.test( datasourceName.value ) ) {
				alert("数据源名称只能包含英文字符、数字和下划线，且必须英文字符开头。");
				try {
					datasourceName.focus();
				} catch( e ) {}
				return;
			}
			var useDataCenter = cbDataCenter.checked;
			var datacenter = "";
			if(useDataCenter)
			{
				datacenter = dataCenterList.value;
				if(!datacenter||datacenter=="")
				{
					alert("未选择数据中心");
					try {
					datasourceName.focus();
					} catch( e ) {}
					return;
				}
			}
			if (!maxRowCount.value) {
				alert("请填写最大返回行数");
				try {
					maxRowCount.focus();
				} catch( e ) {}
				return;
			}
			if (!dataSourceContentTextarea.value) {
				alert("请填写数据源查询语句");
				try {
					dataSourceContentTextarea.focus();
				} catch( e ) {}
				return;
			}
			if (!outputColumnCount) {
				alert("请定义数据源输出列");
				return;
			}
			var maxRowCountValue = +maxRowCount.value;
			// 系统允许的最大行数
			var MAX_ROW_COUNT = 10000;
			if ( isNaN( maxRowCountValue ) || maxRowCountValue < 1 || maxRowCountValue > MAX_ROW_COUNT ) {
				alert( "您的输入不合法，请输入1~" + MAX_ROW_COUNT + "的整数" );
				try {
					maxRowCount.focus();
				} catch( e ) {}
				return;
			}
			
			if ( saveLocation == "dashboard" ) {
				var param = {
					name: datasourceName.value,
					type: datasourceType,
					datacenter:datacenter,
					saveLocation: "dashboard",
					maxRowCount: maxRowCountValue,
					content: dataSourceContentTextarea.value,
					description: dataSourceDescriptionTextarea.value,
					outputColumns: _.map( oList.items, function( item ) {
						return {
							column: item.caption.match(/(.*?)\(.*\)$/)[1],
							alias: item.alias,
							type: item.type
						};
					} )
				};
				
				if ( instance && instance.isDashboardDataSource ) {
					if ( instance.param.name != param.name ) {
						var ds = SubScriptEngine.Runtime.NameManager.lookupIID( instance.param.iid );
						ds.changeName( param.name );
					}
					instance.param = param;
					tree.getSelectedNode().setCaption( param.name );
				} else {
					var ds = instance = new DataSource( param );
					var node = Node( {
						caption: datasourceName.value,
						click: editDatasource,
						ds: ds
					} );
					dashboardRoot.append( node );
					tree.selectNode( node );
				}
				_oModel.setDirty(true);
				alert( "保存成功！" );
				
			}
			/*
		 	 * 屏蔽存储库共享 
			else if ( saveLocation == "repository" ) {
				var dsPath = instance ? instance.param.dsPath : null;
				dsPath = dsPath || null;
				_.post( {
					url: webUtilServlet,
					json: {
						servletType: bi_tree_util.ServletType_BIWebUtil,
						action: "saveRepositoryDataSource",
						dsPath: dsPath,
						datasourceName: datasourceName.value,
						datasourceType: datasourceType,
						datasourceContent: dataSourceContentTextarea.value,
						dtasourceDescription: dataSourceDescriptionTextarea.value,
						outputColumns: _.map( oList.items, "caption" )
					},
					callback: function( r ) {
						var param = {
							dsPath: r,
							name: datasourceName.value,
							type: datasourceType,
							saveLocation: "repository",
							content: dataSourceContentTextarea.value,
							description: dataSourceDescriptionTextarea.value,
							outputColumns: _.map( oList.items, function( item ) {
								return {
									column: item.caption.match(/(.*?)\(.*\)$/)[1],
									alias: item.alias
								};
							} )
						};
						if ( instance && !instance.isDashboardDataSource ) {
							instance.param = param;
							tree.getSelectedNode().setCaption( param.name );
						} else {
							if ( !instance ) {
								instance = {
									param: param
								};
							} else {
								instance.param = param;
							}
							var node = Node( {
								caption: datasourceName.value,
								click: editDatasource,
								ds: instance
							} );
							repositoryNode.append( node );
							tree.selectNode( node );
						}						
						alert( "保存成功！" );
					}
				} );
			}
			*/
		});
		_.bindEvent(f("deleteIcon"), "click", function() {
			var node = tree.getSelectedNode();
			/*
		 	 * 屏蔽存储库共享
			if ( node && node.isRoot ) {
				alert("根目录不能删除");
				return;
			}
			if ( node && node.folder && confirm("确实要删除目录" + node.caption + "吗？" ) ) {
				_.post( {
					url: webUtilServlet,
					json: {
						servletType: bi_tree_util.ServletType_BIWebUtil,
						action: "deleteDataSourceFolder",
						// TODO: 指定Path
						folderPath: "/"
					},
					callback: function() {
						
					}
				} );
				node.parent.remove( node );
			} else*/ 
			if (instance && confirm("确实要删除数据源" + instance.param.name + "吗？")) {
				if ( instance.param.saveLocation == "dashboard" ) {
					//判断是否被引用了
					var allCells = _oModel.getAllCells();
					var refCells = new Array();
					for(var i=0;i<allCells.length;i++)
					{
						var cell = allCells[i];
						if(cell.ds&&cell.ds.param&&instance.param.name==cell.ds.param.name)
						{
							refCells.push(cell);
						}
					}
					
					if(refCells.length>0)
					{
						if(!confirm('数据源已经被仪表板组件引用,删除数据源将自动删除引用,确认删除?'))
							return;
						for(var i=0;i<refCells.length;i++)
						{
							var cell = refCells[i];
							cell.ds = null;
							cell.commonUpdateUI();
						}
					}
							
				
				
					var ds = SubScriptEngine.Runtime.NameManager.lookupIID( instance.param.iid );
					SubScriptEngine.Runtime.NameManager.unregister( instance.param.iid );
					var dss = SubScriptEngine.Runtime.Dashboard.Datasources;
					var index = _.indexOf( dss, ds );
					dss.splice( index, 1 );
					instance.destroy();
					instance = null;
					var node = tree.getSelectedNode();
					tree.clearSelectedNode();
					dashboardRoot.remove( node );
					_oModel.setDirty(true);
					_.extractEvent(f("newIcon"), "click")();
				}
			/*
		 	 * 屏蔽存储库共享 
				else {
					_.post( {
						url: webUtilServlet,
						json: {
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "deleteRepositoryDataSource",
							dsPath: instance.param.dsPath
						},
						callback: function() {
							instance = null;
							var node = tree.getSelectedNode();
							tree.clearSelectedNode();
							repositoryNode.remove( node );
							_.extractEvent(f("newIcon"), "click")();
						}
					} );
				}
			 */
			}
		} );
		
		var tree = DataSource.getAllDataSourceTree( {
			parent: f("treeDiv"),
			isFolderSelected: true,
			dashboardNodeClick: editDatasource,
			repositoryNodeClick: getDataSourceFromRepository
		} ),
			Node = tree.getNodeConstructor(),
			dashboardRoot = tree.root.children[0];
		/*
		 * 屏蔽存储库共享
		var repositoryNode = tree.root.children[1];
		*/
		
		var tp = Sue.ui.ext.tabbedPanel( {
			parent: f("contentDiv")			
		} );
		var dataSourceContentTextarea,
			dataSourceDescriptionTextarea;
		var tab0 = tp.append( {
			caption: "查询语句",
			noclose: true,
			init: function() {
				dataSourceContentTextarea = _.crt("textarea", null, this.body, "border:none;width:100%;height:120px");
			}
		} );
		var tab1 = tp.append( {
			caption: "描述",
			noclose: true,
			init: function() {
				dataSourceDescriptionTextarea = _.crt("textarea", null, this.body, "border:none;width:100%;height:120px");
			}
		} );
		tp.append( {
			caption: "样本预览",
			noclose: true,
			init: function() {
				this.body.style.height = "124px";
				this.body.style.width = "100%";
				this.body.style.overflow = "auto";
			},
			select: function() {
				var _body = this.body;
				_body.innerHTML = "";
				if ( !dataSourceContentTextarea.value ) {
					return;
				}
				var useDataCenter = cbDataCenter.checked;
				var datacenter = "";
				if(useDataCenter)
				{
					datacenter = dataCenterList.value;
				}
				
				_.post( {
					url: webUtilServlet,
					json: [
						"*;",
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "getSqlTotalRowCount",
							sql: dataSourceContentTextarea.value,
							datacenter: datacenter
						},
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "getSampleResult",
							sql: dataSourceContentTextarea.value,
							datacenter: datacenter
						}
					],
					callback: function( r ) {
						if ( r[1].error ) {
							bi.portalDialog( r[1].error.message || "您的查询语句有误，请修改" );
							return;
						}
						totalRowCount.innerHTML = +r[1];
						var cols = _.map( r[2].shift(), function( h ) {
							return {
								caption: h
							};
						} );
						var table = Sue.ui.table( {
							parent: _body,
							head: cols,
							data: r[2]
						} );
					}
				} );
			}
		} );
		tp.doSelect( tab0.uuid );

		var getTableColumnsBtn = f("getTableColumnsBtn");
		var releaseContentArea = f("releaseContentArea");
		var previewBtn = f("previewBtn");
		var totalRowCount = f("totalRowCount");
		releaseContentArea.disabled = true;
		_.bindEvent( releaseContentArea, "click", function() {
			if ( window.confirm( "解锁查询语句将清空可用列和输出列，确认继续吗？" ) ) {
				_.unbindEvent(btns.defineAliasBtn.span, "click");
				btns.releaseContentArea.span.disabled = true;
				btns.getTableColumnsBtn.span.disabled = false;
				dataSourceContentTextarea.readOnly = false;
				totalRowCount.innerHTML = "0";
				vList = oList = null;
				outputColumnCount = 0;
				validColumnDiv.innerHTML && _.gc(validColumnDiv.firstChild);
				outputColumnDiv.innerHTML && _.gc(outputColumnDiv.firstChild);
			}
		} );
		_.bindEvent(getTableColumnsBtn, "click", function( afterSetValidColumnsHook ) {
			if ( !dataSourceContentTextarea.value ) {
				alert("数据源内容不能为空");
				return;
			}
			var useDataCenter = cbDataCenter.checked;
			var datacenter = "";
			if(useDataCenter)
			{
				datacenter = dataCenterList.value;
			}
			
			_.post( {
				url: webUtilServlet,
				json: [
				"*;",
				{
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "getSqlTotalRowCount",
					sql: dataSourceContentTextarea.value,
					datacenter: datacenter
				},
				{
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "getSQLColumns",
					sql: dataSourceContentTextarea.value,
					datacenter: datacenter
				}],
				callback: function( r ) {
					totalRowCount.innerHTML = +r[1];
					setValidColumns( _.map( r[2], function( o ) {
						o = eval( o );
						return {
							caption: o.name,
							type: o.type
						};
					} ) );
					typeof afterSetValidColumnsHook == "function" && afterSetValidColumnsHook();
					btns.releaseContentArea.span.disabled = false;
					btns.getTableColumnsBtn.span.disabled = true;
					dataSourceContentTextarea.readOnly = true;
				}
			} );
		});
		
		var validColumnDiv = f("validColumnDiv"),
			outputColumnDiv = f("outputColumnDiv"),
			outputColumnCount = 0,
			vList,
			oList;
		
		var btns = bi.updateToPortalStyleButton(dialog.content, "sue");
		bi.updateToPortalStyleTextField(dialog.content, "sue");
	} else {
		dialog.show();
		var datasourceName = f("datasourceName");
	}
	
	try {
		datasourceName.focus();
	} catch( e ) {}
	
	// 根据dsPath去服务端获取数据源配置信息
	function getDataSourceFromRepository() {
		var node = this;
		_.post( {
			url: webUtilServlet,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				action: "getDataSourceByID",
				dsPath: node.dsPath
			},
			callback: function( r ) {
				node.ds = {
					param: r
				};
				node.click = editDatasource;
				editDatasource.call( node );
			}
		} );
	}
	
	// 将数据源配置信息设置到UI
	function editDatasource() {
		if ( this.ds == instance ) return;
		var ds = instance = this.ds;
		tp.doSelect(tab0.uuid);
		datasourceName.value = ds.param.name;
		
		if(ds.param.datacenter&&ds.param.datacenter!="")
		{
			setDataCenter(ds.param.datacenter);
		}	
		else
		{
			clearDataCenter();
		}
		
		maxRowCount.value = ds.param.maxRowCount;
		_.select(datasourceTypeSelect, "value", 1, ds.param.type).selected = "selected";
		_.select(saveLocationSelect, "value", 1, ds.param.saveLocation).selected = "selected";
		dataSourceContentTextarea.value = ds.param.content;
		dataSourceDescriptionTextarea.value = ds.param.description;
		var isDisabled = btns.getTableColumnsBtn.span.disabled;
		btns.getTableColumnsBtn.span.disabled = false;
		_.extractEvent( btns.getTableColumnsBtn.span, "click" )( function() {
			var hash = _.hash( ds.param.outputColumns, "column", _.I );
			var a = [];
			_.map( vList.items, function( item ) {
				if ( item.caption in hash ) {
					vList.disable( item );
					a.push( {
						caption: item.caption + "(" + hash[ item.caption ].alias + ")",
						alias: hash[ item.caption ].alias,
						type: item.type,
						uuid: item.uuid
					} );
				}
			} );
			oList.insert( a );
			outputColumnCount += ds.param.outputColumns.length;
		} );
		btns.getTableColumnsBtn.span.disabled = isDisabled;
		_.unbindEvent(btns.defineAliasBtn.span, "click");
	}
	
	function clearDataCenter()
	{
			cbDataCenter.checked = false;
			dataCenterList.disabled = true;
			return this;
	}
		
	function setDataCenter(datacenter)
	{
			if(!datacenter||datacenter=="")
			{
				cbDataCenter.checked = false;
				dataCenterList.disabled = true;
			}
			else
			{
				if(!cbDataCenter.inited)
				{
					initDataCenter(datacenter);
				}
				cbDataCenter.checked = true;
				dataCenterList.disabled = false;
				dataCenterList.value = datacenter;
				dataCenterList.title = datacenter;
				dataCenterList.text = datacenter;
			}
			return this;
	}
	
	// 设置服务端返回的可用列
	function setValidColumns( cols ) {
		validColumnDiv.innerHTML && _.gc(validColumnDiv.firstChild);
		outputColumnDiv.innerHTML && _.gc(outputColumnDiv.firstChild);
		if (!cols || !cols.length) return;
		var rootStyle = {
			border: "none",
			width: "154px",
			height: "150px"
		};
		vList = Sue.ui.list( {
			parent: validColumnDiv,
			items: cols,
			rootStyle: rootStyle
		} );
		oList = Sue.ui.list( {
			parent: outputColumnDiv,
			rootStyle: rootStyle
		} );
		_.map([btns.gt.span, btns.gt2.span, btns.lt.span, btns.lt2.span, btns.moveUp.span, btns.moveDown.span], _.unbindEvent);
		_.bindEvent(btns.gt.span, "click", function() {
			if ( vList && oList ) {
				var items = _.unhash( vList.selected, "value" );
				vList.disable( items );
				oList.insert( _.map( items, function( item ) {
					return _.extend( {
						alias: item.caption
					}, item, {
						caption: item.caption + "(" + item.caption + ")"
					} );
				} ) );
				outputColumnCount += items.length;
			}
		});
		_.bindEvent(btns.lt.span, "click", function() {
			if ( vList && oList ) {
				var items = _.unhash( oList.selected, "value" );
				vList.enable( _.map( items, function( item ) {
					item.caption = item.caption.match(/(.*?)\(.*\)$/)[1];
					return item;
				} ) );
				oList.remove( items );
				outputColumnCount -= items.length;
			}
		});
		_.bindEvent(btns.gt2.span, "click", function() {
			if ( vList && oList ) {
				var restItems = vList.getItems( function( item ) {
					return vList.map[ item.uuid ].style.color.toUpperCase() != "#CCC";
				} );
				oList.insert( _.map( restItems, function( item ) {
					return _.extend( {
						alias: item.caption
					}, item, {
						caption: item.caption + "(" + item.caption + ")"
					} );
				} ) );
				vList.disable( restItems );
				outputColumnCount += restItems.length;
			}
		});
		_.bindEvent(btns.lt2.span, "click", function() {
			if ( vList && oList ) {
				oList.remove( oList.items );
				vList.enable( vList.items );
				outputColumnCount = 0;
			}
		});
		_.bindEvent(btns.moveUp.span, "click", function() {
			var allItems = oList.items;
			if ( !allItems.length || allItems[0].uuid in oList.selected ) return;
			var selectedItem = oList.selected;
			var items = [];
			for( var i = 0; i < allItems.length; i++ ) {
				allItems[i].uuid in selectedItem && items.push( allItems[i] );
			}
			_.map( items, function( item ) {
				var index = _.indexOf( oList.items, item );
				oList.swap(item, oList.items[index - 1]);
			} );
		});
		_.bindEvent(btns.moveDown.span, "click", function() {
			var allItems = oList.items;
			if ( !allItems.length || allItems[allItems.length - 1].uuid in oList.selected ) return;
			var selectedItem = oList.selected;
			var items = [];
			for( var i = 0; i < allItems.length; i++ ) {
				allItems[i].uuid in selectedItem && items.unshift( allItems[i] );
			}
			_.map( items, function( item ) {
				var index = _.indexOf( oList.items, item );
				oList.swap(item, oList.items[index + 1]);
			} );
		});
		_.bindEvent(btns.defineAliasBtn.span, "click", function() {
			var selected = _.unhash( oList.selected, "value" );
			if ( !selected.length ) return;
			_.bind( editAlias, oList.map[ selected[0].uuid ] )( selected[0] );
		});
		function editAlias( item ) {
			this.contentEditable = true;
			this.style.backgroundColor = "#FFDDB2";
			this.innerHTML = item.alias;
			try {
				this.focus();
			} catch( e ) {}
			_.bindEvent( this, "blur", function() {
				this.contentEditable = false;
				var columnName = item.caption.match(/(.*?)\(.*\)$/)[1];
				if (this.innerHTML) {
					item.alias = this.innerHTML;
					this.innerHTML = columnName + "(" + this.innerHTML + ")";
				} else {
					item.alias = columnName;
					this.innerHTML = columnName + "(" + columnName + ")";
				}
				this.title = this.innerHTML;
				this.style.backgroundColor = "#CCC";
				_.unbindEvent( this, "blur,keydown" );
			});
			_.bindEvent( this, "keydown", function( e ) {
				if ( e.keyCode == 13 ) {
					_.extractEvent( this, "blur" )();
				}
			} );
		}
	}
	
	function f( sue ) {
		return _.select(dialog.content, "sue", 1, sue);
	}
}

function _scriptManage() {
	
	/**
	var dialog = Sue.ui.ext.dialog( {
		caption: "脚本管理器",
		width: 750,
		height: 490,
		closeAction: "close",
		
		
	} );
	*/
	
	var dialog = Sue.ui.ext.extDialog( {
		caption: "脚本管理器",
		width: 800,
		height: 640,
		buttons : [
			{
				text : "确定",
				handler: function() {
				if ( currentIID ) {
					rt.ScriptManager.setScript( currentIID, scriptArea.value );
				}

				dialog.destroy();
				_oModel.setDirty(true);
				}
			},
			{
				text: "取消",
				handler:function() {
					rt.ScriptManager = scriptManagerBackup;
					dialog.destroy();
				}
			}] 
	} );

	dialog.content.style.verticalAlign = "top";
	dialog.setContent( _.loadUIT( "bi_dialog_dashboard_script_manager" ) );
	
	dialog.show();	
	var treeDiv = sue( "treeDiv" ),
		scriptArea = sue( "scriptArea" ),
		chooseTarget = sue( "chooseTarget" ),
		chooseEvent = sue( "chooseEvent" ),
		testBtn = sue( "testBtn" ),
		helpTD = sue( "helpTD" );
	
	var tree = Sue.ui.tree( {
			parent: treeDiv,
			caption: "编程对象",
			getIcon: function( node, f ) {
				if ( node.type == "type" ) {
					return f( "pack" );
				} else if ( node.type == "array" ) {
					return node.expanded ? f( "folderopen" ) : f( "folder" );
				} else if ( node.type == "method" ) {
					return f( "ball" );
				}
			}
		} ),
	Node = tree.getNodeConstructor();
	var rt = SubScriptEngine.Runtime,
		dashboard = rt.Dashboard;
	
	var root = Node( {
		caption: dashboard.name,
		captionCSSText: "font-family:Verdana",
		type: "type",
		description: dashboard.description,
		click: treeNodeClick,
		dblclick: treeNodeDblclick,
		expanded: true
	} );
	tree.setRoot( root );
	buildTree( root, dashboard );
	
	var scriptManagerBackup = rt.ScriptManager.clone();
	var currentIID;
	_.map( rt.NameManager.lookup( function( instance ) {
		return "_events" in instance;
	} ), function( instance ) {
		chooseTarget.options.add( new Option( instance.name, instance.iid + "" ) );
	} );
	
	_.bindEvent( chooseTarget, "change", onChooseTarget );
	//如果选中单元格对象，则默认显示该对象脚本
	var oSelected=_oSelectionModel.getLastSelected();
	if(oSelected instanceof AbstractCell){
	  for(var i=0;i<chooseTarget.options.length;i++)
	  {
	  	if(chooseTarget.options[i].innerText==oSelected.name)
	  	{
	        chooseTarget.options[i].selected="selected";
	        onChooseTarget();
	        break;
	    }
	  }
	}	

	_.bindEvent( chooseEvent, "change", function() {
		var eventType = this.options[ this.selectedIndex ].value;
		if ( eventType ) {
			scriptArea.value += _.format( "%sself.bindEvent(\"%s\", function() {\n    // TODO: Add script here\n});", scriptArea.value ? "\n\n" : "", eventType );
		}
	} );
	
	_.bindEvent( testBtn, "click", function() {
		if ( !chooseTarget.selectedIndex || !scriptArea.value ) {
			alert( "没有可供分析的脚本" );
			return;
		}
		var instance = rt.NameManager.lookupIID( chooseTarget.options[ chooseTarget.selectedIndex ].value );
		staticAnalysis( instance, scriptArea.value );
	} );
	
	
	//选择目标对象
	function onChooseTarget(){
		chooseEvent.options.length = 1;
		if ( currentIID ) {
			rt.ScriptManager.setScript( currentIID, scriptArea.value );
		}
		var iid = chooseTarget.options[ chooseTarget.selectedIndex ].value;
		if ( iid ) {
			scriptArea.disabled = false;
			scriptArea.value = rt.ScriptManager.getScript( iid ) || "";
			var instance = rt.NameManager.lookupIID( iid );
			for( var i = 0; i < instance._events.length; i++ ) {
				chooseEvent.add( new Option( instance._events[i].caption, instance._events[i].name ) );
			}
			scriptArea.focus();
		} else {
			scriptArea.value = "请选择要对其编程的目标";
			scriptArea.disabled = true;
		}
		currentIID = iid;
	
	}
	/*
	dialog.addButton( "确定", function() {
		if ( currentIID ) {
			rt.ScriptManager.setScript( currentIID, scriptArea.value );
		}
		dialog.destroy();
		_oModel.setDirty(true);
	} );
	dialog.addButton( "取消", function() {
		rt.ScriptManager = scriptManagerBackup;
		dialog.destroy();
	} );
	*/
	
	//bi.updateToPortalStyleButton( dialog.content );
	

	
	function buildTree( node, instance ) {
		var children = rt.isType( instance )
			? instance.properties()
			: _.map( instance, rt.toPropertyObject );
		for( var i = 0; i < children.length; i++ ) {
			var child = children[i];
			// 匿名单元格节点不提供方法
			if ( instance.name == SubScriptEngine.Constants.DEFAULT_ANONYMOUS_CELL_NAME && child.type == "method" ) {
				continue;
			}
			var subNode = Node( {
				caption: child.name,
				captionCSSText: "font-family:Verdana",
				type: child.type,
				description: child.description,
				click: treeNodeClick,
				dblclick: treeNodeDblclick
			} );
			
			node.append( subNode );
			var oSelected=_oSelectionModel.getLastSelected();
			
			if ( rt.isArray( instance ) ) {
				buildTree( subNode, instance[i] );
			} else if ( child.type == "type" || child.type == "array" ) {
				buildTree( subNode, instance[child.name] );
			}
			if ( node.children &&
				node.type != "method" &&
				!( instance instanceof SubScriptEngine.Types.Dial ) &&
				!( instance instanceof SubScriptEngine.Types.Datasource ) ) 
				{
					if(oSelected!=null && subNode.caption==oSelected.name)
					{
					    if(oSelected instanceof AbstractCell)
					    {
					       subNode.expand();
					    }
			        }	
				node.expand();
			   }
			
		}
	}
	
	function treeNodeClick() {
		helpTD.innerHTML = this.description;
	}
	
	function treeNodeDblclick() {
		if ( scriptArea.disabled ) {
			return false;
		} else {
			var text = "";
			if ( this.type == "type" || this.type == "array" ) {
				text = this.caption;
			} else if ( this.type == "method" ) {
				text = this.parent.caption + "." + this.caption;
			}
			try {
				scriptArea.focus();
			} catch ( e ) {
				return;
			}
			document.selection.createRange().text = text;
		}
	}
	
	function staticAnalysis( instance, script ) {
		rt.debugMode( true );
		( function() {
			var self = instance;
			eval( rt.NameManager.getConstructContextScript( "SubScriptEngine" ) );
			try {
				eval( script );
				helpTD.innerHTML = "脚本静态检查通过";
			} catch ( e ) {
				if ( e instanceof SubScriptEngine.Error ) {
					helpTD.innerHTML = "<span style='color:#F00'>脚本静态检查失败：" + e.message + "</span>";
				} else {
					helpTD.innerHTML = "<span style='color:#F00'>脚本静态检查失败：" + e.message + "</span>";
				}
			}
		} )();
	}
	
	function sue( value ) {
		return _.select(dialog.content, "sue", 1, value);
	}
}

function _exit()
{
	window.opener = null;//不弹出询问框
	window.close();
}


///////////////////////////////////////////////////////////
// 选中对象管理
///////////////////////////////////////////////////////////

function SelectionModel()
{
	//选中对象
	this.aSelected = new Array();//AbstractCell的实例 或 描述单元格的Layout对象
}

SelectionModel.prototype.getLastSelected = function()
{
	return this.aSelected[this.aSelected.length - 1];
}

SelectionModel.prototype.clearSelected = function()
{
	this.aSelected.splice(0, this.aSelected.length);
}

//界面鼠标选中时调用的添加操作
SelectionModel.prototype.addSelectedOperate = function(oModel, oEvent)
{
	return this.addSelectedInner(oModel, oEvent.ctrlKey, oEvent.shiftKey);
}

//其它操作引起的选中
SelectionModel.prototype.addSelected = function(oModel)
{
	this.addSelectedInner(oModel, false, false);
}

//return 选中-true;拒绝-false
SelectionModel.prototype.addSelectedInner = function(oModel, bCtrlPress, bShiftPress)
{
	var iLength = this.aSelected.length;
	if(iLength == 0 || (!bCtrlPress && !bShiftPress))//未有选中；或不是多选
	{
		this.syncUI("deselected");
		this.aSelected.splice(0, iLength);//清除原来选中的
		this.aSelected[0] = oModel;
		this.syncUI("selected");
		return true;
	}
	else//即((bCtrlPress || bShiftPress) && iLength > 0)，多选
	{
		var bReject = false;//拒绝选中
		if(this.aSelected[0] instanceof Layout)//已有选中TD
		{
			if(oModel instanceof Layout)//再选TD
			{
				if(this.aSelected[0].oLayoutTable != oModel.oLayoutTable)
				{
					bReject = true;//跨表格不能多选。但是单表格，不会至此。
				}
			}
			else//再选DIV，不允许
			{
				bReject = true;
			}
		}
		else if(!(oModel instanceof Layout))//已有选中DIV，再选DIV
		{
			if(this.aSelected[0].sType != oModel.sType)
			{
				bReject = true;//DIV不同类型，如片段/文字，不允许
			}
		}
		else//已有选中DIV，再选TD，不允许
		{
			bReject = true;			
		}
		
		if(bReject)
		{
			alert("不同类型不能多选。");
		}
		else
		{
			this.syncUI("deselected");
			if(bShiftPress && (oModel instanceof Layout))
			{
				var oLayout = oModel;
				var oLastLayout = this.getLastSelected();
				var iFromRow = Math.min(oLayout.iRowIdx, oLastLayout.iRowIdx);
				var iToRow = Math.max(oLayout.iRowIdx, oLastLayout.iRowIdx);
				var iFromCol = Math.min(oLayout.iColIdx, oLastLayout.iColIdx);
				var iToCol = Math.max(oLayout.iColIdx, oLastLayout.iColIdx);
				for(var i = iFromRow; i <= iToRow; i++)
				{
					for(var j = iFromCol; j <= iToCol; j++)
					{
						var oLayout = new Layout(oModel.oLayoutTable, i, j, oLayout.name || "");
						if(!this.innerContains(oLayout))
						{
							this.aSelected.push(oLayout);
						}
					}
				}
			}
			//以下是if(bCtrlPress)，也是bShiftPress的最后补一下
			if(!this.innerContains(oModel))
			{
				this.aSelected.push(oModel);
			}
			this.syncUI("selected");
		}
		return !bReject;
	}
}

SelectionModel.prototype.syncUI = function(sTag)
{
	for(var i = 0; i < this.aSelected.length; i++)
	{
		var oHTML = document.getElementById(this.aSelected[i].getUID());
		if(oHTML != null)
		{
			if(sTag == "selected")
			{
				if(i == this.aSelected.length - 1)
				{
					oHTML.style.border = "solid 2px " + Sue.config.cs[19];
				}
				else
				{
					oHTML.style.border = "dotted 2px " + Sue.config.cs[19];
				}
			}
			else if(sTag == "deselected")
			{
				if(this.aSelected[i] != null)
				{
					this.aSelected[i].updateBorder(oHTML);
				}
			}
		}
	}
}

//如果指定对象在已选中集合中，则将其从选中队列中间任何位置移至未尾，并返回true
SelectionModel.prototype.innerContains = function(oToSelect)
{
	var iLength = this.aSelected.length;
	for(var i = 0; i < iLength; i++)
	{
		if(this.aSelected[i].equals(oToSelect))
		{
			this.aSelected.splice(i, 1);
			this.aSelected.push(oToSelect);
			return true;
		}
	}
	return false;
}


///////////////////////////////////////////////////////////
// 标识鼠标操作类型及操作状态保存的类
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// 创建对象的操作
function MouseState_Creating(sType)
{
	this.sType = sType;
	this.bCanDrop = false;
	this.oLastMouseOver = null;
}

MouseState_Creating.prototype.checkCanCreate = function(e)
{
	var oHtmlObj = e.srcElement;
	
	//往上找，看是否在SwitchableArea中
	var oTry = oHtmlObj;
	while(oTry != _oDesignArea.oHtmlSwitchableArea && oTry.tagName.toUpperCase() != "BODY")
	{
		oTry = oTry.parentNode;
	}
	
	if(oTry == _oDesignArea.oHtmlSwitchableArea)
	{
		this.bCanDrop = true;
		this.oLastMouseOver = oTry;
		return;
	}
	
	if(oHtmlObj == this.oLastMouseOver)
	{
		return;
	}
	this.oLastMouseOver = oHtmlObj;

	var oModel = oHtmlObj.dashboard_model;
	if(oModel instanceof Layout)
	{
		//一个单元格只能放一个单元对象
		var iRowIdx = oModel.iRowIdx;
		var iColIdx = oModel.iColIdx;
		var oChild = oModel.oLayoutTable.getChild(iRowIdx, iColIdx);
		if(oChild == null)
		{
			this.bCanDrop = true;
		}
		else
		{
			this.bCanDrop = false;
		}
	}
	else //	if(oHtmlObj.dashboard_model instanceof AbstractCell)或其它
	{
		this.bCanDrop = false;
	}
}

MouseState_Creating.prototype.getMouseIcon = function()
{
	if(this.bCanDrop)
	{
		return "url(" + "images/DRAGCOPY.CUR" + ")";
	}
	else
	{
		return "no-drop";
	}	
}

MouseState_Creating.prototype.create = function(e)
{
	var oTarget;
	if(this.bCanDrop)
	{
		//切掉"toolbox_"
		oTarget = cellFactory(this.sType.substring(8));
	}
	
	if(oTarget != null)	
	{
		if(this.oLastMouseOver == _oDesignArea.oHtmlSwitchableArea)
		{
			_oModel.oSwitchableCtrlsManager.addCell(oTarget);
			_oModel.oSwitchableCtrlsManager.syncUI();
		}
		else
		{
			var oLayout = this.oLastMouseOver.dashboard_model;
			oLayout.oLayoutTable.addChild(oTarget, oLayout.iRowIdx, oLayout.iColIdx);
		}
		_oSelectionModel.addSelected(oTarget);
		_oModel.setDirty(true);
	}
	
	this.bCanDrop = false;
	this.oLastMouseOver = null;

	if(oTarget != null && oTarget.isMustBindResource())
	{
		oTarget.bindResource();
	}
}

///////////////////////////////////////////////////////////
// 拖拽行高列宽的操作
function MouseState_DragRowCol(bRow, oSrc, iIdx, e, bCtrlPress)
{
	this.bRow = bRow;//针对行，或列
	this.oSrc = oSrc;//layoutTable
	this.iIdx = iIdx;//拖拽线之前的行号或列号，即拖拽的是位于iIdx与iIdx+1之间的线
	
	//鼠标的起始位置
	this.iMouseStart = (bRow ? e.screenY : e.screenX);
	
	//拖动的距离
	this.iDelta = 0;
	
	//提示线
	this.oPrompt;
	this.iPromptOffset;
	this.bPromptShowed = false;
	
	//不按[Ctrl]，二行(列)间内部调整；按则改变表格大小，保持右下不变。
	this.bCtrlPress = bCtrlPress;//不从e.ctrlKey取，可由外部传入true/false
}

MouseState_DragRowCol.prototype.adjusted = function(e)
{
	var bResult = false;
	if(this.iDelta != 0)
	{
		if(this.bRow)
		{
			this.oSrc.aRowHeights[this.iIdx] = 
				parseInt(this.oSrc.aRowHeights[this.iIdx]) + this.iDelta;
			if(!this.bCtrlPress)
			{
				this.oSrc.aRowHeights[this.iIdx + 1] = 
					parseInt(this.oSrc.aRowHeights[this.iIdx + 1]) - this.iDelta;
			}
		}
		else
		{
			this.oSrc.aColWidths[this.iIdx] = 
				parseInt(this.oSrc.aColWidths[this.iIdx]) + this.iDelta;
			if(!this.bCtrlPress)
			{
				this.oSrc.aColWidths[this.iIdx + 1] = 
					parseInt(this.oSrc.aColWidths[this.iIdx + 1]) - this.iDelta;
			}
		}
		bResult = true;
		_oModel.setDirty(true);
	}

	if(this.bPromptShowed)
	{
		_oDesignArea.oHtmlDesignContainer.removeChild(this.oPrompt);
		this.bPromptShowed = false;
	}
	
	return bResult;
}

MouseState_DragRowCol.prototype.adjusting = function(e)
{
	if(this.bRow)	
	{
		this.adjustingRow(e);
	}
	else
	{
		this.adjustingCol(e);
	}
}

MouseState_DragRowCol.prototype.adjustingRow = function(e)
{
	if(!this.bPromptShowed)
	{
		this.iPromptOffset = document.getElementById("designAreaOwner").offsetTop;
		
		this.oPrompt = document.createElement("div");
		this.oPrompt.className = "dragRowPromptLine";
		this.oPrompt.style.position = "absolute";
		this.oPrompt.style.width = "100%";
		this.oPrompt.style.height = "1";
		this.oPrompt.style.top = e.clientY + _oDesignArea.oHtmlDesignArea.scrollTop - this.iPromptOffset - 2;
		_oDesignArea.oHtmlDesignContainer.appendChild(this.oPrompt);
		
		this.bPromptShowed = true;
	}
	var iDelta = e.screenY - this.iMouseStart;
	var bLimited = false;
	if(iDelta < 0)
	{
		var iHeight = parseInt(this.oSrc.aRowHeights[this.iIdx]);
		if(-iDelta > iHeight)
		{
			iDelta = -(iHeight - 1);
			bLimited = true;
		}
	}
	else if(!this.bCtrlPress)
	{
		var iHeight = parseInt(this.oSrc.aRowHeights[this.iIdx + 1]);
		if(iDelta > iHeight)
		{
			iDelta = iHeight - 1;
			bLimited = true;
		}
	}
	this.iDelta = iDelta;
	
	if(!bLimited)
	{
		this.oPrompt.style.top = e.clientY + _oDesignArea.oHtmlDesignArea.scrollTop - this.iPromptOffset - 2;
	}
}

MouseState_DragRowCol.prototype.adjustingCol = function(e)
{
	if(!this.bPromptShowed)
	{
		this.iPromptOffset = document.getElementById("designAreaOwner").offsetLeft;
		
		this.oPrompt = document.createElement("div");
		this.oPrompt.className = "dragColPromptLine";
		this.oPrompt.style.position = "absolute";
		this.oPrompt.style.width = "1";
		this.oPrompt.style.height = "100%";
		this.oPrompt.style.top = "0";
		this.oPrompt.style.left = e.clientX + _oDesignArea.oHtmlDesignArea.scrollLeft - this.iPromptOffset - 2;
		_oDesignArea.oHtmlDesignContainer.appendChild(this.oPrompt);
		
		this.bPromptShowed = true;
	}
	var iDelta = e.screenX - this.iMouseStart;
	var bLimited = false;
	if(iDelta < 0)
	{
		var iWidth = parseInt(this.oSrc.aColWidths[this.iIdx]);
		if(-iDelta > iWidth)
		{
			iDelta = -(iWidth - 1);
			bLimited = true;
		}
	}
	else if(!this.bCtrlPress)
	{
		var iWidth = parseInt(this.oSrc.aColWidths[this.iIdx + 1]);
		if(iDelta > iWidth)
		{
			iDelta = iWidth - 1;
			bLimited = true;
		}
	}
	this.iDelta = iDelta;
	
	if(!bLimited)
	{
		this.oPrompt.style.left = e.clientX + _oDesignArea.oHtmlDesignArea.scrollLeft - this.iPromptOffset - 2;
	}
}

MouseState_DragRowCol.prototype.getMouseIcon = function()
{
	return (this.bRow ? "n-resize" : "e-resize");
}


///////////////////////////////////////////////////////////
// 拖放单元对象的操作
function MouseState_DragDropCell(oSrc, e)
{
	this.oModel = oSrc;
	this.bCanDrop = false;
	this.oLastMouseOver;
	this.bSelf;
}

MouseState_DragDropCell.prototype.draging = function(e)
{
	var oHtmlObj = e.srcElement;
	if(oHtmlObj == this.oLastMouseOver)
	{
		return;
	}
	
	
	this.bSelf = false;

	//往上找，看是否在SwitchableArea中
	var oTry = oHtmlObj;
	while(oTry != _oDesignArea.oHtmlSwitchableArea && oTry.tagName.toUpperCase() != "BODY")
	{
		oTry = oTry.parentNode;
	}
	
	if(oTry == _oDesignArea.oHtmlSwitchableArea)
	{
		this.oLastMouseOver = oTry;
		this.bCanDrop = this.oModel.hasLayout();
	}
	else
	{
		this.oLastMouseOver = oHtmlObj;
		var oModel = oHtmlObj.dashboard_model;
		while(!oModel && oHtmlObj.tagName.toUpperCase() != "BODY")
		{
			oHtmlObj = oHtmlObj.parentNode;
			oModel = oHtmlObj.dashboard_model;
		}
		
		if(oModel instanceof Layout)
		{
			//一个单元格只能放一个单元对象
			var iRowIdx = oModel.iRowIdx;
			var iColIdx = oModel.iColIdx;
			var oChild = oModel.oLayoutTable.getChild(iRowIdx, iColIdx);
			if(oChild == null)
			{
				this.bCanDrop = true;
			}
			else
			{
				if(oChild == this.oModel)
				{
					this.bSelf = true;
				}
				this.bCanDrop = false;
			}
		}
		else //	if(oHtmlObj.dashboard_model instanceof AbstractCell)或其它
		{
			if(oModel == this.oModel)
			{
				this.bSelf = true;
			}
			this.bCanDrop = false;
		}
	}
}

MouseState_DragDropCell.prototype.drop = function(e)
{
	if(this.bCanDrop)
	{
		if(this.oModel.hasLayout())
		{
			this.oModel.oLayout.oLayoutTable.removeChild(this.oModel);
		}
		else
		{
			_oModel.oSwitchableCtrlsManager.removeCell(this.oModel);
			_oModel.oSwitchableCtrlsManager.syncUI();
		}
		
		if(this.oLastMouseOver == _oDesignArea.oHtmlSwitchableArea)
		{
			_oModel.oSwitchableCtrlsManager.addCell(this.oModel);
			_oModel.oSwitchableCtrlsManager.syncUI();
		}
		else
		{
			var oLayout = this.oLastMouseOver.dashboard_model;
			oLayout.oLayoutTable.addChild(this.oModel, oLayout.iRowIdx, oLayout.iColIdx);
		}
		
		_oSelectionModel.addSelected(this.oModel);
		_oModel.setDirty(true);
	}
	this.bCanDrop = false;
	this.oLastMouseOver = null;
}

MouseState_DragDropCell.prototype.getMouseIcon = function()
{
	if(this.bSelf)
	{
		return "move";
	}
	else if(this.bCanDrop)
	{
		return "url(" + "images/DRAGDROP.CUR" + ")";
	}
	else
	{
		return "no-drop";
	}
}

var dialogStack = [];
// 将HTML页面包装为标准的模态对话框
// param = {
// 		uri: (string) 要包装的html文件uri
//		width: (正整数) 对话框宽度
//		height: (正整数) 对话框高度
//		param: (object) 要传递给html文件window对象的参数
//		callback: (function) 回调
// }
function _wrapHTMLPageInDialog( param ) {
	var dialog = Sue.ui.ext.dialog( {
		width: param.width + 20,
		height: param.height,
		closeAction: "close"
	} );
	dialogStack.length && dialogStack[ dialogStack.length - 1 ].hide();
	dialogStack.push( dialog );
	dialog.destroy = _.link( _.bind( dialog.destroy, dialog ), function() {
		dialogStack.pop();
		dialogStack.length && dialogStack[ dialogStack.length - 1 ].show();
	} );
	dialog.closeDialog = param.callback
	? function( returnValue ) {
		dialog.param.destroyHook = _.bind( param.callback, dialog, returnValue );
		dialog.destroy();
	}
	: dialog.destroy;
	param.param.dialog = dialog;
	var frame = _.crt( "iframe", {
		src: param.uri,
		frameBorder: "0",
		scrolling: "no",
		noResize: "noresize",
		width: "100%",
		height: "100%",
		$param: param.param
	} );
	_.bindEvent( frame, "load", function() {
		var doc = frame.contentWindow.document;
		dialog.setCaption( doc.title );
		doc.body.style.backgroundColor = Sue.config.cs[14];
//		doc.body.onselectstart = function(){return false;};//add by Along
		bi.updateToPortalStyleButton( doc.body );
	} );
	dialog.setContent( frame );
}
