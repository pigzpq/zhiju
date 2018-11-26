//该文件定义界面元素，包括：工具栏、工具箱、设计区等。
var _oDesignArea;
var _oToolbox;
var _oToolbar;

var _env;

//页面装载时，创建界面基本元素
function _onload()
{
	window.moveTo(0,0);
	if(window.dialogArguments)
	{
		_env = window.dialogArguments;
	}
	else
	{
		_env = new Env();//for test
	}
	

	var oBody = document.body;
	oBody.oncontextmenu = function(){return false;};
//  modified by laikun: 此处不能屏蔽选择，否则导致文本区、文本域无法选择
//	oBody.onselectstart = function(){
//		if ( window.event.srcElement == document.body ) {
//			return false;
//		}
//	};
	
	oBody.innerHTML = '<table bgcolor="#DBDBDB" width="100%" height="100%" border="0" cellPadding="0" cellSpacing="0">'
	+ '<col width="50"><col width="100%">'
	+ '<tr height="70"><td id="toolbarOwner" colspan="2"></tr>'
	+ '<tr><td valign="top">'
	+ '<table width="100%" height="100%" cellpadding="0" cellspacing="0"><tr height="22"><td><img src="images/toolbox_header_' + Sue.config.cs.name + '.gif"/></td></tr>'
	+ '<tr><td id="toolboxOwner" valign="top"></td></tr></table>'
	+ '</td>'
	+ '<td id="designAreaOwner"></td></tr></table>';
	
	var oToolbarOwner = document.getElementById("toolbarOwner");
	_oToolbar = new Toolbar();
	_oToolbar.buildUI(oToolbarOwner);

	var oToolboxOwner = document.getElementById("toolboxOwner");
	_oToolbox = new Toolbox();
	_oToolbox.buildUI(oToolboxOwner);

	var oDesignAreaOwner = document.getElementById("designAreaOwner");
	_oDesignArea = new DesignArea();
	_oDesignArea.buildUI(oDesignAreaOwner);

	if(_env.xml)//edit
	{
		// 延时加载，直接加载可能会出现滚动条不出现的情况
		setTimeout( function() {
			_oModel.load(_env.xml);
			_oDesignArea.updateUI();
		}, 100 );
	}
	else//new
	{
		_layoutSetting();
	}
}

function _onresize()
{
	_oToolbar.resized();
}

function _onclosing()
{
	if(_oModel.isDirty())
	{
		return "[请注意：当前内容的改动未保存。]";
	}
}

///////////////////////////////////////////////////////////
// for test
function Env()
{
	this.xml;
}

Env.prototype.save = function(sXml)
{
	this.xml = sXml;
	alert(sXml);
}

Env.prototype.getRepositoryPicture = function(sUri)
{
	return "images/picture.gif";
}



///////////////////////////////////////////////////////////
// Class 设计区

function DesignArea()
{
	this.oHtmlDesignArea;//设计区，整个大块。
	this.oHtmlDesignContainer;//设计有效区域，主布局表格加一点边距，位于设计区中。
//	this.oHtmlLayoutTable;//主布局表格，位于有效区域中。

	this.oHtmlSwitchableArea;//可切换组件的设计区域 090522，位于设计区中。
	
	this.oMouseState = null;
	
//	this.iWidth = 800;
//	this.iHeight = 600;
}

DesignArea.prototype.setSize = function(iWidth, iHeight)
{
//	if(iWidth)
//	{
//		this.iWidth = iWidth;
//	}
//	if(iHeight)
//	{
//		this.iHeight = iHeight;
//	}
	//同步UI
	this.oHtmlDesignContainer.style.width = iWidth + 20;
	this.oHtmlDesignContainer.style.height = iHeight + 20;
}

DesignArea.prototype.buildUI = function(oHtmlParent)
{
	oHtmlParent.innerHTML =
	'<div style="width:100%;height:100%;overflow:scroll;background-color: #DBDBDB">'
	+ '<table style="width:100%;height:100%" cellSpacing=0 cellPadding=0>'
	+ '<tr><td vAlign="top" align="left" colspan=2>'
	+ '<div style="padding:10px;width:420px;height:320px"></div></td></tr>'
	+ '<tr><td style="width:20px;height:90px;border-top:1 solid gray">'
	+ '<div style="width:20px;font-size:12px" align="center">可切换组件</div></td>'
	+ '<td style="width:100%;border-top:1 solid gray">'
	+ '<div style="width:100%;height:100%;overflow:auto;background-color: green"></div>'
	+ '</td></tr></table></div>';
	
	this.oHtmlDesignArea = oHtmlParent.children[0];
	//以下可重构：table.tbody.tr.td.div
	this.oHtmlDesignContainer = this.oHtmlDesignArea.children[0].children[0].children[0].children[0].children[0];
	this.oHtmlSwitchableArea = this.oHtmlDesignArea.children[0].children[0].children[1].children[1].children[0];
	 	
	var thisInst = this;
	_.bindEvent( this.oHtmlDesignArea, "mousemove", _.bind( thisInst.onMouseMove, thisInst ) );
	_.bindEvent( this.oHtmlDesignArea, "mouseup", _.bind( thisInst.onMouseUp, thisInst ) );
	_.bindEvent( this.oHtmlDesignArea, "dblclick", _.bind( thisInst.onDoubleClick, thisInst ) );
	
	//在可切换组件区域中点击delete键删除选中的内容
	_.bindEvent(this.oHtmlSwitchableArea, "keydown", function( e ) {
		if (e.keyCode == 46) {
			_delete();
		}
	});
	
	var oHtmlSwitchableAreaTitle = this.oHtmlDesignArea.children[0].children[0].children[1].children[0];
	oHtmlSwitchableAreaTitle.style.backgroundColor = Sue.config.cs[18];//此值从工具箱抄来，可改
	this.oHtmlSwitchableArea.style.backgroundColor = Sue.config.cs[18];
}

DesignArea.prototype.updateUI = function()
{
	if(_oModel.sBackgroundPic)
	{
		this.oHtmlDesignContainer.style.backgroundImage = 'url(' + 
			bi.getRepositoryPicture(_env.servletURL, _oModel.sBackgroundPic) + ')';
			
		if(_oModel.sBackgroundScale == "tiled")
		{
			this.oHtmlDesignContainer.style.backgroundRepeat = "repeat";
		}
		else
		{
			this.oHtmlDesignContainer.style.backgroundRepeat = "no-repeat";
			this.oHtmlDesignContainer.style.backgroundPosition = "center center";
		}
	}
	else
	{
		this.oHtmlDesignContainer.style.backgroundImage = "";
	}

	this.oHtmlDesignContainer.style.backgroundColor = _oModel.sBackgroundColor || "#DBDBDB" ;
}

DesignArea.prototype.setMouseState = function(oMouseState)
{
	//此处有机会可以置换掉调整行高列宽的TD的鼠标形状，比如当创建对象时...
	this.oMouseState = oMouseState;
}

DesignArea.prototype.onMouseMove = function( event )
{
	if(this.oMouseState instanceof MouseState_Creating)
	{
		this.oMouseState.checkCanCreate(event);
	}
	else if(this.oMouseState instanceof MouseState_DragRowCol)
	{
		this.oMouseState.adjusting(event);
	}
	else if(this.oMouseState instanceof MouseState_DragDropCell)
	{
		this.oMouseState.draging(event);
	}
	
	if(this.oMouseState != null)
	{
		this.oHtmlDesignArea.style.cursor = this.oMouseState.getMouseIcon();
	}
}

DesignArea.prototype.onMouseUp = function( event )
{
	if(event.button != 1)//必须是左键
	{
		return;
	}

	if(this.oMouseState instanceof MouseState_Creating)
	{
		this.oMouseState.create(event);
	}
	else if(this.oMouseState instanceof MouseState_DragRowCol)
	{
		if(this.oMouseState.adjusted(event))
		{
			if(this.oMouseState.bCtrlPress)
			{
				this.setSize(_oModel.oLayoutTable.getWidth(), _oModel.oLayoutTable.getHeight());
			}
			_oModel.buildUI(this.oHtmlDesignContainer);
		}
	}
	else if(this.oMouseState instanceof MouseState_DragDropCell)
	{
		this.oMouseState.drop(event);
	}
	
	this.setMouseState(null);
	//清除鼠标
	this.oHtmlDesignArea.style.cursor = "default";
	_oToolbox.clearState();
}

DesignArea.prototype.onDoubleClick = function( event )
{
	if(this.oMouseState == null)
	{
		if(!event.ctrlKey && !event.shiftKey)
		{
			var oTargetUI = event.srcElement;
			var oTargetModel = oTargetUI.dashboard_model;
			while(!oTargetModel && oTargetUI.tagName.toUpperCase() != "BODY")
			{
				oTargetUI = oTargetUI.parentNode;
				oTargetModel = oTargetUI.dashboard_model;
			}
			if(oTargetModel)
			{
				try{
				 oTargetModel.propertySetting();
				 }catch (e) {	
				 //alert(e.name + ": " + e.message);
				 }
			}
		}
	}
}

///////////////////////////////////////////////////////////
// Class 工具箱

function Toolbox()
{
	this.oHtmlToolbox;//<Table>
}

Toolbox.prototype.buildUI = function(oHtmlParent)
{
	oHtmlParent.style.borderRight = "solid 1px #8d9fb3";
	oHtmlParent.style.backgroundColor = Sue.config.cs[18];
	var table = _.table( "{}!border-collapse:collapse;width:100%;font-size:12px", oHtmlParent );
	this.oHtmlToolbox = table.table;
	
	this.addButton("text", "文字", "images/text.gif");
	this.addButton("picture", "图片", "images/picture.gif");
	this.addButton("table", "列表", "images/table.gif");
	this.addButton("chart", "图表", "images/chart.gif");
	this.addButton("piece", "片段", "images/cube.gif");
	this.addButton("input", "组件", "images/input.gif");
	this.addButton("url", "网页", "images/url.gif");
	this.addButton("kpi", "KPI", "images/kpi.gif");
	this.addButton("easkpi","EAS KPI", "images/eas_kpi.gif");
	this.addButton("KPIMonitor","指标 监控", "images/eas_kpi.gif");
}

Toolbox.prototype.addButton = function(sId, sCaption, sIconUri)
{
	var _this = this,
		tr = _.crt( "tr", null, this.oHtmlToolbox.firstChild ),
		td = _.crt( "td", null, tr, "text-align:center" ),
		table = _.table( _.format( "A|[!width:3px;padding:0px]|@{?A[!text-align:center~<img src='%s' style='display:block'/>%s]?A}!border-collapse:collapse;width:46px;height:46px;font-size:12px", sIconUri, sCaption ), td ),
		t = table.table;
	// 此处需设定图片不能拖动，否则在设计区可能无法检测到mouseup事件
	var img = _.find( t, function( e ) {
		return e.tagName && e.tagName.toLowerCase() == "img";
	}, 1 )[0];
	img.ondrag = _.K( false ); // for IE hacks
	_.bindEvent( img, "drag", _.K( false ) );
	_.bindEvent( t, "mouseover", function() {
		table.td( 0, 0 ).style.background = _.format( "url(images/toolbox_btn_mouseover_left_%s.gif) no-repeat", Sue.config.cs.name );
		table.td( 0, 1 ).style.background = _.format( "url(images/toolbox_btn_mouseover_middle_%s.gif) repeat-x", Sue.config.cs.name );
		table.td( 0, 2 ).style.background = _.format( "url(images/toolbox_btn_mouseover_right_%s.gif) no-repeat", Sue.config.cs.name );
	} );
	_.bindEvent( t, "mouseout", function() {
		table.td( 0, 0 ).style.background =
		table.td( 0, 1 ).style.background =
		table.td( 0, 2 ).style.background = "";
		t.$isClick && ( t.$isClick = false );
	} ); 
	_.bindEvent( t, "mousedown", function( event ) {
		if( event.button != 1 ) return;
		t.$isClick = true;
		_this.oHtmlToolbox.style.cursor = "url(" + "images/DRAGCOPY.CUR" + ")";
		_oDesignArea.setMouseState( new MouseState_Creating( "toolbox_" + sId ) );
	} );
	_.bindEvent( t, "mouseup", function() {
		_this.clearState();
		_oDesignArea.setMouseState( null );
	} );
}

Toolbox.prototype.clearState = function()
{
	this.oHtmlToolbox.style.cursor = "default";
}

///////////////////////////////////////////////////////////
// Class 工具栏

function Toolbar()
{
	this.toolbarTable;//<Table>
	
}

Toolbar.prototype.buildUI = function(oHtmlParent)
{
	var table = _.table( "{*!height:25px}2!border-collapse:collapse", oHtmlParent );
	oHtmlParent.style.background = _.format( "url(images/toolbar_bg_%s.gif) repeat-x", Sue.config.cs.name );
	this.toolbarTable = table;
	
	// 第1排
	this.addButton("save", "images/toolbar_save.gif", "保存", 0);
	this.addButton("upload", "images/toolbar_upload.gif", "上传图片", 0);
	this.addSeparator( 0 );
	this.addButton("preview", "images/toolbar_preview.gif", "预览", 0);
	this.addSeparator( 0 );
	this.addButton("delete", "images/toolbar_delete.gif", "删除", 0);
	this.addSeparator( 0 );
	this.addButton("insertRow", "images/toolbar_insertrow.gif", "插入行", 0);
	this.addButton("deleteRow", "images/toolbar_deleterow.gif", "删除行", 0);
	this.addButton("insertCol", "images/toolbar_insertcolumn.gif", "插入列", 0);
	this.addButton("deleteCol", "images/toolbar_deletecolumn.gif", "删除列", 0);
	this.addSeparator( 0 );
	this.addButton("merge", "images/toolbar_merge.gif", "融合", 0);
	this.addButton("unMerge", "images/toolbar_unmerge.gif", "拆分", 0);
	this.addSeparator( 0 );
	this.addButton("exit", "images/toolbar_quit.gif", "退出", 0);
	
	// 第2排
	this.addButton("variantsDefine", "images/toolbar_variant.gif", "变量定义", 1);
	this.addButton("datasourceManage", "images/toolbar_datasource.gif", "数据源管理", 1);
	this.addButton("scriptManage", "images/toolbar_script.gif", "脚本管理", 1);
	this.addButton("layoutSetting", "images/toolbar_paper.gif", "页面设置", 1);
	this.addButton("bindResource", "images/toolbar_bindres.gif", "绑定资源", 1);
	this.addButton("linkResource", "images/toolbar_links.gif", "链接资源", 1);
	this.addButton("propertySetting", "images/toolbar_property.gif", "属性设置", 1);

}

Toolbar.prototype.addButton = function(sfunctionName, sIconUri, sTooltips, row)
{
	var span = _.crt( "span", null, this.toolbarTable.td( row, 0 ), "margin:0px 3px" );
	var table = _.table( "A|!width:4px;padding:0px|@{[?A]*[?A]!height:22px}!border-collapse:collapse;display:inline", span );
	var table2 = _.table( _.format( "{[~<img src='%s'/>][!vertical-align:bottom~%s]}!border-collapse:collapse;display:inline;font-size:12px", sIconUri, sTooltips ), table.td( 0, 1 ) );
	var t = table.table;
	_.bindEvent( t, "mouseover", function() {
		table.td( 0, 0 ).style.background = _.format( "url(images/toolbar_btn_mouseover_left_%s.gif) no-repeat", Sue.config.cs.name );
		table.td( 0, 1 ).style.background = _.format( "url(images/toolbar_btn_mouseover_middle_%s.gif) repeat-x", Sue.config.cs.name );
		table.td( 0, 2 ).style.background = _.format( "url(images/toolbar_btn_mouseover_right_%s.gif) no-repeat", Sue.config.cs.name );
	} );
	_.bindEvent( t, "mouseout", function() {
		table.td( 0, 0 ).style.background =
		table.td( 0, 1 ).style.background =
		table.td( 0, 2 ).style.background = "";
	} );
	_.bindEvent( t, "mouseup", function() {
		eval( "_" + sfunctionName + "()" );
	} );
}

Toolbar.prototype.addSeparator = function( row )
{
	var span = _.crt( "span", null, this.toolbarTable.td( row, 0 ), "margin:0px 3px" );
	var img = _.crt( "img", { src: "images/toolbar_splitor.gif" }, span );
}