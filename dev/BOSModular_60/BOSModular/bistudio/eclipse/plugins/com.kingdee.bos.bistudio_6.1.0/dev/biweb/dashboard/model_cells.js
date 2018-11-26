//model.js文件太大了，把组件的定义独立出来


///////////////////////////////////////////////////////////
// 以下定义单元对象
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// Class 单元对象的超类，文字、片段等对象由此继承
function AbstractCell(sType, sUID)
{
	this.sType = sType;
	this.sUID = sUID;
	this.oLayout = new Layout();
	
	this.bShowTitle = false;
	this.sTitle = null;
	this.name = "";
}

AbstractCell.prototype.getUID = function()
{
	return this.sUID;
}

AbstractCell.prototype.createUI = function()
{
	var oDiv = document.createElement("div");
	oDiv.dashboard_model = this;
	oDiv.id = this.sUID;
	oDiv.onclick = function(){oDiv.dashboard_model.onClick();};
	oDiv.onmousedown = function(){oDiv.dashboard_model.onMouseDown();};
	oDiv.style.width = "100%";
	oDiv.style.height = "100%";
	oDiv.style.wordWrap = "break-word";//文字折行
	oDiv.style.overflow = "hidden";//超出边界的内容隐藏，不把对象撑大
//	oDiv.style.background = "#ffffff";
	oDiv.style.fontSize = "9pt";
	this.updateUI(oDiv);
	this.updateBorder(oDiv);
	return oDiv;
}

AbstractCell.prototype.updateBorder = function(oHtml)
{
	oHtml.style.border = "solid 1px #DDD";
}

AbstractCell.prototype.commonUpdateUI = function()
{
	var oHtml = document.getElementById(this.getUID());
	if(oHtml != null)
	{
		this.updateUI(oHtml);
	}
}
	
AbstractCell.prototype.commonToXml = function()
{
	var sCommonAttrs = ' id="' + this.sUID + '" caption="'+this.sCaption+'"';
	sCommonAttrs += ' name="' + this.name + '"';
	if(this.bShowTitle)	
	{
		sCommonAttrs += ' showTitle="true"';
	}
	if(this.sTitle)	
	{
		sCommonAttrs += ' title="' + this.sTitle + '"';
	}
	return sCommonAttrs;
}

AbstractCell.prototype.commonFromXml = function(oDom)
{
	this.sUID = oDom.getAttribute("id");
	this.bShowTitle = (oDom.getAttribute("showTitle") == "true" ? true : false);
	this.sTitle = oDom.getAttribute("title");
	this.name = oDom.getAttribute("name");
}

AbstractCell.prototype.commonClone = function(newInst)
{
	newInst.oLayout = this.oLayout.clone();
	newInst.bShowTitle = this.bShowTitle;
	newInst.sTitle = this.sTitle;
	newInst.name = this.name;
}

//用传入对象把当前合并成可能带有不确定值的对象
AbstractCell.prototype.commonMergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof AbstractCell))
	{
		return;
	}
	if(oAnother.name != this.name)
	{
		this.name = null;
	}	
	if(oAnother.bShowTitle != this.bShowTitle)
	{
		this.bShowTitle = null;
	}	
	if(oAnother.sTitle != this.sTitle)
	{
		this.sTitle = null;
	}
}

//将另一个对象的属性应用到当前对象
AbstractCell.prototype.commonApplyProperty = function(oAnother)
{
	if(oAnother.bShowTitle != null)
	{
		this.bShowTitle = oAnother.bShowTitle;
	}
	if(oAnother.sTitle != null)
	{
		this.sTitle = oAnother.sTitle;
	}
	if(oAnother.name != null) {
		this.name = oAnother.name;
	}
}

AbstractCell.prototype.commonPreparePropertyToSet = function(oParms)
{
	oParms.bShowTitle = this.bShowTitle;
	oParms.sTitle = this.sTitle;
	oParms.name = this.name;
}

AbstractCell.prototype.onClick = function()
{
	event.cancelBubble = true;//一定要，这样才不会跑到布局表格去
}

AbstractCell.prototype.onMouseDown = function()
{
	//选中
	if(_oSelectionModel.addSelectedOperate(this, event))
	{
		//置可拖拽状态
		var oMs = new MouseState_DragDropCell(this, event);
		_oDesignArea.setMouseState(oMs);
	}	
	event.cancelBubble = true;
}

AbstractCell.prototype.equals = function(oAnother)
{
	//只是为了在选中对象处理中，与Layout对象对等处理
	if(oAnother == this)
	{
		return true;
	}
	return false;
}

AbstractCell.prototype.isMultiSettingSupported = function()
{
	return false;//支持多选设置属性
}

AbstractCell.prototype.mergePropertyFrom = function(oAnother)
{
	//不支持多选设置属性，该接口无效；需要时覆盖
}

AbstractCell.prototype.applyProperty = function(oAnother)
{
	//不支持多选设置属性，该接口无效；需要时覆盖
}

AbstractCell.prototype.isMustBindResource = function()
{
	return false;//必须绑定资源，创建时会弹出选择框
}

AbstractCell.prototype.isCanLinkResource = function()
{
	return false;//可以链接资源
}

//true 处于设计区布局表格中； false 处于可切换组件集合中
AbstractCell.prototype.hasLayout = function()
{
	return this.oLayout.oLayoutTable;
}

//添加(如拖动)到可切换组件集合中的组件要清除布局信息
AbstractCell.prototype.clearLayout = function()
{
	this.oLayout.oLayoutTable = null;
}

///////////////////////////////////////////////////////////
// Class 文字对象的数据模
function Cell_Text()
{
	AbstractCell.call(this, "text", _oModel.distributeUid("text"));//字段的继承
	this.sText = "";
	this.oStyle = new Style();
	this.sLinkType = "";
	this.sLinkTip = "";
	this.sLinkURI = "";
}

Cell_Text.prototype = new AbstractCell();//方法的继承

Cell_Text.prototype.updateUI = function(oDiv)
{   
	oDiv.innerHTML = '<table style="width:100%; height:100%"><tr><td></td></tr></table>';
	var oTd = oDiv.children[0].children[0].children[0].children[0];
	oTd.innerHTML = this.sText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
	if(this.sLinkType != "") {
		oTd.innerHTML = "<span title=\""+this.sLinkTip +"\">" + oTd.innerHTML + "</span>";
	}
	this.oStyle.updateUI(oTd);
}

Cell_Text.prototype.toXml = function(oDesignedModel)
{
	var sStyleId = oDesignedModel.getStoreStyleId(this.oStyle);
	var sXml = '<Cell type="text"' + this.commonToXml()
			+ ' style="' + sStyleId  
			+ '" linkType="' + this.sLinkType 
			+ '" linkTip="' + this.sLinkTip
			+ '" linkURI="' + this.sLinkURI
			+ '" linkReportType="' + this.sLinkReportType
			+ '"><![CDATA['	+ this.sText + ']]></Cell>';
	return sXml;
}

Cell_Text.prototype.fromXml = function(oDom, oStyle)
{
	this.commonFromXml(oDom);
	this.sText = oDom.text;
	this.sLinkType = oDom.getAttribute("linkType") || "";
	this.sLinkTip = oDom.getAttribute("linkTip") || "";
	this.sLinkURI = oDom.getAttribute("linkURI") || "";
	this.sLinkReportType = oDom.getAttribute("linkReportType") || "";
	if(oStyle)
	{
		this.oStyle = oStyle;
	}
}

Cell_Text.prototype.clone = function()
{
	var newInst = new Cell_Text();
	this.commonClone(newInst);
	newInst.sText = this.sText;
	newInst.sLinkType = this.sLinkType;
	newInst.sLinkTip = this.sLinkTip;
	newInst.sLinkURI = this.sLinkURI;
	newInst.sLinkReportType = this.sLinkReportType;
	newInst.oStyle = this.oStyle.clone();
	return newInst;
}

Cell_Text.prototype.propertySetting = function( f )
{
	var oParms = new Object();
	oParms.sText = this.sText;
	oParms.oStyle = this.oStyle.clone();
	this.commonPreparePropertyToSet(oParms);
	var _this = this;
	
	var oldName = _.trim( oParms.name || "" );
	
	_wrapHTMLPageInDialog( {
		uri: "dlgText.htm",
		width: 360,
		height: 420,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.applyProperty(oParms);
				f && f();
				
				handleDialInSubScriptEngine( oldName, _.trim( oParms.name ), _this );
			}
		}
	} );
}

//用传入对象把当前合并成可能带有不确定值的对象
Cell_Text.prototype.mergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof Cell_Text))
	{
		return;
	}
	
	this.commonMergePropertyFrom(oAnother);
	if(oAnother.sText != this.sText)
	{
		this.sText = null;
	}
	this.oStyle.mergePropertyFrom(oAnother.oStyle);
}

//将另一个对象的属性应用到当前对象
Cell_Text.prototype.applyProperty = function(oAnother)
{
	if(oAnother.sText != null)
	{
		this.sText = oAnother.sText;
	}
	this.oStyle.applyProperty(oAnother.oStyle);
	this.commonApplyProperty(oAnother);
	this.commonUpdateUI();
}

Cell_Text.prototype.isCanLinkResource = function()
{
	return true;
}

Cell_Text.prototype.linkResource = function( f )
{
	var oParms = new Object();
	oParms.sType = "picture";
	oParms.sUri = this.sUri;
	oParms.servletURL = _env.servletURL;
	oParms.sLinkType = this.sLinkType;
	oParms.sLinkURI = this.sLinkURI;
	oParms.sLinkTip = this.sLinkTip;
	oParms.sLinkReportType = this.sLinkReportType;
	
	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgLinkSelector.htm",
		width: 410,
		height: 370,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.sLinkTip = oParms.sLinkTip;
				_this.sLinkType = oParms.sLinkType;
				_this.sLinkURI = oParms.sLinkURI;
				_this.sLinkReportType = oParms.sLinkReportType;
				_this.commonUpdateUI();
				f && f();
			}
		}
	} );
}


///////////////////////////////////////////////////////////
// Class 片段对象的数据模
function Cell_Piece()
{
	AbstractCell.call(this, "piece", _oModel.distributeUid("piece"));//字段的继承
	this.sUri;
	this.sCaption;
}

Cell_Piece.prototype = new AbstractCell();//方法的继承

Cell_Piece.prototype.updateUI = function(oDiv)
{
	oDiv.style.background = "#ffffff";
	
	var sTextToShow;
	var sTextColor;
	if(this.sUri)
	{
		
		sTextColor = "#000000";
		if(this.sCaption=="null" || this.sCaption==null || this.sCaption=="undefined"){
			sTextToShow = "片段：" + this.sUri;
		}else{
			sTextToShow = "片段：" + this.sCaption;
			
		}
		
	}
	else
	{
		sTextColor = "#ff0000";
		sTextToShow = "<请绑定片段来源>";
	}

	var sTitleToShow = (this.sTitle ? this.sTitle : "");

	var sInnerHtml = '<table style="width:100%; height:100%; border:0;" cellSpacing="0" cellPadding="0">';
	if(this.bShowTitle)
	{
		sInnerHtml += '<tr height="26"><td class="cellTitle">' + sTitleToShow + '</td></tr>'
	}
	sInnerHtml += '<tr><td style="font-size:9pt; color:' + sTextColor + '">' + sTextToShow + '</td></tr></table>';

	oDiv.innerHTML = sInnerHtml;
}

Cell_Piece.prototype.toXml = function(oDesignedModel)
{
	var xml = this.commonToXml();
	if(this.bCanDrill)	
	{
		xml += ' canDrill="true"';
	}
	var sXml = '<Cell type="piece"' + xml + '>';
	if(this.sUri)
	{
		sXml += this.sUri;
	}
	sXml += '</Cell>';
	return sXml;
}

Cell_Piece.prototype.fromXml = function(oDom, oStyle)
{
	this.commonFromXml(oDom);
	this.bCanDrill = (oDom.getAttribute("canDrill") == "true" ? true : false);
	this.sUri = oDom.text;
	this.sCaption=oDom.getAttribute("caption");
}

Cell_Piece.prototype.clone = function()
{
	var newInst = new Cell_Piece();
	this.commonClone(newInst);
	newInst.bCanDrill = this.bCanDrill;
	newInst.sUri = this.sUri;
	return newInst;
}

Cell_Piece.prototype.propertySetting = function( f )
{
	var oParms = new Object();
	this.commonPreparePropertyToSet(oParms);
	oParms.bCanDrill = this.bCanDrill;
	var _this = this;
	
	var oldName = _.trim( oParms.name || "" );
	
	_wrapHTMLPageInDialog( {
		uri: "dlgPiece.htm",
		width: 360,
		height: 200,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.applyProperty(oParms);
				f && f();
				
				handleDialInSubScriptEngine( oldName, _.trim( oParms.name ), _this );
			}
		}
	} );
}

Cell_Piece.prototype.mergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof Cell_Piece))
	{
		return;
	}
	
	this.commonMergePropertyFrom(oAnother);
}

Cell_Piece.prototype.applyProperty = function(oAnother)
{
	this.commonApplyProperty(oAnother);
	this.bCanDrill = oAnother.bCanDrill;
	this.commonUpdateUI();
}

Cell_Piece.prototype.isMustBindResource = function()
{
	return true;
}

Cell_Piece.prototype.bindResource = function( f )
{
	var oParms = new Object();
	oParms.sType = "piece";
	oParms.sUri = this.sUri;
	oParms.servletURL = _env.servletURL;
	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgResSelector.htm",
		width: 410,
		height: 270,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.sUri = oParms.sUri;
				_this.sCaption = oParms.sCaption;
				_this.commonUpdateUI();
				f && f();
			}
		}
	} );
}

///////////////////////////////////////////////////////////
// Class 图片对象的数据模
function Cell_Picture()
{
	AbstractCell.call(this, "picture", _oModel.distributeUid("picture"));//字段的继承
	this.sUri;
	this.sScale = "filled";//缩放
	this.sLinkType = "";
	this.sLinkTip = "";
	this.sLinkURI = "";
	this.sLinkReportType = "";
}

Cell_Picture.prototype = new AbstractCell();//方法的继承

Cell_Picture.prototype.updateUI = function(oDiv)
{
	oDiv.style.background = "#ffffff";
	var sTextToShow;
	var sTextColor;
	var sImg = "";//充满时采用<Img>的方式
	var sBackground = "";//原始大小时采用背景图的方式
	if(this.sUri)
	{
		sTextColor = "#000000";
		sTextToShow = "图片：" + this.sUri;
		if(this.sScale == "filled")//充满
		{
			var iPicWith;
			var iPicHeight;
			if(this.hasLayout())
			{
				//看是否在融合块中，是的话要算融合块的大小
				var oLayoutTable = this.oLayout.oLayoutTable;
				var mb = oLayoutTable.getMergeBlock(this.oLayout.iRowIdx, this.oLayout.iColIdx);
				if(mb)
				{
					iPicWith = mb.getWidth(oLayoutTable);
					iPicHeight = mb.getHeight(oLayoutTable);
				}
				else
				{
					iPicWith = oLayoutTable.getColWidth(this.oLayout.iColIdx);
					iPicHeight = oLayoutTable.getRowHeight(this.oLayout.iRowIdx);
				}
				iPicWith -= 10;//10是TD的padding
				iPicHeight -= 10;
			}
			else
			{
				iPicWith = 80;//在可切换对象区域，写死80
				iPicHeight = 80;
			}
			
			iPicHeight -= (this.bShowTitle ? 26 : 0);
			iPicHeight = (iPicHeight < 0 ? 0 : iPicHeight);
			iPicWith = (iPicWith < 0 ? 0 : iPicWith);
			sImg = '<img ondrag="return false" style="width:' + iPicWith + '; height:' + iPicHeight + '" src="' 
				+ this.getRuntimePictureUrl() + '"/>';
		}
		else//原始大小
		{
			sBackground = ' background-image:url(' + this.getRuntimePictureUrl()
				+ '); background-repeat:no-repeat; background-position:center center;';
		}
	}
	else
	{
		sTextColor = "#ff0000";
		sTextToShow = "<请绑定图片来源>";
	}

	var sTitleToShow = (this.sTitle ? this.sTitle : "");
	
	var sInnerHtml = '<table style="width:100%; height:100%; border:0;" cellSpacing="0" cellPadding="0">';
	if(this.bShowTitle)
	{
		sInnerHtml += '<tr height="26"><td class="cellTitle">' + sTitleToShow + '</td></tr>'
	}
	
	sInnerHtml += '<tr><td style="font-size:9pt; color:' + sTextColor + ';' + sBackground + '">'
	if(this.sUri)
	{
		sInnerHtml += sImg;
	}
	else
	{
		sInnerHtml += sTextToShow;
	}
	sInnerHtml += '</td></tr></table>';

	oDiv.innerHTML = sInnerHtml;
	
	if(this.sLinkType != "") {
		oDiv.style.cursor = "pointer";
		oDiv.title = this.sLinkTip;	
	}
	
	if(this.sCaption=="null" ||this.sCaption==null || this.sCaption=="undefined"){
		oDiv.title = (this.sUri ? this.sUri : "");//tooltips
	}else{
		oDiv.title = (this.sUri ? this.sCaption : "");//tooltips
		
	}

}

Cell_Picture.prototype.getRuntimePictureUrl = function()
{
	if(_env instanceof Env)
	{
		return "e:\未命名.jpg"
	}
	else
	{
		return bi.getRepositoryPicture(_env.servletURL, this.sUri);
	}
}

Cell_Picture.prototype.toXml = function(oDesignedModel)
{
	var sXml = '<Cell type="picture"' + this.commonToXml();
	if(this.sScale)
	{
		sXml += ' scale="' + this.sScale + '"';
	}
	sXml += ' linkType="' + this.sLinkType; 
	sXml += '" linkTip="' + this.sLinkTip;
	sXml += '" linkURI="' + this.sLinkURI;
	sXml += '" linkReportType="' + this.sReportType;
	sXml += '">';
	if(this.sUri)
	{
		sXml += this.sUri;
	}
	sXml += '</Cell>';
	return sXml;
}

Cell_Picture.prototype.fromXml = function(oDom, oStyle)
{   
	this.commonFromXml(oDom);
	this.sUri = oDom.text;
    this.sCaption=oDom.getAttribute("caption");
	var sScale = oDom.getAttribute("scale");
	this.sLinkType = oDom.getAttribute("linkType") || "";
	this.sLinkTip = oDom.getAttribute("linkTip") || "";
	this.sLinkURI = oDom.getAttribute("linkURI") || "";
	this.sLinkReportType = oDom.getAttribute("linkReportType") || "";
	if(sScale)
	{
		this.sScale = sScale;
	}
}

Cell_Picture.prototype.clone = function()
{
	var newInst = new Cell_Picture();
	this.commonClone(newInst);
	newInst.sUri = this.sUri;
	newInst.sLinkType = this.sLinkType;
	newInst.sLinkTip = this.sLinkTip;
	newInst.sLinkURI = this.sLinkURI;
	newInst.sLinkReportType = this.sLinkReportType;
	newInst.sScale = this.sScale;
	return newInst;
}

Cell_Picture.prototype.propertySetting = function( f )
{
	var oParms = new Object();
	this.commonPreparePropertyToSet(oParms);
	oParms.sScale = this.sScale;
	var _this = this;
	
	var oldName = _.trim( oParms.name || "" );
	
	_wrapHTMLPageInDialog( {
		uri: "dlgPicture.htm",
		width: 360,
		height: 220,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.applyProperty(oParms);
				f && f();
				
				handleDialInSubScriptEngine( oldName, _.trim( oParms.name ), _this );
			}
		}
	} );
}

Cell_Picture.prototype.mergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof Cell_Picture))
	{
		return;
	}
	
	if(oAnother.sScale != this.sScale)
	{
		this.sScale = null;
	}
	this.commonMergePropertyFrom(oAnother);
}

Cell_Picture.prototype.applyProperty = function(oAnother)
{
	if(oAnother.sScale != null)
	{
		this.sScale = oAnother.sScale;
	}
	this.commonApplyProperty(oAnother);
	this.commonUpdateUI();	
}

Cell_Picture.prototype.isMustBindResource = function()
{
	return true;
}

Cell_Picture.prototype.bindResource = function( f )
{
	
	var oParms = new Object();
	oParms.sType = "picture";
	oParms.sUri = this.sUri;
	oParms.servletURL = _env.servletURL;
	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgResSelector.htm",
		width: 410,
		height: 270,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.sUri = oParms.sUri;
				_this.sCaption = oParms.sCaption;
				_this.commonUpdateUI();
				f && f();
			}
		}
	} );
}

Cell_Picture.prototype.isCanLinkResource = function()
{
	return true;
}

Cell_Picture.prototype.linkResource = function( f )
{
	var oParms = new Object();
	oParms.sType = "picture";
	oParms.sUri = this.sUri;
	oParms.sLinkType = this.sLinkType;
	oParms.sLinkURI = this.sLinkURI;
	oParms.sLinkTip = this.sLinkTip;
	oParms.sLinkReportType = this.sLinkReportType;
	oParms.servletURL = _env.servletURL;
	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgLinkSelector.htm",
		width: 410,
		height: 370,
		param: oParms,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.sLinkTip = oParms.sLinkTip;
				_this.sLinkType = oParms.sLinkType;
				_this.sLinkURI = oParms.sLinkURI;
				_this.sLinkReporttype = oParms.sLinkReportType;
				_this.commonUpdateUI();
				f && f();
			}
		}
	} );
}


// 列表。added by laikun, 09-2-12
function Cell_Table() {
	AbstractCell.call(this, "table", _oModel.distributeUid("table"));
	this.ds = null;
	this.outputColumns = null;
}

_.extend( Cell_Table.prototype = new AbstractCell(), {
	
	updateUI: function( div ) {
		var text;
		var sInnerHtml = '<table style="width:100%; height:100%; border:0;" cellSpacing="0" cellPadding="0">';
		if(this.bShowTitle)
		{
			sInnerHtml += '<tr height="26"><td class="cellTitle">' + ( this.sTitle || "" ) + '</td></tr>'
		}
		sInnerHtml += '<tr><td sue="containerTD" style="font-size:9pt; color:#000"></td></tr></table>';
		div.innerHTML = sInnerHtml;
		
		if ( this.ds ) {
			text = "~列表：已绑定数据源" + this.ds.param.name;
		} else {
			text = ";color:#F00~请选择要绑定的数据源";
		}
		var table = _.table( _.format( "{[!vertical-align:middle;font-size:12px%s]}!height:100%", text ), _.select( div, "sue", 1, "containerTD" ) );
	},
	
	isMustBindResource: _.K( true ),
	
	bindResource: __bindResource,
	
	isAutoSetProperty: true,
	
	propertySetting: function() {
		var _this = this;
		
		if ( !this.ds ) {
			this.bindResource();
			return;
		}
		
		var dialog = Sue.ui.ext.dialog( {
			caption: "列表属性设置",
			width: 470,
			height: 340,
			closeAction: "close"
		} );
	
		dialog.content.style.padding = "10px";
		dialog.setContent( _.loadUIT( "bi_dialog_dashboard_table_properties" ) );
		
		sue( "isShowTitle" ).checked = !!this.bShowTitle;
		sue( "title" ).value = this.sTitle || "";
		var objectName = sue( "objectName" );
		var oldName = objectName.value = this.name;
		
		var rootStyle = {
			border: "none",
			width: "154px",
			height: "146px"
		};
		var leftList = Sue.ui.list( {
			parent: sue( "dsColDiv" ),
			rootStyle: rootStyle
		} );
		var rightList = Sue.ui.list( {
			parent: sue( "TableColDiv" ),
			rootStyle: rootStyle
		} );
		_.bindEvent( sue( "gt" ), "click", function() {
			var items = _.unhash( leftList.selected, "value" );
			leftList.disable( items );
			rightList.insert( items );
		} );
		_.bindEvent( sue( "lt" ), "click", function() {
			var items = _.unhash( rightList.selected, "value" );
			leftList.enable( items );
			rightList.remove( items );
		} );
		_.bindEvent( sue( "gt2" ), "click", function() {
			rightList.remove( rightList.items );
			var allItems = leftList.items;
			rightList.insert( allItems );
			leftList.disable( allItems );
		} );
		_.bindEvent( sue( "lt2" ), "click", function() {
			rightList.remove( rightList.items );
			leftList.enable( leftList.items );
		} );
		_.bindEvent( sue( "up" ), "click", function() {
			var allItems = rightList.items;
			if ( !allItems.length || allItems[0].uuid in rightList.selected ) return;
			var selectedItem = rightList.selected;
			var items = [];
			for( var i = 0; i < allItems.length; i++ ) {
				allItems[i].uuid in selectedItem && items.push( allItems[i] );
			}
			_.map( items, function( item ) {
				var index = _.indexOf( rightList.items, item );
				rightList.swap(item, rightList.items[index - 1]);
			} );
		} );
		_.bindEvent( sue( "down" ), "click", function() {
			var allItems = rightList.items;
			if ( !allItems.length || allItems[allItems.length - 1].uuid in rightList.selected ) return;
			var selectedItem = rightList.selected;
			var items = [];
			for( var i = 0; i < allItems.length; i++ ) {
				allItems[i].uuid in selectedItem && items.unshift( allItems[i] );
			}
			_.map( items, function( item ) {
				var index = _.indexOf( rightList.items, item );
				rightList.swap(item, rightList.items[index + 1]);
			} );
		} );
		if ( this.ds ) {
			var allItems = _.map( this.ds.param.outputColumns, function( oc ) {
				return {
					caption: oc.alias
				};
			} );
			leftList.insert( allItems );
			var ocHash = _.hash( this.outputColumns, _.I, _.K( 1 ) );
			var outputItems = _.collect( leftList.items, function( item ) {
				return ocHash[ item.caption ];
			} );
			rightList.insert( outputItems );
			leftList.disable( outputItems );
		}
		
		dialog.addButton( "确定", function() {
			if ( _this.ds && !rightList.items.length ) {
				alert( "列表至少需要选择一个输出列" );
				return;
			}
			_this.bShowTitle = !!sue( "isShowTitle" ).checked;
			_this.sTitle = sue( "title" ).value;
			
			var testObjectName = _.trim( sue( "objectName" ).value );
			testObjectName = testValidObjectName( testObjectName );
			if ( testObjectName !== true ) {
				alert( testObjectName );
				return;
			}
			_this.name = _.trim( sue( "objectName" ).value );
			
			rightList.items.length && ( _this.outputColumns = _.map( rightList.items, "caption" ) );
			_this.commonUpdateUI();
			handleDialInSubScriptEngine( oldName, _this.name, _this );
			dialog.destroy();
		} );
		dialog.addButton( "取消", function() {
			dialog.destroy();
		} );
		
		bi.updateToPortalStyleButton( dialog.content );
		
		try {
			objectName.focus();
		} catch( e ) {
		}
	
		function sue( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
	},
	
	toXml: function() {
		// TODO: 只考虑了私有的情况
		if ( !this.ds ) {
			return _.format( "<Cell type=\"table\"%s/>", this.commonToXml() );
		} else if ( this.ds.param.saveLocation == "dashboard" ) {
			return _.format( "<Cell type=\"table\"%s ds=\"%s\"><OutputColumns>", this.commonToXml(), this.ds.param.name )
				+ _.map( this.outputColumns, function( oc ) {
					return _.format( "<OutputColumn><![CDATA[%s]]></OutputColumn>", oc );
				} ).join( "" )
				+ "</OutputColumns></Cell>";
		}
	},
	
	fromXml: function( oDom ) {
		this.commonFromXml(oDom);
		// TODO: 只考虑了私有的情况
		var dsName = oDom.getAttribute("ds");
		if ( dsName ) {
			var ds = DataSource.getInstancesByName( dsName );
			this.ds = ds && ds[0];
			this.outputColumns = _.map( getDomChildNode( oDom, "OutputColumns" ).childNodes, function( oc ) {
				return oc.text;
			} );
		} else {
			this.ds = null;
		}
	}
} );

// 图表。added by laikun, 09-2-23
function Cell_Chart() {
	AbstractCell.call(this, "chart", _oModel.distributeUid("chart"));
	this.ds = null;
	this.chartType = "Bar";
	this.xs = [];
	this.ys = [];
	this.ms = [];
}

_.extend( Cell_Chart.prototype = new AbstractCell(), {
	chartTypeMap: {
		Bar: "柱状图",
		BarH: "柱状图（水平）",
		Bar3D: "3D柱状图",
		Bar3DH: "3D柱状图（水平）",
		StackedBar: "叠加柱状图",
		StackedBarH: "叠加柱状图（水平）",
		StackedBar3D: "3D叠加柱状图",
		StackedBar3DH: "3D叠加柱状图（水平）",
		MultiPie: "饼图",
		Line: "折线图",
		Area: "区域图",
		AreaH: "区域图（水平）",
		StackedArea: "叠加区域图",
		StackedAreaH: "叠加区域图（水平）",
		BarLine: "柱线图",
		CombinedBarLine: "组合柱线图"
	},
	updateUI: function( div ) {
		var text;
		var sInnerHtml = '<table style="width:100%; height:100%; border:0;" cellSpacing="0" cellPadding="0">';
		if(this.bShowTitle)
		{
			sInnerHtml += '<tr height="26"><td class="cellTitle">' + ( this.sTitle || "" ) + '</td></tr>'
		}
		sInnerHtml += '<tr><td sue="containerTD" style="font-size:9pt; color:#000"></td></tr></table>';
		div.innerHTML = sInnerHtml;
		
		if ( this.ds ) {
			text = "~图表：已绑定数据源" + this.ds.param.name;
		} else {
			text = ";color:#F00~请选择要绑定的数据源";
		}
		var table = _.table( _.format( "{[!vertical-align:middle;font-size:12px%s]}!height:100%", text ), _.select( div, "sue", 1, "containerTD" ) );
	},
	
	isMustBindResource: _.K( true ),
	
	bindResource: __bindResource,
	
	isAutoSetProperty: true,
	
	propertySetting: function() {
		var _this = this;
		
		if ( !this.ds ) {
			this.bindResource();
			return;
		}
		
		var dialog = Sue.ui.ext.dialog( {
			caption: "图表属性设置",
			width: 800,
			height: 400,
			closeAction: "close"
		} );
		dialog.content.style.padding = "10px";
		dialog.setContent( _.loadUIT( "bi_dialog_dashboard_chart_properties" ) );
		
		sue( "isShowTitle" ).checked = !!this.bShowTitle;
		sue( "title" ).value = this.sTitle || "";
		var objectName = sue( "objectName" );
		var oldName = objectName.value = this.name;
		var previewBtn = sue( "previewBtn" );
		var chartTypeDiv = sue( "chartType" );
		var chartDiv = sue( "preview" );
		
		var chartType = this.chartType;
		var chartTypeList = _.map( _.unhash( this.chartTypeMap, "key" ), function( key ) {
			return {
				caption: _this.chartTypeMap[key],
				value: key,
				click: changeTypeHook,
				selected: key == _this.chartType,
				disable: key == _this.chartType
			};
		} );
		var menu = Sue.ui.menu( {
			items: chartTypeList,
			single: true,
			z: dialog.root.style.zIndex + 1
		} );
		var selector = Sue.ui.ext.selectableLabel( {
			parent: chartTypeDiv,
			caption: "切换图表类型：",
			valueCaption: this.chartTypeMap[ this.chartType ],
			panel: menu.root,
			bgcolor: Sue.config.cs[14] || "#E0EAF5"
		} );
		
		var data = _.map( this.ds.param.outputColumns, function( oc ) {
			return [ oc.alias, "", "", oc.type ];
		} );
		// 度量有效的数值类型
		var numberType = {
			"byte": 1,
			"short": 1,
			"int": 1,
			"float": 1,
			"double": 1,
			bigint: 1,
			smallint: 1,
			tinyint: 1,
			numeric: 1,
			number: 1,
			decimal: 1,
			real: 1,
			money: 1,
			smallmoney: 1,
			integer:1
		};
		var table = Sue.ui.table( {
			parent: sue( "config_table" ),
			cellCSSText: "padding-left:0px;text-align:center",
			head: _.map( ",X轴,Y轴,度量".split( "," ), function( h ) {
				return {
					caption: h
				};
			} ),
			data: data,
			renderer: [
				{
					col: "1,2,3",
					render: function( param ) {
						var td = param.td;
						var type = td.innerHTML;
						var isChecked = param.col == 1 && _.indexOf( _this.xs, data[param.row][0] ) != -1
							|| param.col == 2 && _.indexOf( _this.ys, data[param.row][0] ) != -1
							|| param.col == 3 && _.indexOf( _this.ms, data[param.row][0] ) != -1;
						if ( param.col == 3 && !(type.toLowerCase() in numberType)) {
							// 度量只能是数值类型。非数值类型不添加复选框。
							td.innerHTML = data[param.row][3] = "";
							return;
						}
						td.innerHTML = _.format( "<input type=\"checkbox\" %s/>", isChecked ? "checked=\"checked\"" : "" );
						data[param.row][param.col] = isChecked;
						td.style.cursor = "pointer";
					}
				},
				{
					col: "1,2,3",
					type: "mouseover",
					render: function( param ) {
						if ( param.td.firstChild ) {
							param.td.style.backgroundColor = "#9C0";
						}
					}
				},
				{
					col: "1,2,3",
					type: "mouseout",
					render: function( param ) {
						if ( param.td.firstChild ) {
							param.td.style.backgroundColor = "";
						}
					}
				},
				{
					col: "1,2,3",
					type: "click",
					render: function( param ) {
						var td = param.td;
						if ( td.firstChild ) {
							var col = 0;
								node = td.parentNode.firstChild;
							while( col++, node = node.nextSibling ) {
								node !== td && node.firstChild && ( node.firstChild.checked = data[param.row][col] = false );
							}
							td.firstChild && ( td.firstChild.checked = data[param.row][param.col] = !data[param.row][param.col] );
							autoRefresh = false;
						}
					}
				}
			]
		} );
		
		var autoRefresh = false;
		_.bindEvent( previewBtn, "click", preview );
		
		dialog.addButton( "确定", function() {
			var xs = extractColumn( 1 );
			var ms = extractColumn( 3 );
			if ( !xs.length ) {
				alert( "X轴至少选择一项" );
				return;
			}
			if ( !ms.length ) {
				alert( "度量至少选择一项" );
				return;
			}
			var ys = extractColumn( 2 );
			_this.xs = xs;
			_this.ys = ys;
			_this.ms = ms;
			_this.chartType = chartType;
			_this.bShowTitle = !!sue( "isShowTitle" ).checked;
			_this.sTitle = sue( "title" ).value;
			
			var testObjectName = _.trim( sue( "objectName" ).value );
			testObjectName = testValidObjectName( testObjectName );
			if ( testObjectName !== true ) {
				alert( testObjectName );
				return;
			}
			_this.name = _.trim( sue( "objectName" ).value );
			
			_this.commonUpdateUI();
			handleDialInSubScriptEngine( oldName, _this.name, _this );
			dialog.destroy();
		} );
		dialog.addButton( "取消", function() {
			dialog.destroy();
		} );
		
		bi.updateToPortalStyleButton( dialog.content );
		
		try {
			objectName.focus();
		} catch( e ) {
		}
	
		function preview() {
			var xs = extractColumn( 1 );
			var ms = extractColumn( 3 );
			if ( !xs.length ) {
				alert( "X轴至少选择一项" );
				return;
			}
			if ( !ms.length ) {
				alert( "度量至少选择一项" );
				return;
			}
			var ys = extractColumn( 2 );
			var tempID = Math.sin( +new Date );
			
			_.post( {
						url: webUtilServlet,
						beforeStart: _.Z,
						json: [
							"1,2",
							{
								servletType: bi_tree_util.ServletType_BIWebUtil,
								action: "createTempDataSource",
								id: tempID,
								datacenter: _this.ds.param.datacenter,
								content: _this.ds.param.content,
								maxRowCount: _this.ds.param.maxRowCount,
								outputColumns: _.map( _this.ds.param.outputColumns, function( oc ) {
									return oc.column + "," + oc.alias;
								} )
							},
							{
								servletType: bi_tree_util.ServletType_BIWebUtil,
								action: "getPreviewChart",
								id: tempID,
								width: parseInt( chartDiv.style.width ),
								height: parseInt( chartDiv.style.height ),
								type: chartType,
								xs: xs,
								ys: ys,
								ms: ms
							}
						],
						callback: function( r ) {				
							//如果是FusionCharts支持的图形，则使用FusionCharts，否则使用默认jfreechart
							var width=chartDiv.style.width;
							width=width.substr(0,width.length-"px".length);
							var height=chartDiv.style.height ;
							height=height.substr(0,height.length-"px".length);				
							switch(chartType){
								case "Bar":{//柱状图 Bar2D
									 var chart = new FusionCharts("FusionCharts/FCF_MSColumn2D.swf", "MSColumn2D",width,height);
							         chart.setDataXML(r[2]);
									 chart.render(chartDiv);
									 break;									
								}
								case "BarH":{//"柱状图（水平）"
									 var chart = new FusionCharts("FusionCharts/FCF_MSBar2D.swf", "MSBar2D",width, height);
		                             chart.setDataXML(r[2]);		   
		                             chart.render(chartDiv);
									 break;
								}
								case "Bar3D":{//"3D柱状图
									 var chart = new FusionCharts("FusionCharts/FCF_MSColumn3D.swf", "MSColumn3D",width, height);
		                             chart.setDataXML(r[2]);		   
		                             chart.render(chartDiv);
		                             break;
								}
								case "StackedBar":{//"叠加柱状图"
								   var chart = new FusionCharts("FusionCharts/FCF_StackedColumn2D.swf", "StCol2D",width, height);
								   chart.setDataXML(r[2]);		   
								   chart.render(chartDiv);
								   break;
								}
								case "StackedBarH":{//"叠加柱状图（水平）"
								   var chart = new FusionCharts("FusionCharts/FCF_StackedBar2D.swf", "StBar2D", width, height);
								   chart.setDataXML(r[2]);		   
								   chart.render(chartDiv);
								   break;
								}
								case "Line":{//"折线图"
								   var chart = new FusionCharts("FusionCharts/FCF_MSLine.swf", "MSLine", width, height);
								   chart.setDataXML(r[2]);		   
								   chart.render(chartDiv);
								   break;
								}
								case "Area":{//"区域图"
								   var chart = new FusionCharts("FusionCharts/FCF_MSArea2D.swf", "MSArea2D", width, height);
								   chart.setDataXML(r[2]);	   
								   chart.render(chartDiv);
								   break;
								}
								case "StackedArea":{//"叠加区域图"
								   var chart = new FusionCharts("FusionCharts/FCF_StackedArea2D.swf", "StArea2D", width, height);
								   chart.setDataXML(r[2]);		   
								   chart.render(chartDiv);
								   break;
								}
								case "BarLine":{//"柱线图"
									var chart = new FusionCharts("FusionCharts/FCF_MSColumn3DLineDY.swf", "Col3DLineDY",width, height);
									chart.setDataXML(r[2]);		   
									chart.render(chartDiv);
								    break;
								}default :{//jfreechart
									if (!r[2].error) {
									chartDiv.innerHTML = r[2];
									//autoRefresh = true;
									} else {
									chartDiv.innerHTML = r[2].error.message;
									}
									break;
								}
			         }
						
		    }
	 } );		
}
		
		
		function sue( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
		
		function changeTypeHook( i ) {
			selector.valueText.innerHTML = chartTypeList[i].caption;
			chartType = chartTypeList[i].value;
			autoRefresh && preview();
		}
		
		function extractColumn( col ) {
			return _.map( _.collect( data, function( row ) {
				return row[col];
			} ), function( row ) {
				return row[0];
			} );
		}
	},
	
	toXml: function() {
		// TODO: 只考虑了私有的情况
		if ( !this.ds ) {
			return _.format( "<Cell type=\"chart\"%s/>", this.commonToXml() );
		} else if ( this.ds.param.saveLocation == "dashboard" ) {
			return _.format( "<Cell type=\"chart\"%s ds=\"%s\"><Type><![CDATA[%s]]></Type><Xs>%s</Xs><Ys>%s</Ys><Measures>%s</Measures></Cell>",
				this.commonToXml(),
				this.ds.param.name,
				this.chartType,
				_.map( this.xs, function( x ) {
					return _.format( "<X><![CDATA[%s]]></X>", x );
				} ).join( "" ),
				_.map( this.ys, function( y ) {
					return _.format( "<Y><![CDATA[%s]]></Y>", y );
				} ).join( "" ),
				_.map( this.ms, function( m ) {
					return _.format( "<Measure><![CDATA[%s]]></Measure>", m );
				} ).join( "" ) );
		}
	},
	
	fromXml: function( oDom ) {
		this.commonFromXml(oDom);
		// TODO: 只考虑了私有的情况
		var dsName = oDom.getAttribute("ds");
		if ( dsName ) {
			var ds = DataSource.getInstancesByName( dsName );
			this.ds = ds && ds[0];
			this.chartType = getDomChildNode( oDom, "Type" ).text;
			this.xs = _.map( getDomChildNode( oDom, "Xs" ).childNodes, function( x ) {
				return x.text;
			} );
			this.ys = _.map( getDomChildNode( oDom, "Ys" ).childNodes, function( y ) {
				return y.text;
			} );
			this.ms = _.map( getDomChildNode( oDom, "Measures" ).childNodes, function( m ) {
				return m.text;
			} );
		} else {
			this.ds = null;
		}
	}
} );


// 输入组件。提供仪表板交互的能力
// add by laikun, 24-03-2009
function Cell_Input() {
	AbstractCell.call(this, "input", _oModel.distributeUid("input"));
	this.type = null;
	this.hintText = "";
	this.width = "100";
	this.isChecked=null;
	// 下拉框属性
	this.ds = null;
	this.captionColumn = "";
	this.valueColumn = "";
	//滑动条属性
	this.valign="h";
	this.maxValue_select="";
	this.maxValue_input="";
		        
	this.minValue_select="";
	this.minValue_input="";
		        
	this.distance_select="";
	this.distance_input="";
		        
	this.dfValue_select="";
	this.dfValue_input="";	 
	
	this.step_select="";
	this.step_input="";	       
	
	this.unit_input="";
	
	this.oDiv=null;
}

_.extend( Cell_Input.prototype = new AbstractCell(), {
	
	inputMap: {
		select: "下拉框",
		button: "按钮",
		checkbox: "复选框",
		radiobox:"单选按钮",
		slider:"滑动条"
	},
	
	updateUI: function( oDiv ) {
		this.oDiv=oDiv;
		oDiv.innerHTML = "";
		var text, color;
		if ( this.type ) {
			text = "组件：" + this.inputMap[ this.type ];
			color = "#000";
		} else {
			text = "组件：未定义";
			color = "#F00";
		}
		_.table( _.format( "{[!vertical-align:middle;color:%s~%s]}!width:100%;height:100%;font-size:12px", color, text ), oDiv );
	},
	
	isMustBindResource: _.K( true ),
	
	bindResource: function() {
		var _this = this;
		var dialog = Sue.ui.ext.dialog( {
			caption: "选择组件类型",
			width: 400,
			height: 250,
			closeAction: "close"
		} );
		dialog.content.style.verticalAlign = "top";
		var div = _.div( {
			parent: dialog.content,
			cssText: "margin:0px 10px;padding:10px;border:solid 1px #718BB7;background-color:#FFF;width:380px;height:180px;overflow:auto"
		} );
		var tree = Sue.ui.tree( {
			caption: "组件",
			parent: div
		} );
		var Node = tree.getNodeConstructor();
		tree.setRoot( Node( {
			caption: "下拉框",
			type: "select",
			click: _.Z,
			dblclick: bindInputType
		} ) );

		tree.setRoot( Node( {
			caption: "按钮",
			type: "button",
			click: _.Z,
			dblclick: bindInputType
		} ) );
		tree.setRoot( Node( {
			caption: "复选框",
			type: "checkbox",
			click: _.Z,
			dblclick: bindInputType
		} ) );
		tree.setRoot( Node( {
			caption: "单选按钮",
			type: "radiobox",
			click: _.Z,
			dblclick: bindInputType
		} ) );
		
		tree.setRoot( Node( {
			caption: "滑动条",
			type: "slider",
			click: _.Z,
			dblclick: bindInputType
		} ) );
		
		
		dialog.addButton( "确定", bindInputType );
		dialog.addButton( "取消", function() {
			dialog.destroy();
		} );
		
		function bindInputType() {
			var node = tree.getSelectedNode();
			if ( !node ) return;
			_this.type = node.type;
			dialog.destroy();
			_this.commonUpdateUI();
			_this.propertySetting();
		}
	},
	
	propertySetting: function() {
		var _this = this;
		if ( this.type == "select" ) {
			var dialog = Sue.ui.ext.dialog( {
				caption: "组件属性设定",
				width: 400,
				height: 265,
				closeAction: "close"
			} );
			dialog.content.style.verticalAlign = "top";
			dialog.setContent( _.loadUIT( "bi_dialog_dashboard_input_select_property" ) );
			
			var chooseDS = sue( "chooseDS" ),
			captionColumn = sue( "captionColumn" ),
			valueColumn = sue( "valueColumn" ),
			objectName = sue( "objectName" ),
			hintText = sue( "hintText" );
			width = sue("width");
				
			var oldName = objectName.value = this.name;
			hintText.value = this.hintText;
			if(this.width)
				width.value = this.width;
			
			captionColumn.disabled = valueColumn.disabled = true;
			_.map( DataSource.dsInstances, function( ds ) {
				chooseDS.options.add( new Option( ds.param.name, ds.param.name ) );
				if ( ds.param.name == _this.ds ) {
					chooseDS.options[chooseDS.options.length - 1].selected = true;
				}
			} );
			
			if ( this.ds ) {
				captionColumn.disabled = valueColumn.disabled = false;
				var ds = DataSource.getInstancesByName( this.ds )[0];
				_.map( ds.param.outputColumns, function( oc ) {
					captionColumn.options.add( new Option( oc.alias, oc.alias ) );
					valueColumn.options.add( new Option( oc.alias, oc.alias ) );
					if ( oc.alias == _this.captionColumn ) {
						captionColumn.options[captionColumn.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.valueColumn ) {
						valueColumn.options[valueColumn.options.length - 1].selected = true;
					}
				} );
			}
			
			_.bindEvent( chooseDS, "change", function() {
				var sv = chooseDS.options[chooseDS.selectedIndex].value;
				if ( sv ) {
					captionColumn.disabled = valueColumn.disabled = false;
					var ds = DataSource.getInstancesByName( sv )[0];
					captionColumn.options.length = valueColumn.options.length = 0;
					_.map( ds.param.outputColumns, function( oc ) {
						captionColumn.options.add( new Option( oc.alias, oc.alias ) );
						valueColumn.options.add( new Option( oc.alias, oc.alias ) );
					} );
				} else {
					captionColumn.disabled = valueColumn.disabled = true;
					captionColumn.options.length = valueColumn.options.length = 0;
				}
			} );
			
			dialog.addButton( "确定", function() {
				var dsName = chooseDS.options[chooseDS.selectedIndex].value;
				if(objectName.value==""){
					alert( "对象名不能为空" );
					return;
				}
				if ( !dsName ) {
					alert( "数据源不能为空" );
					return;
				}
			
				_this.hintText = _.trim( hintText.value );

				var w = _.trim(width.value);
				if(!_.isInteger(w))
				{
					alert("宽度必须为正整数");
					width.focus();
					return;
				}
				_this.width = w;
				
				var testObjectName = _.trim( objectName.value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.ds = dsName;
				_this.captionColumn = captionColumn.options[captionColumn.selectedIndex].value;
				_this.valueColumn = valueColumn.options[valueColumn.selectedIndex].value;
				_this.name = _.trim( objectName.value );
				resetOdiv(_this,"下拉框");
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialog.destroy();
			} );
			dialog.addButton( "取消", function() {
				resetOdiv(_this,"下拉框");
				dialog.destroy();
			} );
		} else if ( this.type == "button" ) {
			dialog = Sue.ui.ext.dialog( {
				caption: "组件属性设定",
				width: 400,
				height: 150,
				closeAction: "close"
			} );
			dialog.content.style.verticalAlign = "top";
			dialog.setContent( _.loadUIT( "bi_dialog_dashboard_input_button_property" ) );
			
			var objectName = sue( "objectName" ),
				hintText = sue( "hintText" );
				width = sue("width");
			
			objectName.value = this.name;
			hintText.value = this.hintText;
			width.value = this.width;
			
			var oldName = objectName.value = this.name;
			
			dialog.addButton( "确定", function() {
				var text = hintText.value;
				if(objectName.value==""){
					alert( "对象名不能为空" );
					return;
				}
				if ( !text ) {
					alert( "显示文本不能为空" );
					return;
				}
			
				_this.hintText = text;
				
				var w = _.trim(width.value);
				if(!_.isInteger(w))
				{
					alert("宽度必须为正整数");
					width.focus();
					return;
				}
				_this.width = w;
				var testObjectName = _.trim( objectName.value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.name = _.trim( objectName.value );
				
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialog.destroy();
			} );
			dialog.addButton( "取消", function() {
				dialog.destroy();
			} );
		}else if(this.type == "checkbox"){
			dialog = Sue.ui.ext.dialog( {
				caption: "组件属性设定",
				width: 400,
				height: 120,
				closeAction: "close"
			} );
			dialog.content.style.verticalAlign = "top";
			dialog.setContent( _.loadUIT( "bi_dialog_dashboard_input_checkbox_property" ) );
			
			var objectName = sue( "objectName" ),
				hintText = sue( "hintText" ),
				isChecked = sue("isChecked");
			
			objectName.value = this.name;
			hintText.value = this.hintText;
			isChecked.checked = this.isChecked;
			
			var oldName = objectName.value = this.name;		
			dialog.addButton( "确定", function() {
				var text = hintText.value;
				if(objectName.value==""){
					alert( "对象名不能为空" );
					return;
				}
				if ( !text ) {
					alert( "显示文本不能为空" );
					return;
				}
				
				_this.hintText =text;
				_this.isChecked = isChecked.checked;
				var testObjectName = _.trim( objectName.value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.name = _.trim( objectName.value );	
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialog.destroy();
			} );
			dialog.addButton( "取消", function() {
				dialog.destroy();
			} );
		}else if(this.type == "radiobox"){
			dialog = Sue.ui.ext.dialog( {
				caption: "组件属性设定",
				width: 400,
				height: 150,
				closeAction: "close"
			} );
			dialog.content.style.verticalAlign = "top";
			dialog.setContent( _.loadUIT( "bi_dialog_dashboard_input_radio_property" ) );
			
	 	    var	objectName = sue( "objectName" ),
			hintText = sue( "hintText" ),
			chooseDS = sue( "chooseDS" ),
			captionColumn = sue( "captionColumn" ),
			valueColumn = sue( "valueColumn" );
        
            var oldName = objectName.value = this.name;
		    hintText.value = this.hintText;
	
		    captionColumn.disabled = valueColumn.disabled = true;
			_.map( DataSource.dsInstances, function( ds ) {
				chooseDS.options.add( new Option( ds.param.name, ds.param.name ) );
				if ( ds.param.name == _this.ds ) {
					chooseDS.options[chooseDS.options.length - 1].selected = true;
				}
			} );
			
		    if ( this.ds ) {
				captionColumn.disabled = valueColumn.disabled = false;
				var ds = DataSource.getInstancesByName( this.ds )[0];
				_.map( ds.param.outputColumns, function( oc ) {
					captionColumn.options.add( new Option( oc.alias, oc.alias ) );
					valueColumn.options.add( new Option( oc.alias, oc.alias ) );
					if ( oc.alias == _this.captionColumn ) {
						captionColumn.options[captionColumn.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.valueColumn ) {
						valueColumn.options[valueColumn.options.length - 1].selected = true;
					}
				} );
			}
			
		    _.bindEvent( chooseDS, "change", function() {
				var sv = chooseDS.options[chooseDS.selectedIndex].value;
				if ( sv ) {
					captionColumn.disabled = valueColumn.disabled = false;
					var ds = DataSource.getInstancesByName( sv )[0];
					captionColumn.options.length = valueColumn.options.length = 0;
					_.map( ds.param.outputColumns, function( oc ) {
						captionColumn.options.add( new Option( oc.alias, oc.alias ) );
						valueColumn.options.add( new Option( oc.alias, oc.alias ) );
					} );
				} else {
					captionColumn.disabled = valueColumn.disabled = true;
					captionColumn.options.length = valueColumn.options.length = 0;
				}
			} );
			dialog.addButton( "确定", function() {
				var dsName = chooseDS.options[chooseDS.selectedIndex].value;
				if(objectName.value==""){
					alert( "对象名不能为空" );
					return;
				}
				if ( !dsName ) {
					alert( "数据源不能为空" );
					return;
				}
				
				_this.hintText = _.trim( hintText.value );
				
				var testObjectName = _.trim( objectName.value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.ds = dsName;
				_this.captionColumn = captionColumn.options[captionColumn.selectedIndex].value;
				_this.valueColumn = valueColumn.options[valueColumn.selectedIndex].value;
				_this.name = _.trim( objectName.value );
				resetOdiv(_this,"单选按钮");
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialog.destroy();
			} );
			dialog.addButton( "取消", function() {
				resetOdiv(_this,"单选按钮");
				dialog.destroy();
			} );
		}else if(this.type == "slider"){
			dialog = Sue.ui.ext.dialog( {
				caption: "组件属性设定",
				width: 450,
				height: 150,
				closeAction: "close"
			} );
			dialog.content.style.verticalAlign = "top";
			dialog.setContent( _.loadUIT( "bi_dialog_dashboard_input_slider_property" ) );
			
	 	    var	objectName = sue( "objectName" ),//对象名
			hintText = sue( "hintText" ),//标签
			width=sue( "width" ),//长度
			valign=sue( "valign" ),//方向
			chooseDS = sue( "chooseDS" ),//数据源
			
			maxValue_select=sue( "maxValue_select" ),//最大值选择框
			maxValue_input = sue( "maxValue_input" );//最大值输入框
			
			minValue_select=sue( "minValue_select" ),//最小值选择框
			minValue_input = sue( "minValue_input" );//最小值输入框
			
			distance_select=sue( "distance_select" ),//刻度间隔选择框
			distance_input = sue( "distance_input" );//刻度间隔输入框
			
			step_select=sue( "step_select" ),//步长选择框
			step_input = sue( "step_input" );//步长输入框
			
			dfValue_select=sue( "dfValue_select" ),//默认值选择框
			dfValue_input = sue( "dfValue_input" );//默认值输入框
			
			unit_input = sue( "unit_input" );//单位
			
            //初始化
            var oldName = objectName.value = this.name;
		    hintText.value = this.hintText;
	        width.value=this.width;
	        valign.value=this.valign;
	        
	        maxValue_select.value=this.maxValue_select;
	        maxValue_input.value=this.maxValue_input;
	        
	        minValue_select.value=this.minValue_select;
	        minValue_input.value=this.minValue_input;
	        
	        distance_select.value=this.distance_select;
	        distance_input.value=this.distance_input;
	        
	        step_select.value=this.step_select;
	        step_input.value=this.step_input;
	        
	        dfValue_select.value=this.dfValue_select;
	        dfValue_input.value=this.dfValue_input;
	        
	        unit_input.value=this.unit_input;
	        
	        
	        
		    maxValue_select.disabled = true;
			minValue_select.disabled = true;
			distance_select.disabled = true;
			step_select.disabled = true;
			dfValue_select.disabled =  true;
			_.map( DataSource.dsInstances, function( ds ) {
				chooseDS.options.add( new Option( ds.param.name, ds.param.name ) );
				if ( ds.param.name == _this.ds ) {
					chooseDS.options[chooseDS.options.length - 1].selected = true;
				}
			} );
			
		    if ( this.ds ) {
		    	
				maxValue_select.disabled = false;
				minValue_select.disabled = false;
				distance_select.disabled = false;
				step_select.disabled = false;
				dfValue_select.disabled =  false;
				
				var ds = DataSource.getInstancesByName( this.ds )[0];
				_.map( ds.param.outputColumns, function( oc ) {
					
					maxValue_select.options.add( new Option( oc.alias, oc.alias ) );
					minValue_select.options.add( new Option( oc.alias, oc.alias ) );
					distance_select.options.add( new Option( oc.alias, oc.alias ) );
					step_select.options.add( new Option( oc.alias, oc.alias ) );
					dfValue_select.options.add( new Option( oc.alias, oc.alias ) );
							
					if ( oc.alias == _this.maxValue_select ) {
						maxValue_select.options[maxValue_select.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.minValue_select ) {
						minValue_select.options[minValue_select.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.distance_select ) {
						distance_select.options[distance_select.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.step_select ) {
						step_select.options[step_select.options.length - 1].selected = true;
					}
					if ( oc.alias == _this.dfValue_select ) {
						dfValue_select.options[dfValue_select.options.length - 1].selected = true;
					}
					
				} );
			}
			
		    _.bindEvent( chooseDS, "change", function() {
		    	
				var sv = chooseDS.options[chooseDS.selectedIndex].value;
				if ( sv ) {
					maxValue_select.disabled = false;
				    minValue_select.disabled = false;
			    	distance_select.disabled = false;
			    	step_select.disabled = false;
				    dfValue_select.disabled =  false;
					var ds = DataSource.getInstancesByName( sv )[0];
					
					maxValue_select.options.length = 0;
					minValue_select.options.length = 0;
					distance_select.options.length = 0;
					step_select.options.length = 0;
					dfValue_select.options.length = 0;
					
					_.map( ds.param.outputColumns, function( oc ) {
						maxValue_select.options.add( new Option( oc.alias, oc.alias ) );
						minValue_select.options.add( new Option( oc.alias, oc.alias ) );
						distance_select.options.add( new Option( oc.alias, oc.alias ) );
						step_select.options.add( new Option( oc.alias, oc.alias ) );
						dfValue_select.options.add( new Option( oc.alias, oc.alias ) );
					} );
				} else {
					maxValue_select.disabled = true;
					minValue_select.disabled = true;
					distance_select.disabled = true;
					step_select.disabled = true;
					dfValue_select.disabled = true;
					
					maxValue_select.options.length = 0;
					minValue_select.options.length = 0;
					distance_select.options.length = 0;
					step_select.options.length = 0;
					dfValue_select.options.length = 0;
				}
			} );
			dialog.addButton( "确定", function() {
				var dsName = chooseDS.options[chooseDS.selectedIndex].value;	
				_this.hintText = _.trim( hintText.value ); 
				if(objectName.value==""){
					alert( "对象名不能为空" );
					return;
				}
				var testObjectName = _.trim( objectName.value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.ds = dsName;
				_this.width=width.value;
				_this.valign=valign.value;
				var tempID = Math.sin( +new Date );
				var ds=null;
				
				var temp_maxValue,temp_minValue,temp_distance,temp_step,temp_dfValue,match=/^(\-|\+)?[0-9]+(\.[0-9]+){0,1}$/;
				if(chooseDS.selectedIndex==0)
				{            
				            //最大值		
							temp_maxValue=parseFloat(maxValue_input.value);	
							if(temp_maxValue.value==""){
								alert("最大值不能为空!");
								return;
							}else if(!match.test(temp_maxValue)){
								alert("最大值必须为数字类型!");
								return;
							}							
							//最小值
						   temp_minValue=parseFloat(minValue_input.value);
							if(temp_minValue.value==""){
								alert("最小值不能为空!");
								return;
							}else if(!match.test(temp_minValue)){
								alert("最小值必须为数字类型!");
								return;
							}
							//刻度间隔值						
							temp_distance=parseFloat(distance_input.value);
							if(temp_distance.value==""){
								alert("刻度间隔值不能为空!");
								return;
							}else if(!match.test(temp_distance)|| temp_distance<=0){
								alert("刻度间隔值必须为大于0数字类型!");
								return;
							}
							//步长值						
							temp_step=parseFloat(step_input.value);							
							if(temp_step.value==""){
								alert("步长不能为空!");
								return;
							}else if(!match.test(temp_step) || temp_step<=0){
								alert("步长必须为大于0的数字类型!");
								return;
							}
							//默认值							
							temp_dfValue=parseFloat(dfValue_input.value);
							
							if(temp_dfValue.value==""){
								alert("默认值不能为空!");
								return;
							}else if(!match.test(temp_dfValue)){
								alert("默认值必须为数字类型!");
								return;
							}
							///////////////////////////////////////////
							
							if(temp_maxValue<=temp_minValue){
								alert("最大值必须大于最小值");
								return;
							}							
							if((temp_maxValue*1000-temp_minValue*1000)%(temp_distance*1000)!=0){
								alert("刻度间隔值必须能被最大值最小值之差整除!");
								return;
							}						
							if((temp_distance*1000)%(temp_step*1000)!=0){
								alert("步长值必须能被刻度间隔值整除!");
								return;
							}
							if(temp_dfValue<temp_minValue || temp_dfValue>temp_maxValue){
								alert("默认值必须基于最小值和最大值之间!");
								return;
							}	
							
							if(parseFloat(_this.width)<20*((temp_maxValue-temp_minValue)/temp_distance)){
							   alert("长度不能小于"+20*((temp_maxValue-temp_minValue)/temp_distance));
							   return;
							}
							_this.maxValue_select=(maxValue_select.selectedIndex==-1)?"":maxValue_select.options[maxValue_select.selectedIndex].value;	
							_this.minValue_select=(minValue_select.selectedIndex==-1)?"":minValue_select.options[minValue_select.selectedIndex].value;
							_this.distance_select = (distance_select.selectedIndex==-1)?"":distance_select.options[distance_select.selectedIndex].value;
							_this.step_select = (step_select.selectedIndex==-1)?"":step_select.options[step_select.selectedIndex].value;
							_this.dfValue_select = (dfValue_select.selectedIndex==-1)?"":dfValue_select.options[dfValue_select.selectedIndex].value;		
							
							_this.maxValue_input=maxValue_input.value;			
							_this.minValue_input=minValue_input.value;			 			
							_this.distance_input = distance_input.value;
			        		_this.dfValue_input = dfValue_input.value;
			        		_this.step_input = step_input.value;
							_this.unit_input = unit_input.value;
							_this.name = _.trim( objectName.value );

							handleDialInSubScriptEngine( oldName, _this.name, _this );
							dialog.destroy();
				}else
				{			
				ds= DataSource.getInstancesByName(chooseDS.options[chooseDS.selectedIndex].value)[0];
				_.post( {
					url: webUtilServlet,
					beforeStart: _.Z,
					json: [
						"1,2",
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "createTempDataSource",
							id: tempID,
							datacenter: ds.param.datacenter,
							content: ds.param.content,
							maxRowCount: ds.param.maxRowCount,
						    outputColumns: _.map(ds.param.outputColumns, function( oc ) {
									return oc.column + "," + oc.alias;
								} )
						},
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "getSliderDate",
							id: tempID,
							outputColumns: _.map(ds.param.outputColumns, function( oc ) {
									return oc.column + "," + oc.alias;
								} )
						}
					],
					callback: function( r ) {
						    var data= eval( r[2].data );	
							//最大值
							if(maxValue_input.value.length==0)
							{   
								var value=getDataValue(maxValue_select,data)
								temp_maxValue=(maxValue_select.selectedIndex==-1)?"":value;
							}else{
								temp_maxValue=parseFloat(maxValue_input.value);
							}
	                      
							if(maxValue_select.selectedIndex==-1 && maxValue_input.value==""){
								alert("最大值不能为空!");
								return;
							}else if(!match.test(temp_maxValue)){
								alert("最大值必须为数字类型!");
								return;
							}
							
							//最小值
							if(minValue_input.value.length==0)
							{
								var value=getDataValue(minValue_select,data)
								temp_minValue=(minValue_select.selectedIndex==-1)?"":value;
							}else{
								temp_minValue=parseFloat(minValue_input.value);
							}
							if(temp_minValue.selectedIndex==-1 && minValue_input.value==""){
								alert("最小值不能为空!");
								return;
							}else if(!match.test(temp_minValue)){
								alert("最小值必须为数字类型!");
								return;
							}
							//刻度间隔值
							if(distance_input.value.length==0)
							{
								var value=getDataValue(distance_select,data)
								temp_distance=(distance_select.selectedIndex==-1)?"":value;
							}else{
								temp_distance=parseFloat(distance_input.value);
							}
							if(temp_distance.selectedIndex==-1 && distance_input.value==""){
								alert("刻度间隔值不能为空!");
								return;
							}else if(!match.test(temp_distance)){
								alert("刻度间隔值必须为数字类型!");
								return;
							}
							//步长值
							if(step_input.value.length==0)
							{
								var value=getDataValue(step_select,data)
								temp_step=(step_select.selectedIndex==-1)?"":value;
							}else{
								temp_step=parseFloat(step_input.value);
							}
							
							if(temp_step.selectedIndex==-1 && step_input.value==""){
								alert("步长不能为空!");
								return;
							}else if(!match.test(temp_step) || temp_step<=0){
								alert("步长必须为大于0的数字类型!");
								return;
							}
							//默认值
							if(dfValue_input.value.length==0)
							{
								var value=getDataValue(dfValue_select,data)
								temp_dfValue=(dfValue_select.selectedIndex==-1)?"":value;
							}else{
								temp_dfValue=parseFloat(dfValue_input.value);
							}
							if(temp_dfValue.selectedIndex==-1 && dfValue_input.value==""){
								alert("默认值不能为空!");
								return;
							}else if(!match.test(temp_dfValue)){
								alert("默认值必须为数字类型!");
								return;
							}
							///////////////////////////////////////////
							if(temp_maxValue<=temp_minValue){
								alert("最大值必须大于最小值");
								return;
							}
							
							if((temp_maxValue*1000-temp_minValue*1000)%(temp_distance*1000)!=0){
								alert("刻度间隔值必须能被最大值最小值之差整除!");
								return;
							}
							
							if((temp_distance*1000)%(temp_step*1000)!=0){
								alert("步长值必须能被刻度间隔值整除!");
								return;
							}
							if(temp_dfValue<temp_minValue || temp_dfValue>temp_maxValue){
								alert("默认值必须基于最小值和最大值之间!");
								return;
							}
							if(parseFloat(_this.width)<20*((temp_maxValue-temp_minValue)/temp_distance)){
							   alert("长度不能小于"+20*((temp_maxValue-temp_minValue)/temp_distance));
							   return;
							}
							_this.maxValue_select=(maxValue_select.selectedIndex==-1)?"":maxValue_select.options[maxValue_select.selectedIndex].value;	
							_this.minValue_select=(minValue_select.selectedIndex==-1)?"":minValue_select.options[minValue_select.selectedIndex].value;
							_this.distance_select = (distance_select.selectedIndex==-1)?"":distance_select.options[distance_select.selectedIndex].value;
							_this.step_select = (step_select.selectedIndex==-1)?"":step_select.options[step_select.selectedIndex].value;
							_this.dfValue_select = (dfValue_select.selectedIndex==-1)?"":dfValue_select.options[dfValue_select.selectedIndex].value;		
							
							_this.maxValue_input=maxValue_input.value;			
							_this.minValue_input=minValue_input.value;			 			
							_this.distance_input = distance_input.value;
			        		_this.dfValue_input = dfValue_input.value;
			        		_this.step_input = step_input.value;
							_this.unit_input = unit_input.value;
							_this.name = _.trim( objectName.value );

							handleDialInSubScriptEngine( oldName, _this.name, _this );
							dialog.destroy();
					}
			    })
				}
				
			} );
			dialog.addButton( "取消", function() {
				//resetOdiv(_this,"滑动条");
				dialog.destroy();
			} );
		}
		
		try {
			objectName.focus();
		} catch( e ) {
		}
		function getDataValue(select,data){
			var selectValue=select.options[select.selectedIndex].value;
			for(var i=0;i<data[0].length;i++){
				var output=data[0][i];
				if(selectValue==output){
					return parseFloat(data[1][i]);
				}
			}
			return "";
		}
		function resetOdiv(_this,type)
		{
			_this.oDiv.innerHTML="";
			var text,color;
			if(_this.ds!=null){
				text=	"组件:"+type+",已绑定数据源"+_this.ds;
				color="#000";
			}else{  
				text=	"组件:"+type+",未绑定数据源"
				color="#F00";
			}
			_.table( _.format( "{[!vertical-align:middle;color:%s~%s]}!width:100%;height:100%;font-size:12px", color, text ), _this.oDiv );
	    }
		function sue( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
	},
	
	fromXml: function( oDom ) {
		this.commonFromXml(oDom);
		var type = oDom.getAttribute( "type" );
		if ( type == "input" ) {
			this.type = null;
		} else {
			if ( type == "select" ) {
				this.type = type;
				this.ds = oDom.getAttribute( "ds" );
				this.captionColumn = oDom.getAttribute( "captionColumn" );
				this.valueColumn = oDom.getAttribute( "valueColumn" );
			} else if ( type == "button" ) {
				this.type = type;
			}else if(type == "checkbox"){
				this.type = type;
				if(oDom.getAttribute( "isChecked" )=="true"){
						this.isChecked="checked";
				}
			}else if(type == "radiobox"){
				this.type = type;
				this.ds = oDom.getAttribute( "ds" );
				this.captionColumn = oDom.getAttribute( "captionColumn" );
				this.valueColumn = oDom.getAttribute( "valueColumn" );
			}else if(type == "slider"){
				this.type = type;
				this.valign = oDom.getAttribute( "valign" );
				this.ds = oDom.getAttribute( "ds" );
				
				this.maxValue_select = oDom.getAttribute( "maxValue_select" );
				this.maxValue_input = oDom.getAttribute( "maxValue_input" );
				
				this.minValue_select = oDom.getAttribute( "minValue_select" );
				this.minValue_input = oDom.getAttribute( "minValue_input" );
				
				this.distance_select = oDom.getAttribute( "distance_select" );
				this.distance_input = oDom.getAttribute( "distance_input" );
				
				this.step_select = oDom.getAttribute( "step_select" );
				this.step_input = oDom.getAttribute( "step_input" );
				
				this.dfValue_select = oDom.getAttribute( "dfValue_select" );
				this.dfValue_input = oDom.getAttribute( "dfValue_input" );
				
				this.unit_input = oDom.getAttribute( "unit_input" );
			}
			this.width = oDom.getAttribute("width");
			if(this.width==null)
				this.width = "";
			this.hintText = oDom.getAttribute( "hintText" );
			var script = getDomChildText( oDom, "Script", "" );
			this.lastScript = script;
		}
	},
	
	toXml: function() {
		if ( !this.type ) {
			return _.format( "<Cell type=\"input\"%s/>", this.commonToXml() );
		} else {
			var xml;
			if ( this.type == "select" ) {
				xml = _.format( "<Cell type=\"select\"%s ds=\"%s\" captionColumn=\"%s\" valueColumn=\"%s\" hintText=\"%s\" width=\"%s\">", this.commonToXml(), this.ds || "", this.captionColumn, this.valueColumn, this.hintText, this.width );
			} else if ( this.type == "button" ) {
				xml = _.format( "<Cell type=\"button\"%s hintText=\"%s\" width=\"%s\">", this.commonToXml(), this.hintText ,this.width);
			}else if(this.type == "checkbox"){
				xml = _.format( "<Cell type=\"checkbox\"%s hintText=\"%s\" isChecked=\"%s\">", this.commonToXml(), this.hintText ,this.isChecked);
			}else if(this.type == "radiobox"){
				xml = _.format( "<Cell type=\"radiobox\"%s hintText=\"%s\"  ds=\"%s\" captionColumn=\"%s\" valueColumn=\"%s\" >", this.commonToXml(),this.hintText,this.ds || "", this.captionColumn, this.valueColumn);
			}else if(this.type == "slider"){
				xml = _.format( "<Cell type=\"slider\"%s hintText=\"%s\" width=\"%s\" valign=\"%s\"   ds=\"%s\" " +
						" maxValue_select=\"%s\" maxValue_input=\"%s\"  minValue_select=\"%s\"  " +
						" minValue_input=\"%s\"  distance_select=\"%s\" distance_input=\"%s\" step_select=\"%s\" step_input=\"%s\"  " +
						" dfValue_select=\"%s\" dfValue_input=\"%s\"  unit_input=\"%s\" > ", this.commonToXml(),this.hintText,this.width,this.valign,this.ds || "",
						 this.maxValue_select, this.maxValue_input, this.minValue_select, this.minValue_input, 
						 this.distance_select, this.distance_input,this.step_select, this.step_input, this.dfValue_select ,this.dfValue_input,this.unit_input);			
			}
			var script = SubScriptEngine.Runtime.ScriptManager.getScript( this.iid );
			if ( script ) {
				xml += "<Script><![CDATA[" + script + "]]></Script>";
			}
			xml += "</Cell>";
			return xml;
		}
	}
} );

var split1="@/";
var split2="@//";
var split3="@///";
var md_array=new Array();//主维度
var itemslist_bak=new Array();
function KPI_Item(){
	this.ItemName="";
	this.kpiLabel="";
	this.displayType="";
	this.chartType="";
	
	this.pointValue="";
	this.minValue="";
	this.warmningValue="";
	this.goodValue="";
	this.maxValue="";
}
function Cell_KPI() {
	AbstractCell.call(this, "kpi", _oModel.distributeUid("kpi"));
	this.ds = null;
	this.maindimension ="";//主维度
	this.kpipv="";//kpi项目
	this.kpidv="";//kpiItem
	this.intemsInfo="";//items信息
	this.itemslist_temp=new Array();//临时保存的数组
}

_.extend( Cell_KPI.prototype = new AbstractCell(), {

	updateUI: function( div ) {
		var text;
		var sInnerHtml = '<table style="width:100%; height:100%; border:0;" cellSpacing="0" cellPadding="0">';
		if(this.bShowTitle)
		{
			sInnerHtml += '<tr height="26"><td class="cellTitle">' + ( this.sTitle || "" ) + '</td></tr>'
		}
		sInnerHtml += '<tr><td sue="containerTD" style="font-size:9pt; color:#000"></td></tr></table>';
		div.innerHTML = sInnerHtml;
		
		if ( this.ds ) {
			text = "~KPI图表：已绑定数据源" + this.ds.param.name;
		} else {
			text = ";color:#F00~请选择要绑定的数据源";
		}
		var table = _.table( _.format( "{[!vertical-align:middle;font-size:12px%s]}!height:100%", text ), _.select( div, "sue", 1, "containerTD" ) );
	},
	
	isMustBindResource: _.K( true ),
	
	bindResource: __bindResource,
	
	isAutoSetProperty: true,

	propertySetting: function() {

		var _this = this;
		
		if ( !this.ds ) {
			this.bindResource();
			return;
		}
		
		var dialog = Sue.ui.ext.dialog( {
			caption: "KPI图表属性设置",
			width: 800,
			height: 500,
			closeAction: "close"
		} );
		dialog.content.style.padding = "10px";
		dialog.setContent( _.loadUIT( "bi_dialog_dashboard_kpi_properties" ) );
		
		var table = sue("config_table");
		var title = sue( "title" );
		sue( "isShowTitle" ).checked = !!this.bShowTitle;
		title.value = this.sTitle || "";
		var oldName =sue( "objectName" ).value = this.name;
		var kpi_maindim=sue("kpi_maindim");//主维度
		var kpi_project=sue( "kpi_project" );//KPI工程
		var kpi_item=sue( "kpi_item" );//KPI项目
		var kpi_label=sue( "kpi_label" );//标注
		var select_displayType=sue( "select_displayType" );//展示方式
		var select_chartType = sue( "select_chartType" );//图形类型
		var btn_addAllItems=sue("btn_addAllItems");//添加所有按钮
		var kpi_selected_items=sue("kpi_selected_items");//已选kpi项目
	
		var chartDiv = sue( "preview" );//预览按钮
		var btn_addItem=sue("btn_addItem");//添加按钮
     	var btn_del_Project=sue("btn_del_Project");//删除
		var btn_delAllProject=sue("btn_delAllProject");//删除所有
		var btn_moveUP=sue("btn_moveUP");//上移
		var btn_moveDown=sue("btn_moveDown");//下移

		var data = _.map( this.ds.param.outputColumns, function( oc ) {
			return [ oc.alias,oc.type, oc.type, oc.type,oc.type,oc.type,oc.type ];
		} );
		// 度量有效的数值类型
		var numberType = {
			"byte": 1,
			"short": 1,
			"int": 1,
			"float": 1,
			"double": 1,
			bigint: 1,
			smallint: 1,
			tinyint: 1,
			numeric: 1,
			number: 1,
			decimal: 1,
			real: 1,
			money: 1,
			smallmoney: 1,
			integer:1
		};
		
		_.bindEvent( kpi_label, "onchange", function() { 
			     onChangeListenner("kpi_label");
			} ); 
			
		_.bindEvent( select_displayType, "onchange", function() { 
			     onChangeListenner("displayType");
			     setColDisplay();
			} ); 
		
		_.bindEvent( select_chartType, "onchange", function() { 
			     onChangeListenner("chartType");
			     setColDisplay();
			} ); 
				
		_.bindEvent( kpi_maindim, "onchange", function() { 
			chartDiv.innerHTML="";
			delAllProject();
			setRowsDisplay();
			} ); 
			
		_.bindEvent( kpi_project, "onchange", function() {
			
				delAllProject();
				onKPIChange("1"); 
				
			} );  
		
	    _.bindEvent( select_chartType, "onchange", function() { 
	    	changeTypeHook(select_chartType); 
	    	} );     
	    
	    _.bindEvent( btn_addItem, "click", function() { 
	    	 addParoject(); 
	    	} ); 
	    	
	     _.bindEvent( btn_addAllItems, "click", function() { 
	    	 addAllParoject(); 
	    	} ); 	
	    
	     _.bindEvent( btn_del_Project, "click", function() { 
	    	 delProject(); 
	    	} ); 
	    	
	    	
	     _.bindEvent( btn_delAllProject, "click", function() { 
	    	 delAllProject(); 
	    	} ); 
	    	
	     _.bindEvent( btn_moveUP, "click", function() { 
	    	 moveUP(); 
	    	} );	
	    	
	     _.bindEvent( btn_moveDown, "click", function() { 
	    	 moveDown(); 
	    	} );
	    	
	    _.bindEvent( kpi_selected_items, "click", function() { 
	    	  if(kpi_selected_items.selectedIndex!=-1){
	    	  	 onSelectedKPIProject();
	    	  }
	    	} );

		var rows=data.length;
		kpi_project.add( new Option( "请选择...", "" ) );
		kpi_maindim.add( new Option( "请选择...", "" ) );
		for(var i=0;i<rows;i++){
		   var newPtion = document.createElement("option");
		   kpi_project.add( new Option( data[i][0], data[i][0] ) );
		   kpi_maindim.add( new Option( data[i][0], data[i][0] ) );
		}
		if(this.maindimension!=""){
			kpi_maindim.value=this.maindimension;//主维度
		}
		if(this.kpipv!=""){
			kpi_project.value=this.maindimension;
		}

		buildTable();//构造table
		onKPIChange("0");//初始化下拉框
		onInitChartType();//初始化图形类型
		
		//显示隐藏的控件（隐藏这些控件主要是显示时不够美观，等加载完了再显示）
		kpi_selected_items.style.visibility="visible";
		select_displayType.style.visibility="visible";
		select_chartType.style.visibility="visible";
		
		dialog.addButton( "预览", function() {	
			preview();
		})
		dialog.addButton( "确定", function() {
			 if(validateKPI())
			 {
				_this.kpipv=kpi_project.value;
				_this.kpidv=kpi_item.value;
				_this.maindimension = kpi_maindim.value;
				_this.intemsInfo=buildItemsInfo();
				_this.bShowTitle = !!sue( "isShowTitle" ).checked;
				_this.sTitle = sue( "title" ).value;
				
				var testObjectName = _.trim( sue( "objectName" ).value );
				testObjectName = testValidObjectName( testObjectName );
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				_this.name = _.trim( sue( "objectName" ).value );
				
				_this.commonUpdateUI();
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialog.destroy();
			}
		} );
		dialog.addButton( "取消", function() {
			_this.itemslist_temp=new Array();
			for(var i=0;i<itemslist_bak.length;i++){
		     var item_bak=itemslist_bak[i];
			 var item=new KPI_Item();//新建一个Item对象						   	
			 item.ItemName=item_bak.ItemName;			   		
             item.kpiLabel=item_bak.kpiLabel;
             item.displayType=item_bak.displayType;
	         item.chartType=item_bak.chartType;
			 item.pointValue=item_bak.pointValue;
			 item.minValue=item_bak.minValue;
			 item.warmningValue=item_bak.warmningValue;
			 item.goodValue=item_bak.goodValue;
			 item.maxValue=item_bak.maxValue;
			 _this.itemslist_temp.push(item);
			}
			dialog.destroy();
		} );
		bi.updateToPortalStyleButton( dialog.content );
		
		try {
			title.focus();
		} catch( e ) {
		}
		
		//预览
		var rs;
		function preview() {
		  if(validateKPI())
		    {   
		    	
		    	var maindimension=kpi_maindim.value;
		    	var kpipv=kpi_project.value;
		    	var intemsInfo=buildItemsInfo();
				var tempID = Math.sin( +new Date );
				_.post( {
					url: webUtilServlet,
					json: [
						"1,2",
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "createTempDataSource",
							id: tempID,
							datacenter: _this.ds.param.datacenter,
							content: _this.ds.param.content,
							maxRowCount: _this.ds.param.maxRowCount,
							outputColumns: _.map( _this.ds.param.outputColumns, function( oc ) {
								return oc.column + "," + oc.alias;
							} )
						},
						{
							servletType: bi_tree_util.ServletType_BIWebUtil,
							action: "getPreviewKPI",
							id: tempID,
							width: parseInt( chartDiv.style.width ),
							height: parseInt( chartDiv.style.height ),
							maindimensionv: maindimension,
							kpiprojectv:kpipv,
							intemsInfov: intemsInfo
						}
					],
					callback: function( r ) {
						    chartDiv.innerHTML="";
							rs=r[2];
							var options="";
							var objectsrc="";
							var error=false;
							var massage="";
							md_array=new Array();
							if(rs.error==null || rs.error=="undefined")
							{//构造关联下拉框
								var items=rs.split(split3);
								for(var i=0;i<items.length;i++)
								{
									 var item=items[i].split(split2);
									 for(var z=0;z<item.length;z++){
									   var itemValue=(item[z].split(split1));
									   addToArray(itemValue[0]);
                                       if(itemValue[0]==md_array[0])
									    {//以第一条记录作为初始显示图形
									      var temp=itemValue[1].split(",");
											  if(itemValue[2]=="ok")
											     {//如果取回的参数合法，则填充图形
											          var displayType=itemValue[6];
											          var chartType=itemValue[7];
											          var KPIHL=itemValue[8]
											          if(itemValue[5]=="undefind"){
											          		itemValue[5]="";
											          	}
											          if(displayType=="KPI"){	
														          	
													    objectsrc=objectsrc+"<td align=\"center\"><object valign='left' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0' width='200px' height='150px'>";
															objectsrc+="<param name=\"movie\" value=\"bi_kpi_ybp.swf?";
															objectsrc+="Unit="+itemValue[5].replace(/\%/g,"%25");
															objectsrc+="&bgcolor=0xffffff&menuType=0&numValue="+temp[3]+"&title="+itemValue[4];
															objectsrc+="&numMin="+temp[0]+"&numMax="+temp[4]+"&numAlerm="+temp[2]+"&numDanger="+temp[1]+itemValue[3]+"\">";
															objectsrc+="<param name='quality' value='High'></object></td>";	
														}else{
														var color=getHLD(i,temp,chartType,KPIHL);
														var toolTip=getToolTip(chartType,temp[3],temp[0],temp[1],temp[2],temp[4]);
														objectsrc=objectsrc+'<td align="center"><object valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="200px" height="150px">';
														objectsrc+='<param name="movie" value="bi_kpi_hld.swf?xmlInfo=<root><color>'+color+'</color><bgcolor>0xffffff</bgcolor><label>'+itemValue[5].replace(/\%/g,"%25")+'</label><menuType>0</menuType><name>'+itemValue[4]+'</name><tooltip>'+toolTip+'</tooltip></root>"';
														objectsrc+='<param name="quality" value="High"></object></br></td>';																
														}
												}else
												{
												       objectsrc=objectsrc+"<td align=\"center\" style=\"WIDTH:300px\"><font color=\"#FF0000\">"+itemValue[3]+"</font></br></br>"+itemValue[4]+"</td>";	
												}
									   }
									 }
									
								 }	
							 }
							 
							  chartDiv.innerHTML = "<TABLE style=\"font:12px;width:"+items.length*200+"px;height:200px\">"+objectsrc+"</TABLE>";  
							  //执行主维度修改
							  var select = _.crt( "select", null, chartDiv, "font-size:12px" );
								for(var z=0;z<md_array.length;z++)
								{
									select.add( new Option( md_array[z],md_array[z] ) );
								}	
							    
								_.bindEvent( select, "onchange",function(){
								  onMainDimensionChange(select.selectedIndex);
								});
							 

					}
				} );
		}
	}
	   //将主维度添加到数组
	   function addToArray(value){
	   	var exist=false;
	   	for(var i=0;i<md_array.length;i++){
	   		var temp=md_array[i];
	   		if(value==temp){
	   			exist=true;
	   		}
	   	}
	   	if(!exist){
	   		md_array.push(value);
	   	}
	   }
	   function getToolTip(chartType,point,min,Danger,Alerm,Max){
	   	if(chartType=="KPIL"){
	   		return "br指针值:"+point+"br预警值:"+Danger+"br良好值:"+Alerm;
	   	}else if(chartType=="KPIH"){
	   		return "br指针值:"+point+"br良好值:"+Danger+"br预警值:"+Alerm;
	   	}else if(chartType=="KPILH"){
	   		return "指针值:"+point+"br预警下限:"+min+"br关注下限:"+Danger+"br关注上限:"+Alerm+"br预警上限:"+Max;
	   	}
	   }
	   //根据图形类型判断红绿灯
	    function getHLD(i,temp,chartType,KPIHL){
	    	var chartType=chartType
	    	var pointValue=parseFloat(temp[3]);
	    	var v0=parseFloat(temp[0]);
	    	var v1=parseFloat(temp[1]);
	    	var v2=parseFloat(temp[2]);
	    	var v3=parseFloat(temp[4]);

	    	if(chartType=="KPIL"){
	    		if(pointValue<=v1){
	    			return "red";
	    		}else if(pointValue>v1 && pointValue<v2){
	    			return "orange";
	    		}else if(pointValue>=v2){
	    			return "green";
	    		}
	    	}else if(chartType=="KPIH"){
	    		if(pointValue<=v1){
	    			return "green";
	    		}else if(pointValue>v1 && pointValue<v2){
	    			return "orange";
	    		}else if(pointValue>=v2){
	    			return "red";
	    		}
	    	}else if(chartType=="KPILH"){
	    		//如果kpi的实际值小于中间值. 则应该是使用下限的参数来处理,否则使用上限
	    	if(KPIHL=="KPIL")
	    		{
	    		  if(pointValue<=v1)
	    			{
	    			   return "green";
	    		    }else if(pointValue>v1 && pointValue<v2)
	    		    {
	    			   return "orange";
	    		    }else if(pointValue>=v2)
	    		    {
	    			return "red";
	    		    }
	    	   }else 
	    	   	{
	       		  if(pointValue<=v1)
	    		   {
	    			  return "red";
	    		   }else if(pointValue>v1 && pointValue<v2)
	    		   {
	    			  return "orange";
	    		   }else if(pointValue>=v2)
	    		   {
	    			  return "green";
	    		   }
	    	 }
	    	}
	    }
		//验证合法性
		function validateKPI(){
			if(_this.itemslist_temp.length>0)
			{
				for(var i=0;i<_this.itemslist_temp.length;i++){
					var item=_this.itemslist_temp[i];
					var ItemName=item.ItemName;
					var displayType=item.displayType;
					var chartType=item.chartType;
					var pointValue=item.pointValue;
					var minValue=item.minValue;
					var warmningValue=item.warmningValue;
					var goodValue=item.goodValue;
					var maxValue=item.maxValue;
					if(displayType=="")
					   {
							alert("KPI项目["+ItemName+"]展示方式不能为空！");
							return false;
					   }
					if(chartType=="")
						{
							alert("KPI项目["+ItemName+"]图形类型不能为空！");
							return false;
						}
					if(pointValue=="")
						{
							alert("KPI项目["+ItemName+"]指针指不能为空！");
							return false;
						}
					if(chartType=="KPIL"){	
							
						if(warmningValue==""){
							alert("KPI项目["+ItemName+"]预警值不能为空！");
							return false;
						}	
						if(goodValue==""){
							alert("KPI项目["+ItemName+"]良好值不能为空！");
							return false;
						}		
						if((minValue!="" && maxValue=="")||(minValue=="" && maxValue!="")){
							alert("KPI项目["+ItemName+"]最小值、最大值必须同时勾选或不选！");
							return false;
						}
					}else if(chartType=="KPIH"){
						if(warmningValue==""){
							alert("KPI项目["+ItemName+"]良好值不能为空！");
							return false;
						}
						if(goodValue==""){
							alert("KPI项目["+ItemName+"]预警值不能为空！");
							return false;
						}
						
						if((minValue!="" && maxValue=="")||(minValue=="" && maxValue!="")){
							alert("KPI项目["+ItemName+"]最小值、最大值必须同时勾选或不选！");
							return false;
						}
					}else if(chartType=="KPILH"){
						if(minValue==""){
							alert("KPI项目["+ItemName+"]预警下限不能为空！");
							return false;
						}
						if(warmningValue==""){
							alert("KPI项目["+ItemName+"]关注下限不能为空！");
							return false;
						}
						if(goodValue==""){
							alert("KPI项目["+ItemName+"]关注上限不能为空！");
							return false;
						}
						if(maxValue==""){
							alert("KPI项目["+ItemName+"]预警上限不能为空！");
							return false;
						}
					}
					
				}	
				return true;
		    }else
		    {
		  	    alert("未添加任何KPI项目！");
				return false;
		    }
		}
		//构造item信息
		function buildItemsInfo(){
			var intemsInfo="";
			var temp="undefind";
			for(var i=0;i<_this.itemslist_temp.length;i++){
				var item=_this.itemslist_temp[i];
				
				var itemName=item.ItemName;
				var itemLable=item.kpiLabel;
				var dispalyType=item.displayType;
				var chartType=item.chartType;
				
				var pointValue=item.pointValue;
				var minValue=item.minValue;
				var warmningValue=item.warmningValue;
				var goodValue=item.goodValue;
				var maxValue=item.maxValue;
				
				if(itemLable==""){
					itemLable=temp;
				}
				if(pointValue==""){
					pointValue=temp;
				}
				if(minValue==""){
					minValue=temp;
				}
				if(warmningValue==""){
					warmningValue=temp;
				}
				if(goodValue==""){
					goodValue=temp;
				}
				if(maxValue==""){
					maxValue=temp;
				}
				intemsInfo=intemsInfo+itemName+split1+itemLable+split1+dispalyType+split1+chartType+
				split1+pointValue+split1+minValue+split1+warmningValue+split1+goodValue+split1+maxValue+split2;
			}
			intemsInfo=intemsInfo.substr(0,intemsInfo.length-split2.length);
			return intemsInfo;
		}
		//构造item配置表
		function buildTable(){
			for(var i=0;i<data.length;i++){//行
				var newRow = table.insertRow(); //创建新行
				newRow.align="center";
			    var newCell0 = newRow.insertCell();
			    newCell0.innerText=data[i][0];
			    for(var y=1;y<6;y++){
			    	var newCell=newRow.insertCell();//列
			    	if(data[i][y].toLowerCase() in numberType ){
			    		newCell.innerHTML="<input id=\"col_"+y+"_"+(i+1)+"\" type=\"checkbox\" />";
			    		var checkbox=document.getElementById("col_"+y+"_"+(i+1));
			    		(function(checkbox) {
						  	  _.bindEvent(checkbox, "click", function(){                                   
                                  	 onCheckBoxClick(checkbox.id);    	                                       
                                  	 onChangeListenner(checkbox.id);                                                       
							 });
						  })(checkbox);
			    		(function(cell) {
						  	  _.bindEvent(cell, "onmouseover", function(){
						  	  	     cell.style.cursor="hand";
								     cell.style.backgroundColor="#99cc00";
							 });
						  })(newCell);
						  
						(function(cell) {
						  	  _.bindEvent(cell, "onmouseout", function(){
						  	  	   cell.style.backgroundColor="";
							 });
						  })(newCell);
			    	}else{
			    		newCell.innerHTML="&nbsp;";
			    	}
			    }
			    
			}
			
			renderTable();
		}
		//设置table背景颜色
		function renderTable(){
			for(var i=1;i<table.rows.length;i++)
		      {
		         if(i%2)
		         {
		          table.rows[i].style.backgroundColor="#EAF2F8";
		         }else
		         {
		          table.rows[i].style.backgroundColor="#ffffff";
		         }
		      }
		}
		//初始化itemlist
		function updateItemslist(){
			for(var i=_this.itemslist_temp.length-1;i>=0;i--)
			{
				var exist=false;
				var item=_this.itemslist_temp[i];
			   //判断KPI是否存在下拉框中，不存在则说明数据源被修改，不再添加该条记录	
				for(var y=0;y<kpi_item.options.length;y++)
				 {
				 	var item_select=kpi_item.options[y].value;
				 	if(item.ItemName==item_select)
				 	{
				 		exist=true;
				 		break;
				 	}			
				}
				if(!exist)
				{	
					_this.itemslist_temp.splice(i,1);		
				}
			}
			for(var i=0;i<_this.itemslist_temp.length;i++)
			{
				var item=_this.itemslist_temp[i];
				kpi_selected_items.add( new Option(item.ItemName,item.ItemName) );
				kpi_selected_items.value=item.ItemName;
				onSelectedKPIProject();
				kpi_item.value=item.ItemName;
			}
		}
		//监听修改信息事件
		function onChangeListenner(obj){
			if(kpi_selected_items.selectedIndex!=-1){
				var item=_this.itemslist_temp[kpi_selected_items.selectedIndex];
				if(obj=="kpi_label"){//KPI标注
					item.kpiLabel=kpi_label.value;
				}else if(obj=="displayType"){//展示方式
					item.displayType=select_displayType.value;
				}else if(obj=="chartType"){//图形类型
					item.chartType=select_chartType.value;
				}else{//checkbox
				    var col=obj.split("_")[1];
					var row=obj.split("_")[2];
					var checkbox=document.getElementById(obj);
					if(checkbox.checked){//如果被勾选
							if(col==1){//指针指
								item.pointValue=table.rows[row].cells[0].innerText;
							}else if(col==2){//最小值
								item.minValue=table.rows[row].cells[0].innerText;
							}else if(col==3){//预警值
								item.warmningValue=table.rows[row].cells[0].innerText;
							}else if(col==4){//良好值
								item.goodValue=table.rows[row].cells[0].innerText;
							}else if(col==5){//最大值
								item.maxValue=table.rows[row].cells[0].innerText;
							}
					}else{//如果取消勾选
						resetItemValue(obj);
					}
				}
			}else{
				alert("请先选择相应的KPI项目！");
			}
		}
		//清空勾选框
		function clearCheckBox(){
			var cols=table.rows.item(0).cells.length 
			for(var i=0;i<table.rows.length;i++){
				for(var y=0;y<cols;y++){
					var checkBox=document.getElementById("col_"+y+"_"+i);
					if(checkBox!=null ){
						checkBox.checked=false;
					}
				}
			}
		}
		//选中kpi项目
		function onSelectedKPIProject(){
			clearCheckBox();
			var index=kpi_selected_items.selectedIndex;
			kpi_label.value=_this.itemslist_temp[index].kpiLabel;
			if(_this.itemslist_temp[index].displayType==""){
				 select_displayType.value="";
			}else{
				 select_displayType.value=_this.itemslist_temp[index].displayType;
			}
			if(_this.itemslist_temp[index].chartType==""){
				 select_chartType.value="";
			}else{
				 select_chartType.value=_this.itemslist_temp[index].chartType;
				 changeTypeHook(select_chartType);
			}
            var pointValue=_this.itemslist_temp[index].pointValue;
            var minValue=_this.itemslist_temp[index].minValue;
            var warmningValue=_this.itemslist_temp[index].warmningValue;
            var goodValue=_this.itemslist_temp[index].goodValue;
            var maxValue=_this.itemslist_temp[index].maxValue;
            //指针指勾选
            for(var i=0;i<table.rows.length;i++){
            	var rowName=table.rows[i].cells[0].innerText;
            	if( rowName.length>0 &&  pointValue.toLowerCase()==rowName.toLowerCase()){
            		document.getElementById("col_"+1+"_"+i).checked=true;
            	}
            }
            //最小值勾选
            for(var i=0;i<table.rows.length;i++){
            	var rowName=table.rows[i].cells[0].innerText;
            	if(rowName.length>0 && minValue.toLowerCase()==rowName.toLowerCase()){
            		document.getElementById("col_"+2+"_"+i).checked=true;
            	}
            }
            //预警值勾选
            for(var i=0;i<table.rows.length;i++){
            	var rowName=table.rows[i].cells[0].innerText;
            	if(rowName.length>0 && warmningValue.toLowerCase()==rowName.toLowerCase()){
            		document.getElementById("col_"+3+"_"+i).checked=true;
            	}
            }
            //良好值勾选
            for(var i=0;i<table.rows.length;i++){
            	var rowName=table.rows[i].cells[0].innerText;
            	if(rowName.length>0 && goodValue.toLowerCase()==rowName.toLowerCase()){
            		document.getElementById("col_"+4+"_"+i).checked=true;
            	}
            }
            //最大值勾选
            for(var i=0;i<table.rows.length;i++){
            	var rowName=table.rows[i].cells[0].innerText;
            	if(rowName.length>0 && maxValue.toLowerCase()==rowName.toLowerCase()){
            		document.getElementById("col_"+5+"_"+i).checked=true;
            	}
            }
            setColDisplay();
		}
		//删除选中项
		function delProject(){
			if(kpi_selected_items.selectedIndex!=-1){
				var index=kpi_selected_items.selectedIndex;
				_this.itemslist_temp.splice(kpi_selected_items.selectedIndex,1);
				kpi_selected_items.remove(index);
				if(index>0){
					kpi_selected_items.value=kpi_selected_items.options[index-1].value;
				    onSelectedKPIProject();
				}
				if(kpi_selected_items.options.length>0 ){
					kpi_selected_items.value=kpi_selected_items.options[0].value;
				    onSelectedKPIProject();
				}
				if(kpi_selected_items.options.length==0){
					//还原配置信息
					kpi_label.value="";
					select_displayType.value=0;
					select_chartType.value=0;
					clearCheckBox();
				}
			}else {
				alert("未选择KPI项目");
			}
		}
		//清空所有已选KPI项目
		function delAllProject(){
			for(var i=kpi_selected_items.options.length;i>0;i--){
				_this.itemslist_temp.splice(i-1,1);
				kpi_selected_items.remove(i-1);
			}
			//还原配置信息
			kpi_label.value="";
			select_displayType.value=0;
			select_chartType.value=0;
			clearCheckBox();
		}
		//上移
		function moveUP(){
			if(kpi_selected_items.selectedIndex!=-1){
				if(kpi_selected_items.selectedIndex>0){
					var preOptionText=kpi_selected_items.options[kpi_selected_items.selectedIndex-1].text;
					var preOptionValue=kpi_selected_items.options[kpi_selected_items.selectedIndex-1].value;
				    var currentOptionText=kpi_selected_items.options[kpi_selected_items.selectedIndex].text;
				    var currentOptionValue=kpi_selected_items.options[kpi_selected_items.selectedIndex].value;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex-1].text=currentOptionText;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex-1].value=currentOptionValue;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex].text=preOptionText;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex].value=preOptionValue;
			    
				    var preItem=_this.itemslist_temp[kpi_selected_items.selectedIndex-1];
				    var currentItem=_this.itemslist_temp[kpi_selected_items.selectedIndex];
				    _this.itemslist_temp[kpi_selected_items.selectedIndex-1]=currentItem;
				    _this.itemslist_temp[kpi_selected_items.selectedIndex]=preItem;
				    
				    kpi_selected_items.value=currentOptionValue;
				}
			}else {
				alert("未选择KPI项目");
			}
		}
		
		//下移
		function moveDown(){
			if(kpi_selected_items.selectedIndex!=-1){
				if(kpi_selected_items.selectedIndex+1<kpi_selected_items.options.length){
					var nextOptionText=kpi_selected_items.options[kpi_selected_items.selectedIndex+1].text;
					var nextOptionValue=kpi_selected_items.options[kpi_selected_items.selectedIndex+1].value;
				    var currentOptionText=kpi_selected_items.options[kpi_selected_items.selectedIndex].text;
				    var currentOptionValue=kpi_selected_items.options[kpi_selected_items.selectedIndex].value;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex+1].text=currentOptionText;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex+1].value=currentOptionValue;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex].text=nextOptionText;
				    kpi_selected_items.options[kpi_selected_items.selectedIndex].value=nextOptionValue;
	
			    	var nextItem=_this.itemslist_temp[kpi_selected_items.selectedIndex+1];
				    var currentItem=_this.itemslist_temp[kpi_selected_items.selectedIndex];
				    _this.itemslist_temp[kpi_selected_items.selectedIndex+1]=currentItem;
				    _this.itemslist_temp[kpi_selected_items.selectedIndex]=nextItem;
				    
				    kpi_selected_items.value=currentOptionValue;
				}
			}else {
				alert("未选择KPI项目");
			}
		}
		//添加KPI项目
		function addParoject(){
		    var exist=false;
		    if(kpi_item.selectedIndex!=-1)
		    {
				var newItem=kpi_item.options[kpi_item.selectedIndex].value;
				for(var i=0;i<kpi_selected_items.options.length;i++){
					var existValue=kpi_selected_items.options[i].value;
	                if(newItem==existValue){
	                	exist=true//已存在则不添加
	                }
					
				}
				if(!exist){
					kpi_selected_items.add( new Option( newItem, newItem ) );
					kpi_selected_items.options.value=newItem;
					addItem(newItem);
				}
			}else{
				alert("请选择KPI项目!");
			}
		}
		//添加全部KPI项目
		function addAllParoject(){	
			for(var i=0;i<kpi_item.options.length;i++)
			 {
				var exist=false;
				var newItem=kpi_item.options[i].value;
				for(var y=0;y<kpi_selected_items.length;y++)
				{
				   var existItem=kpi_selected_items.options[y].value;
				   if(newItem==existItem)
				      {
					  	exist=true;
					  }
			    }	  
	              if(!exist){
				  kpi_selected_items.add( new Option( newItem, newItem ) );
				  kpi_selected_items.options.value=newItem;
				  addItem(newItem);
			   }   
			}
		
		}
		//添加新的kpi项目
		function addItem(itemName){
			var item=new KPI_Item();
			item.ItemName=itemName;	  
			item.displayType="KPI";
			item.chartType="KPIL";
			_this.itemslist_temp.push(item);
			onSelectedKPIProject();
		}
		function onMainDimensionChange(selectindex)
		{        
			     
		         var options="";
				 var objectsrc="";
				 var error=false;
				 var massage="";
			     var index=selectindex;
				 if(rs.error==null || rs.error=="undefined")
					{//构造关联下拉框
								var items=rs.split(split3);
								for(var i=0;i<items.length;i++)
								{
									 var item=items[i].split(split2);
									 for(var z=0;z<item.length;z++){
									   var itemValue=(item[z].split(split1));
									   if(itemValue[0]==md_array[index])
									   {//以第一条记录作为初始显示图形
									      var temp=itemValue[1].split(",");
											  if(itemValue[2]=="ok")
											     {//如果取回的参数合法，则填充图形
											          var iteminfo=_this.itemslist_temp[i];
											          var chartType=itemValue[7];
											          var KPIHL=itemValue[8]
											          if(itemValue[5]=="undefind"){
											          		itemValue[5]="";
											          	}
											          if(iteminfo.displayType=="KPI"){											       
													    objectsrc=objectsrc+"<td align=\"center\"><object valign='left' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0' width='200px' height='150px'>";
															objectsrc+="<param name=\"movie\" value=\"bi_kpi_ybp.swf?";
															objectsrc+="Unit="+itemValue[5].replace(/\%/g,"%25");
															objectsrc+="&bgcolor=0xffffff&menuType=0&numValue="+temp[3]+"&title="+itemValue[4];
															objectsrc+="&numMin="+temp[0]+"&numMax="+temp[4]+"&numAlerm="+temp[2]+"&numDanger="+temp[1]+itemValue[3]+"\">";
															objectsrc+="<param name='quality' value='High'></object></td>";	
														}else{
														var color=getHLD(i,temp,chartType,KPIHL);
														var toolTip=getToolTip(chartType,temp[3],temp[0],temp[1],temp[2],temp[4]);
														objectsrc=objectsrc+'<td align="center"><object valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="250px" height="140px">';
														objectsrc+='<param name="movie" value="bi_kpi_hld.swf?xmlInfo=<root><color>'+color+'</color><bgcolor>0xffffff</bgcolor><label>'+itemValue[5].replace(/\%/g,"%25")+'</label><menuType>0</menuType><name>'+itemValue[4]+'</name><tooltip>'+toolTip+'</tooltip></root>"';
														objectsrc+='<param name="quality" value="High"></object></br></td>';
														}
												}else
												{
												       objectsrc=objectsrc+"<td align=\"center\" style=\"WIDTH:300px\"><font color=\"#FF0000\">"+itemValue[3]+"</font></br></br>"+itemValue[4]+"</td>";	
												}
									   }
									 }
									
								 }	

							 }
						
							  chartDiv.innerHTML = "<TABLE style=\"font:12px;width:"+items.length*210+"px;height:200px\">"+objectsrc+"</TABLE>";  
							  //执行主维度修改
							   var select = _.crt( "select", null, chartDiv, "font-size:12px" );
								for(var z=0;z<md_array.length;z++)
								{
									select.add( new Option( md_array[z],md_array[z] ) );
								}	
								select.options[index].selected="selected";
								_.bindEvent(select, "onchange",function(){
								   onMainDimensionChange(select.selectedIndex);
								});
							 
                               
	     }

		function onKPIChange(type){
		        var tempID = Math.sin( +new Date );
		        var project_value;
		        if(type=="0"){
		        	project_value=_this.kpipv;
		        }else {
		        	project_value=kpi_project.value;
		        }
				_.post( {
				url: webUtilServlet,
				json: [
					"1,2",
					{
						servletType: bi_tree_util.ServletType_BIWebUtil,
						action: "createTempDataSource",
						id: tempID,
						datacenter: _this.ds.param.datacenter,
						content: _this.ds.param.content,
						maxRowCount: _this.ds.param.maxRowCount,
						outputColumns: _.map( _this.ds.param.outputColumns, function( oc ) {
							return oc.column + "," + oc.alias;
						} )
					},
					{
						servletType: bi_tree_util.ServletType_BIWebUtil,
						action: "onKPIChange",
						id: tempID,
						kpi_select:project_value
					}
				],
				callback: function( r ) {
					chartDiv.innerHTML="";
					for(var i=kpi_item.options.length;i>=0;i--){
						kpi_item.remove(i);
					}			   
                    if(r[2].error==null || r[2].error=="undefined"){//构造关联下拉框
						var kpis = r[2].split(split1);	
						var size=kpis.length;
						for(var i=0;i<size;i++){
						  kpi_item.add( new Option( kpis[i], kpis[i] ) );
						}
					    if(type=="0"){
						  kpi_project.value=_this.kpipv;
						  kpi_item.value=_this.kpidv;
						}	
				   }	  
				    setRowsDisplay();
				    updateItemslist();//初始化缓存里的项目
				}
			} );
		}
			   //勾选框互斥
		function onCheckBoxClick(str_id){
			var info=str_id.split("_");
			var col=info[1];
			var row=info[2];
			var kpi_table=table
			var cols=kpi_table.rows.item(0).cells.length //列
			var rows=kpi_table.rows.length;
			var index=kpi_selected_items.selectedIndex;
			var item=_this.itemslist_temp[index];
			if(kpi_selected_items.selectedIndex!=-1){
				for(var i=0;i<cols;i++){//清空相同行勾选框
					if(i!=col){
						var checkbox=document.getElementById("col_"+i+"_"+row);
						if(checkbox!=null && checkbox.checked){
							checkbox.checked=false;
							resetItemValue("col_"+i+"_"+row);
						}
					}
				}
				for(var i=0;i<rows;i++){//清空相同列勾选框
					if(i!=row){
						var checkbox=document.getElementById("col_"+col+"_"+i);
						if(checkbox!=null && checkbox.checked){
							checkbox.checked=false;
						}
					}
				}
			}else{
				var checkbox=document.getElementById("col_"+col+"_"+row);
				checkbox.checked=false;
			}
		}
		//被勾选框修改后相应的item内容也要被修改
		function resetItemValue(obj){
			var col=obj.split("_")[1];
			var row=obj.split("_")[2];
			var index=kpi_selected_items.selectedIndex;
			var item=_this.itemslist_temp[index];
           if(col==1){
				item.pointValue="";
			}else if(col==2){
				item.minValue="";
			}else if(col==3){
				item.warmningValue="";
			}else if(col==4){
				item.goodValue="";
			}else if(col==5){
				item.maxValue="";
			}
			
		}
		//单边下限、上线时红绿灯隐藏最大最小值列
		function setColDisplay(){
		    var kpi_table=table
		    var col=kpi_table.rows.item(0).cells.length //列
		    var displayType=select_displayType.value;
		    var chartType=select_chartType.value;
		    //红绿灯单边上下限隐藏最大最小值列
		    if((displayType=="HLD" && chartType=="KPIL")||(displayType=="HLD" && chartType=="KPIH")){
		      for(var i=0;i<kpi_table.rows.length;i++){//先显示所有行		    
			    	  kpi_table.rows[i].cells[2].style.display ="none";
			    	  kpi_table.rows[i].cells[5].style.display ="none";
			  }
		    }else{//否则显示所有列
		       kpi_table.rows[0].cells[2].style.display ="block";
			   kpi_table.rows[0].cells[5].style.display ="block";
			   setRowsDisplay();
		    }
		    
		}
		//隐藏主纬度和KPI项目对应的行
		function setRowsDisplay()
		{		
			var kpi_table=table
		    var col=kpi_table.rows.item(0).cells.length //列
		    for(var i=1;i<kpi_table.rows.length;i++){//先显示所有行
		    	for(var y=0;y<col;y++){
		    	  kpi_table.rows[i].cells[y].style.display ="block";
		    	}
		    }
		    
			for(var i=1;i<kpi_table.rows.length;i++){
				//隐藏主纬度相应的行
				if(kpi_maindim.selectedIndex!=-1)
			   {
				if(kpi_table.rows[i].cells[0].innerText==kpi_maindim.options[kpi_maindim.selectedIndex].value){
					for(var y=0;y<col;y++){
						kpi_table.rows[i].cells[y].style.display ="none";
						var checkbox=document.getElementById("col_"+y+"_"+i);
						if(checkbox!=null && checkbox.checked){
		    	            checkbox.checked=false;
		    	           for(var z=0;z<_this.itemslist_temp.length;z++)
		    	           {
		    	           	   var item=_this.itemslist_temp[z];
			    	           if(item.pointValue==kpi_table.rows[i].cells[0].innerText)
			    	           {
								    item.pointValue="";
								}else if(item.minValue==kpi_table.rows[i].cells[0].innerText)
								{
									item.minValue="";
								}else if(item.warmningValue==kpi_table.rows[i].cells[0].innerText)
								{
									item.warmningValue="";
								}else if(item.goodValue==kpi_table.rows[i].cells[0].innerText)
								{
									item.goodValue="";
								}else if(item.maxValue==kpi_table.rows[i].cells[0].innerText)
								{
									item.maxValue="";
								}
		    	          }
		    	       }
					}
				}
			}
				//隐藏KPI项目相应的行
		if(kpi_project.selectedIndex!=-1)
			{
				if(kpi_table.rows[i].cells[0].innerText==kpi_project.options[kpi_project.selectedIndex].value){
					for(var x=0;x<col;x++){
                        kpi_table.rows[i].cells[x].style.display ="none";
						var checkbox=document.getElementById("col_"+x+"_"+i);
		    	        if(checkbox!=null && checkbox.checked){
		    	            checkbox.checked=false;
		    	        }
					}
				}
			}
			}
		}
		function sue( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
		function onInitChartType(){
		     var kpi_table=table;
		     if(kpi_selected_items.selectedIndex!=-1){
			     var item=_this.itemslist_temp[kpi_selected_items.selectedIndex];
				 if(item.chartType=="KPILH"){//根据图形类型不同，显示不同的字段
						 kpi_table.rows[0].cells[2].innerHTML="预警下限&nbsp;<font style=\"color:red;\">*</font>";
						 kpi_table.rows[0].cells[3].innerHTML="关注下限&nbsp;<font style=\"color:red;\">*</font>";
						 kpi_table.rows[0].cells[4].innerHTML="关注上限&nbsp;<font style=\"color:red;\">*</font>";
						 kpi_table.rows[0].cells[5].innerHTML="预警上限&nbsp;<font style=\"color:red;\">*</font>";
						 select_chartType.value="KPILH";
					}else if(item.chartType=="KPIH"){
						 kpi_table.rows[0].cells[2].innerHTML="最小值";
						 kpi_table.rows[0].cells[3].innerHTML="良好值&nbsp;<font style=\"color:red;\">*</font>";
						 kpi_table.rows[0].cells[4].innerHTML="预警值&nbsp;<font style=\"color:red;\">*</font>";
						 kpi_table.rows[0].cells[5].innerHTML="最大值";
						 select_chartType.value="KPIH";
					}else if(item.chartType=="KPIL"){
					     kpi_table.rows[0].cells[2].innerHTML="最小值";
				         kpi_table.rows[0].cells[3].innerHTML="预警值&nbsp;<font style=\"color:red;\">*</font>";
				         kpi_table.rows[0].cells[4].innerHTML="良好值&nbsp;<font style=\"color:red;\">*</font>";
				         kpi_table.rows[0].cells[5].innerHTML="最大值";
				         select_chartType.value="KPIL";
					}
			}
	
		}
		function changeTypeHook(obj) {
			var chartType = obj.options[obj.selectedIndex].value;
			var kpi_table=table;
			if(chartType=="KPILH"){//根据图形类型不同，显示不同的字段
			 kpi_table.rows[0].cells[2].innerHTML="预警下限&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[3].innerHTML="关注下限&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[4].innerHTML="关注上限&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[5].innerHTML="预警上限&nbsp;<font style=\"color:red;\">*</font>";
			}else if(chartType=="KPIH"){
			 kpi_table.rows[0].cells[2].innerHTML="最小值";
			 kpi_table.rows[0].cells[3].innerHTML="良好值&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[4].innerHTML="预警值&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[5].innerHTML="最大值";
			}else if(chartType=="KPIL"){
			 kpi_table.rows[0].cells[2].innerHTML="最小值";
			 kpi_table.rows[0].cells[3].innerHTML="预警值&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[4].innerHTML="良好值&nbsp;<font style=\"color:red;\">*</font>";
			 kpi_table.rows[0].cells[5].innerHTML="最大值";
			}
		}
		
		function extractColumn( col ) {
			return _.map( _.collect( data, function( row ) {
				return row[col];
			} ), function( row ) {
				return row[0];
			} );
		}
	},

	toXml: function() {
		if ( !this.ds ) {
			return _.format( "<Cell type=\"kpi\"%s/>", this.commonToXml() );
		} else if ( this.ds.param.saveLocation == "dashboard" ) {
			var xml= _.format( "<Cell type=\"kpi\"%s ds=\"%s\"><MainDimension><![CDATA[%s]]></MainDimension><KPIPV><![CDATA[%s]]></KPIPV><KPIDV><![CDATA[%s]]></KPIDV><ITEMSINFO><![CDATA[%s]]></ITEMSINFO></Cell>",
				this.commonToXml(),
				this.ds.param.name,
				this.maindimension,
				this.kpipv,
				this.kpidv,
				this.intemsInfo	
				 );
		   return xml;
		}
	},
	fromXml: function( oDom ) {
		this.commonFromXml(oDom);
		// TODO: 只考虑了私有的情况
		var dsName = oDom.getAttribute("ds");
		if ( dsName ) {
			var ds = DataSource.getInstancesByName( dsName );
			this.ds = ds && ds[0];
			
			if(getDomChildNode( oDom, "ITEMSINFO" )!=null)//新模式下
			{
			   this.maindimension = (_.map( getDomChildNode( oDom, "MainDimension" ).childNodes, function( maindimension ) {
					return maindimension.text;
				} ))[0];//主维度
			   this.kpipv = getDomChildNode( oDom, "KPIPV" ).text;//KPI工程
			   this.kpidv = getDomChildNode( oDom, "KPIDV" ).text;//KPIItem
			   this.intemsInfo=getDomChildNode( oDom, "ITEMSINFO" ).text;//iteminfo
			    
			   var items=this.intemsInfo.split(split2);
			   for(var i=0;i<items.length;i++)
			   {
					   	var iteminfo=items[i].split(split1);
					   	if(iteminfo!=""){
						   	var item=new KPI_Item();//新建一个Item对象	
						   	
					   		item.ItemName=iteminfo[0];
					   		if(item.ItemName==null || item.ItemName=="undefind")item.ItemName="";
					   		
					   		item.kpiLabel=iteminfo[1];
					   		if(item.kpiLabel==null || item.kpiLabel=="undefind")item.kpiLabel="";
					   		
					   		item.displayType=iteminfo[2];
					   		if(item.displayType==null || item.displayType=="undefind")item.displayType="";
					   		
					   		item.chartType=iteminfo[3];
					   		if(item.chartType==null || item.chartType=="undefind")item.chartType="";
					   		
					   		item.pointValue=iteminfo[4];
					   		if(item.pointValue==null || item.pointValue=="undefind")item.pointValue="";
					   		
					   		item.minValue=iteminfo[5];
					   		if(item.minValue==null || item.minValue=="undefind")item.minValue="";
					   		
					   		item.warmningValue=iteminfo[6];
					   		if(item.warmningValue==null || item.warmningValue=="undefind")item.warmningValue="";
					   		
					   		item.goodValue=iteminfo[7];
					   		if(item.goodValue==null || item.goodValue=="undefind")item.goodValue="";
					   		
					   		item.maxValue=iteminfo[8];
					   		if(item.maxValue==null || item.maxValue=="undefind")item.maxValue="";
	                        this.itemslist_temp.push(item);
	                        
	                        
					   		//新建一个ｉｔｅｍ备份对象
					   		var item_bak=new KPI_Item();							   	
					   		item_bak.ItemName=iteminfo[0];
					   		if(item_bak.ItemName==null || item_bak.ItemName=="undefind")item_bak.ItemName="";
					   		
					   		item_bak.kpiLabel=iteminfo[1];
					   		if(item_bak.kpiLabel==null || item_bak.kpiLabel=="undefind")item_bak.kpiLabel="";
					   		
					   		item_bak.displayType=iteminfo[2];
					   		if(item_bak.displayType==null || item_bak.displayType=="undefind")item_bak.displayType="";
					   		
					   		item_bak.chartType=iteminfo[3];
					   		if(item_bak.chartType==null || item_bak.chartType=="undefind")item_bak.chartType="";
					   		
					   		item_bak.pointValue=iteminfo[4];
					   		if(item_bak.pointValue==null || item_bak.pointValue=="undefind")item_bak.pointValue="";
					   		
					   		item_bak.minValue=iteminfo[5];
					   		if(item_bak.minValue==null || item_bak.minValue=="undefind")item_bak.minValue="";
					   		
					   		item_bak.warmningValue=iteminfo[6];
					   		if(item_bak.warmningValue==null || item_bak.warmningValue=="undefind")item_bak.warmningValue="";
					   		
					   		item_bak.goodValue=iteminfo[7];
					   		if(item_bak.goodValue==null || item_bak.goodValue=="undefind")item_bak.goodValue="";
					   		
					   		item_bak.maxValue=iteminfo[8];
					   		if(item_bak.maxValue==null || item_bak.maxValue=="undefind")item_bak.maxValue="";
						  　　
							itemslist_bak.push(item_bak);
							
					     	
				     	}
			   }
			}else{//旧模式下
			   this.maindimension = (_.map( getDomChildNode( oDom, "MainDimension" ).childNodes, function( maindimension ) {
					return maindimension.text;
				} ))[0];//主维度
			   this.kpipv = getDomChildNode( oDom, "KPIPV" ).text;//KPI工程
			   this.kpidv = getDomChildNode( oDom, "KPIDV" ).text;//KPIItem
				   
			   var item=new KPI_Item();//新建一个Item对象			   
			   item.ItemName=this.kpidv;//item名
			   item.kpiLabel=getDomChildNode( oDom, "KPILabel" ).text;//item标注
			   item.displayType="KPI";//item展示方式
			   item.chartType=getDomChildNode( oDom, "Type" ).text;//item图形类型
			  
			   var templabel=item.kpiLabel;
			   if(templabel==null || templabel=="")templabel="undefind";
			   
			   item.pointValue=(_.map( getDomChildNode( oDom, "PointV" ).childNodes, function( pointv ) {
								return pointv.text;
							   } ))[0];//item指针指
			   if(item.pointValue==null || item.pointValue=="")item.pointValue="undefind";
			  
			   item.minValue=(_.map( getDomChildNode( oDom, "MinV" ).childNodes, function(minv ) {
									return minv.text;
							   } ))[0];
	           if(item.minValue==null || item.minValue=="")item.minValue="undefind";
			   
			   item.warmningValue=(_.map( getDomChildNode( oDom, "AlertV" ).childNodes, function(alertv ) {
								    return alertv.text;
							   } ))[0];
			   if(item.warmningValue==null || item.warmningValue=="")item.warmningValue="undefind";
			   
			   item.goodValue= (_.map( getDomChildNode( oDom, "GoodV" ).childNodes, function(goodv ) {
								   return goodv.text;
							   } ))[0];
			   if(item.goodValue==null || item.goodValue=="")item.goodValue="undefind";
			  
			   item.maxValue = (_.map( getDomChildNode( oDom, "MaxV" ).childNodes, function(maxv ) {
								return maxv.text;
							} ))[0];
			   if(item.maxValue==null || item.maxValue=="")item.maxValue="undefind";

			   this.intemsInfo=item.ItemName+split1+templabel+split1+item.displayType+split1+item.chartType+
				               split1+item.pointValue+split1+item.minValue+split1+item.warmningValue+split1+item.goodValue+split1+item.maxValue;

			　  this.itemslist_temp.push(item);
			
			
			　　//新建一个Item备份对象	
			   var item_bak=new KPI_Item();		   
			   item_bak.ItemName=this.kpidv;//item名
			   item_bak.kpiLabel=getDomChildNode( oDom, "KPILabel" ).text;//item标注
			   item_bak.displayType="KPI";//item展示方式
			   item_bak.chartType=getDomChildNode( oDom, "Type" ).text;//item图形类型
			  
			   var templabel=item_bak.kpiLabel;
			   if(templabel==null || templabel=="")templabel="undefind";
			   
			   item_bak.pointValue=(_.map( getDomChildNode( oDom, "PointV" ).childNodes, function( pointv ) {
								return pointv.text;
							   } ))[0];//item指针指
			   if(item_bak.pointValue==null || item_bak.pointValue=="")item_bak.pointValue="undefind";
			  
			   item_bak.minValue=(_.map( getDomChildNode( oDom, "MinV" ).childNodes, function(minv ) {
									return minv.text;
							   } ))[0];
	           if(item_bak.minValue==null || item_bak.minValue=="")item_bak.minValue="undefind";
			   
			   item_bak.warmningValue=(_.map( getDomChildNode( oDom, "AlertV" ).childNodes, function(alertv ) {
								    return alertv.text;
							   } ))[0];
			   if(item_bak.warmningValue==null || item_bak.warmningValue=="")item_bak.warmningValue="undefind";
			   
			   item_bak.goodValue= (_.map( getDomChildNode( oDom, "GoodV" ).childNodes, function(goodv ) {
								   return goodv.text;
							   } ))[0];
			   if(item_bak.goodValue==null || item_bak.goodValue=="")item_bak.goodValue="undefind";
			  
			   item_bak.maxValue = (_.map( getDomChildNode( oDom, "MaxV" ).childNodes, function(maxv ) {
								return maxv.text;
							} ))[0];
			   if(item_bak.maxValue==null || item_bak.maxValue=="")item_bak.maxValue="undefind";
			   
			   itemslist_bak.push(item_bak); 
			}
			
		} else {
			this.ds = null;
		}
	}
} );
// 链接网页的功能
// add by laikun, 2009-5-7
function Cell_Url() {
	AbstractCell.call(this, "url", _oModel.distributeUid("url"));
	this.url = "";
}

_.extend( Cell_Url.prototype = new AbstractCell(), {
	updateUI: function( oDiv ) {
		oDiv.innerHTML = "";
		var text, color;
		if ( this.url ) {
			text = "网页：" + this.url;
			color = "#000";
		} else {
			text = "网页：未定义";
			color = "#F00";
		}
		_.table( _.format( "{[!vertical-align:middle;color:%s~%s]}!width:100%;height:100%;font-size:12px", color, text ), oDiv );
	},
	
	isMustBindResource: _.K( true ),
	
	bindResource: function() {
		this.propertySetting();
	},
	
	propertySetting: function() {
		var _this = this;
		dialog = Sue.ui.ext.dialog( {
			caption: "网页属性设定",
			width: 400,
			height: 150,
			closeAction: "close"
		} );
		dialog.content.style.verticalAlign = "top";
		dialog.setContent( _.loadUIT( "bi_dialog_dashboard_url_property" ) );
		
		var objectName = sue( "objectName" ),
			url = sue( "url" );
			
		objectName.value = this.name;
		url.value = this.url || "http://";
		
		var oldName = objectName.value = this.name;
		
		dialog.addButton( "确定", function() {
			var text = url.value;
			if ( !text ) {
				alert( "网页URL不能为空" );
				return;
			}
			if ( text == "http://" ) {
				_this.url = "";
			} else {
				_this.url = text;
			}
			var testObjectName = _.trim( objectName.value );
			testObjectName = testValidObjectName( testObjectName );
			if ( testObjectName !== true ) {
				alert( testObjectName );
				return;
			}
			_this.name = _.trim( objectName.value );
			handleDialInSubScriptEngine( oldName, _this.name, _this );
			dialog.destroy();
			_this.commonUpdateUI();
		} );
		dialog.addButton( "取消", function() {
			dialog.destroy();
		} );
		
		try {
			objectName.focus();
		} catch( e ) {
		}
		
		function sue( value ) {
			return _.select( dialog.content, "sue", 1, value );
		}
	},
	
	fromXml: function( oDom ) {
		this.commonFromXml(oDom);
		this.url = getDomChildText( oDom, "URL", "" );
	},
	
	toXml: function() {
		return _.format( "<Cell type=\"url\"%s>", this.commonToXml() ) +
			_.format( "<URL><![CDATA[%s]]></URL>", this.url ) +
			"</Cell>";
	}
} );

/**
 * EAS_KPI 对象的数据模: 嵌入在EAS中定义的当前组织的KPI
 * add by ston_zheng 2009-5-20
 */
function Cell_EASKPI() {
	AbstractCell.call( this, "easkpi", _oModel.distributeUid( "easkpi" ) );
	this.sKPI = "";			//kpi的标识ID
	this.sKPICaption = "";	//kpi在设计期的显示名称
}

Cell_EASKPI.prototype = new AbstractCell(); //方法的继承

Cell_EASKPI.prototype.updateUI = function( oDiv )
{
	oDiv.style.background = "#ffffff";

	var sTextToShow;
	var sTextColor;
	if( this.sKPI )	{
		sTextColor = "#000000";
		if( this.sKPICaption == "null" || this.sKPICaption == null || this.sKPICaption == "undefined" ){
			sTextToShow = "EAS KPI：" + this.sKPI;
		}else{
			sTextToShow = "EAS KPI：" + this.sKPICaption;
		}
	} else {
		sTextColor = "#ff0000";
		sTextToShow = "<请绑定EAS KPI>";
	}

	var sTitleToShow = ( this.sTitle ? this.sTitle : "" );

	var sInnerHtml = '<table style="width:100%; height:100%; border:0;"cellSpacing="0" cellPadding="0">';
	if( this.bShowTitle ) {
		sInnerHtml += '<tr height="26"><td class="cellTitle">' + sTitleToShow + '</td></tr>'
	}
	sInnerHtml += '<tr><td style="font-size:9pt; color:' + sTextColor + '">' + sTextToShow + '</td></tr></table>';

	oDiv.innerHTML = sInnerHtml;
}

Cell_EASKPI.prototype.toXml = function( oDesignedModel )
{
	var sXml = '<Cell type="easkpi"' + this.commonToXml() + 
		' kpicaption="' + this.sKPICaption + '">';
	if( this.sKPI ) {
		sXml += this.sKPI;
	}
	sXml += '</Cell>';
	return sXml;
}

Cell_EASKPI.prototype.fromXml = function( oDom, oStyle )
{
	this.commonFromXml( oDom );
	this.sKPI = oDom.text;
	this.sKPICaption = oDom.getAttribute( "kpicaption" );
	this.sCaption = oDom.getAttribute( "caption" );
}

Cell_EASKPI.prototype.clone = function()
{
	var newInst = new Cell_EASKPI();
	this.commonClone( newInst );
	newInst.sKPI = this.sKPI;
	newInst.sKPICaption = this.sKPICaption;
	return newInst;
}

Cell_EASKPI.prototype.propertySetting = function( f )
{
	this.bindResource( f );
}

Cell_EASKPI.prototype.mergePropertyFrom = function( oAnother )
{
	if(!(oAnother instanceof Cell_Piece)) {
		return;
	}
	
	this.commonMergePropertyFrom( oAnother );
}

Cell_EASKPI.prototype.applyProperty = function( oAnother )
{
	this.commonApplyProperty( oAnother );
	this.commonUpdateUI();
}

Cell_EASKPI.prototype.isMustBindResource = function()
{
	return true;
}

Cell_EASKPI.prototype.bindResource = function( f )
{
	//嵌入EAS的KPI  选择当前组织的一个KPI树，可支持单选
	var oParam = new Object();
	oParam.sKPI = this.sKPI;
	oParam.sKPICaption = this.sKPICaption;
	oParam.servletURL = _env.servletURL;
	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgEASKPISelector.htm",
		width: 410,
		height: 270,
		param: oParam,
		callback: function( returnValue ) {
			if ( returnValue ) {
				_this.sKPI = oParam.sKPI;
				_this.sKPICaption = oParam.sKPICaption;
				_this.commonUpdateUI();
				f && f();
			}
		}
	} );
}

/**
 * metric_Monitor 指标监控: 嵌入在企业指标建模中定义的指标监控信息
 * add by bruce_sha 2010-01-08
 */
function Cell_KPIMonitor() {
	AbstractCell.call( this, "KPIMonitor", _oModel.distributeUid( "KPIMonitor" ) );
	this.sKPIMonitor = "";			//KPIMonitor的标识ID
	this.sKPIMonitorCaption = "";	//KPIMonitor在设计期的显示名称
	this.metricWidth="";
	this.metricHeight="";
	this.metricAutoFlow="";
	
	this.sTextToShow="";
	this.sTextColor="";
	this.div=null;
}
_.extend( Cell_KPIMonitor.prototype = new AbstractCell(), {
	updateUI: function( oDiv ) {
		oDiv.style.background = "#ffffff";
		if( this.sKPIMonitor )	{
			sTextColor = "#000000";
			if( this.sKPIMonitorCaption == "null" || this.sKPIMonitorCaption == null || this.sKPIMonitorCaption == "undefined" ){
				this.sTextToShow = "Metric Monitor：" + this.sKPIMonitor;
			}else{
				this.sTextToShow = "Metric Monitor：" + this.sKPIMonitorCaption;
			}
		} else {
			this.sTextColor = "#ff0000";
			this.sTextToShow = "<请绑定Metric Monitor>";
		}
	
		var sTitleToShow = ( this.sTitle ? this.sTitle : "" );//抽象类中定义
	
		var sInnerHtml = '<table style="width:100%; height:100%; border:0;"cellSpacing="0" cellPadding="0">';
		if( this.bShowTitle ) {
			sInnerHtml += '<tr height="26"><td class="cellTitle">' + sTitleToShow + '</td></tr>'
		}
		sInnerHtml += '<tr><td id="KPIMonitor_title" style="font-size:9pt; color:' + this.sTextColor + '">' + this.sTextToShow + '</td></tr></table>';
		oDiv.innerHTML = sInnerHtml;
		this.div=oDiv;
	},
	isMustBindResource: _.K( true ),
	
	bindResource: function() {
		this.propertySetting();
	},	
	propertySetting: function() {
		var _this = this;
		if(_this.sKPIMonitor=="" || _this.sKPIMonitor==null){
			_this.showList(_this);
		}else{
			_this.showProperty(_this);		 
		}

	},
	toXml: function() {
		var sXml = '<Cell type="KPIMonitor"' + this.commonToXml();
		sXml += ' KPIMonitor="' + this.sKPIMonitor; 
		sXml += '" KPIMonitorCaption="' + this.sKPIMonitorCaption;
		sXml += '" metricWidth="' + this.metricWidth;
		sXml += '" metricHeight="' + this.metricHeight;
		sXml += '" metricAutoFlow="' + this.metricAutoFlow;
		sXml += '">';
		sXml += '</Cell>';
		return sXml;
	},
	fromXml: function( oDom ) {
		//debugger;
		this.commonFromXml(oDom);
		//this.sUri = oDom.text;
	    this.sKPIMonitor=oDom.getAttribute("KPIMonitor");
	    this.sKPIMonitorCaption=oDom.getAttribute("KPIMonitorCaption");
	    
	    this.metricWidth=oDom.getAttribute("metricWidth");
	    this.metricHeight=oDom.getAttribute("metricHeight");
	    this.metricAutoFlow=oDom.getAttribute("metricAutoFlow")=="true"?"true":"";

		//var sScale = oDom.getAttribute("scale");
	},
	showList:function(obj){
		var _this = obj;
		_.post( {
				url: webUtilServlet,
				json: {
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "getKPIMonitorList"
					//dsPath: node.dsPath
				},
				callback: function( r ) 
				{
					//alert(r);
					//debugger;
					var div = document.createElement( "div" );
					//构造树
				    tree = Sue.ui.tree( {
						parent: div,
						caption: "",
						getIcon: function( node, f ) {
						return node.expanded && f( "folderopen" )
						|| node.folder && f( "folder" )
						|| f( "report" );
						}
					} );
					//构造根节点并将该根节点与树榜定
					var Node = tree.getNodeConstructor();		
				    var rootNode = Node({
						caption: "指标监控定义",
						folder: true
			        }); 
				    tree.setRoot(rootNode);
					//  debugger; 
					//循环添加所有的指标监控列表
					for(var i=0;i<r.list.length;i++){
					    var fid=r.list[i].fid;
					    var fname=r.list[i].fname;
					    var fkpiid=r.list[i].fkpiid;
					    var node = Node( {
							caption: fname,
							value: {
								id: fid,
								url: fkpiid
							},
							folder:false,
							click: _.Z,
							lazyload:null
						} ) ;
					   rootNode.append( node );//将节点加到根节点中
					}
				          
			        var dialog=Sue.ui.ext.dialog
			        (
					  {
					  caption: "选择指标监控",
					  width: 290,
					  height:350,
					  top:200
					  }
				    );
					    
				    dialog.addButton("确定", function() {
				    	//选择一个指标监控定义
				    	sInnerHtml="";
				    	var selectedNode = tree.getSelectedNode(); //获得选中节点
				    	if ( !selectedNode ) return; //空 直接返回
				        if(selectedNode.folder) return; //选择文件夹 直接返回
				        _this.sKPIMonitor=selectedNode.value.id;
				        _this.sKPIMonitorCaption=selectedNode.caption;
		                _this.sTextToShow=_this.sKPIMonitorCaption; 
		                var sTitleToShow = ( this.sTitle ? this.sTitle : "" );//抽象类中定义
		                _this.sTextColor = "#000000";

	                    var sInnerHtml = '<table style="width:100%; height:100%; border:0;"cellSpacing="0" cellPadding="0">';
	                    if( this.bShowTitle ) {
		                	sInnerHtml += '<tr height="26"><td class="cellTitle">' + sTitleToShow + '</td></tr>'
	                     }
	                   sInnerHtml += '<tr><td id="KPIMonitor_title" style="font-size:9pt; color:' + _this.sTextColor + '">' + _this.sTextToShow + '</td></tr></table>';

	                   _this.div.innerHTML = sInnerHtml;
	                   
	                   dialog.destroy();
	                   _this.showProperty(_this);
	                   
	 		           // var pieceUrl = "../html/piece.htm?path=" + nodePath + "&url=" + obj.servletURL;
		               // window.showModalDialog( pieceUrl, null, "dialogWidth=800px;dialogHeight=600px;center=yes;help=no;status=no;scroll=yes" );
				    });
				    dialog.addButton("取消", function() {
				    	dialog.destroy();
				    })
				    //div样式
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
		} );	
	},
	showProperty:function(obj){
		//debugger;
		var _this = obj;
		var dialogp=Sue.ui.ext.dialog
		({
			caption: "参数设置",
			width: 380,
			height:200,
			top:200
		});
		dialogp.setContent(_.loadUIT( "bi_dialog_dashboard_kpimonitor" )); 
	    dialogp.addButton("确定", function() {
               _this.sTitle = document.getElementById( "title" ).value;
               if(_this.sTitle==""||_this.sTitle==null){
					alert( "标题不允许为空！" );
					return;
				}
               _this.bShowTitle = document.getElementById("isShowTitle" ).checked;
		       _this.metricWidth = document.getElementById( "metricWidth" ).value;
		       _this.metricHeight = document.getElementById( "metricHeight" ).value;
		       _this.metricAutoFlow = document.getElementById( "metricAutoFlow" ).checked;
		        
               var objectName = document.getElementById( "objectName" );
	           var oldName =_this.name= objectName.value;
               var testObjectName = (objectName.value ).replace( /^\s+|\s+$/g, "" );
				testObjectName = testValidObjectName( testObjectName );
				 if(testObjectName==""||testObjectName==null){
					alert( "对象名称不允许为空！" );
					return;
				}
				if ( testObjectName !== true ) {
					alert( testObjectName );
					return;
				}
				var match=/^[1-9]\d*$/;
				if(!match.test(_this.metricWidth)||!match.test(_this.metricHeight)){
					alert("单个指标的宽度和高度必须是大于0的整数!");
					return;
				}
				_this.name = ( objectName.value ).replace( /^\s+|\s+$/g, "" );
				handleDialInSubScriptEngine( oldName, _this.name, _this );
				dialogp.destroy();
				_this.commonUpdateUI();

      });
        dialogp.addButton("取消", function() {
                dialogp.destroy();
	   });
		 document.getElementById( "objectName" ).value=_this.name;
		 document.getElementById( "title" ).value=_this.sTitle==null?"":_this.sTitle;
		 document.getElementById( "isShowTitle" ).checked=_this.bShowTitle;
		 document.getElementById( "metricWidth" ).value=_this.metricWidth==""?"200":_this.metricWidth;
		 document.getElementById( "metricHeight" ).value=_this.metricHeight==""?"150":_this.metricHeight;
		 document.getElementById( "metricAutoFlow" ).checked=_this.metricAutoFlow;
		 try {
				document.getElementById( "objectName" ).focus();
			} catch( e ) {
			}
	}
} );


///////////////////////////////////////////////////////////
// Utils
///////////////////////////////////////////////////////////

//工具方法
//function getDomChildNode(oDom, sChildTag)
//依赖model.js
//2009-8-3 拆分大文件 by Along

//工具方法
//function getDomChildText(oDom, sChildTag, sDefault)
//依赖model.js
//2009-8-3 拆分大文件 by Along


var jsKeyWordMap = _.hash( "abstract,boolean,break,byte,case,catch,char,class,const,continue,default,delete,do,double,else,extends,false,final,finally,float,for,function,goto,if,implements,import,in,instanceof,int,interface,long,native,new,null,package,private,protected,public,return,short,static,super,switch,synchronized,this,throw,throws,transient,true,try,typeof,undefined,var,void,while,with,Object,Math,String,Number,Boolean,Array,Image,Option,Error".split(","), _.I, 1 );
var dashboardKeyWordMap = _.hash( "window,name,document,parent,opener,top,location,history,navigator".split( "," ), _.I, 1 );

// 测试是否合法的对象名称
function testValidObjectName( name ) {
	if ( !name ) {
		return true;
	} else if ( !/^[A-Za-z]\w*$/.test( name ) ) {
		return "对象名称只能包含英文字符、数字和下划线，且必须英文字符开头。";
	} else if ( name in jsKeyWordMap ) {
		return "对象名称不能使用JavaScript关键字，请更换。";
	} else if ( name in dashboardKeyWordMap ) {
		return "对象名称不能使用仪表板运行环境关键字，请更换。";
	} else {
		return true;
	}
}

function handleDialInSubScriptEngine( oldName, newName, oCell ) {
	if ( oldName != newName ) {
		var se = SubScriptEngine,
			rt = se.Runtime,
			nm = rt.NameManager;
		// hasLayout为真表示在单元格内，否则在可切换区域
		if ( oCell.hasLayout() ) {
			if ( !oldName ) {
				var instance = rt.evalDial( oCell.type || oCell.sType, newName );
				if ( oCell.tdIID ) {
					var cell = nm.lookupIID( oCell.tdIID );
					cell[ instance.name ] = instance;
				} else {
					var anonymousCell = rt.getCurrentCells().getAnonymousCell( true );
					anonymousCell[ instance.name ] = instance;
					oCell.tdIID = anonymousCell.iid;
				}
				oCell.iid = instance.iid;
			} else if ( !newName ) {
				var iid = oCell.iid;
				var instance = nm.lookupIID( iid );
				nm.unregister( iid );
				if ( oCell.tdIID ) {
					var cell = nm.lookupIID( oCell.tdIID );
					delete cell[ instance.name ];
				} else {
					var anonymousCell = rt.getCurrentCells().getAnonymousCell();
					delete anonymousCell[ instance.name ];
				}
				oCell.iid = null;
			} else {
				var iid = oCell.iid;
				var instance = nm.lookupIID( iid );
				var cell = nm.lookupIID( oCell.tdIID );
				delete cell[ instance.name ];
				instance.changeName( newName );
				cell[ newName ] = instance;
			}
		} else {
			if ( !oldName ) {
				var instance = rt.evalDial( oCell.type || oCell.sType, newName );
				var ha = rt.getCurrentHiddenArea();
				ha.push( instance );
				oCell.tdIID = ha.iid;
				oCell.iid = instance.iid;
			} else if ( !newName ) {
				var iid = oCell.iid;
				var instance = nm.lookupIID( iid );
				nm.unregister( iid );
				if ( oCell.tdIID ) {
					var cell = nm.lookupIID( oCell.tdIID );
					if ( cell instanceof Array ) {
						var index = _.indexOf( cell, function( x ) {
							return x == instance;
						} );
						cell.splice( index, 1 );
					} else {
						delete cell[ instance.name ];
					}
				} else {
					var anonymousCell = rt.getCurrentCells().getAnonymousCell();
					delete anonymousCell[ instance.name ];
				}
				oCell.iid = null;
			} else {
				var iid = oCell.iid;
				var instance = nm.lookupIID( iid );
				var cell = nm.lookupIID( oCell.tdIID );
				if ( !( cell instanceof Array ) ) {
					delete cell[ instance.name ];
					cell[ newName ] = instance;
				}
				instance.changeName( newName );
			}
		}
	}
}

function __bindResource() {
	var _this = this;
	var dialog = Sue.ui.ext.dialog( {
		caption: "数据源选择",
		width: 400,
		height: 250,
		closeAction: "close"
	} );
	dialog.content.style.verticalAlign = "top";
	dialog.content.innerHTML = _.loadUIT( "bi_dialog_bind_datasource" );
	var tree = DataSource.getAllDataSourceTree( {
		parent: sue( "treeDiv" ),
		isFolderSelected: false,
		dashboardNodeClick: _.Z,
		repositoryNodeClick: _.Z,
		dashboardNodeDblclick: bindDataSource,
		repositoryNodeDblclick: bindDataSource
	} );
	dialog.addButton( "确定", bindDataSource );
	dialog.addButton( "取消", _.bind( dialog.destroy, dialog ) );
	
	function bindDataSource() {
		var node = tree.getSelectedNode();
		if ( !node ) return;
		if ( node.ds ) {
			_this.ds = node.ds;
			_this.commonUpdateUI();
			_this.outputColumns = _.map( node.ds.param.outputColumns, function( oc ) {
				return oc.alias;
			} );
			dialog.destroy();
			_this.isAutoSetProperty && _this.propertySetting();
		} else {
			_.post( {
				url: webUtilServlet,
				json: {
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "getDataSourceByID",
					dsPath: node.dsPath
				},
				callback: function( r ) {
					dialog.destroy();
					_this.ds = {
						param: r
					};
					_this.commonUpdateUI();
					_this.outputColumns = _.map( r.outputColumns, function( oc ) {
						return oc.alias;
					} );
					_this.isAutoSetProperty && _this.propertySetting();
				}
			} );
		}
	}
	
	function sue( value ) {
		return _.select( dialog.content, "sue", 1, value );
	}
}
