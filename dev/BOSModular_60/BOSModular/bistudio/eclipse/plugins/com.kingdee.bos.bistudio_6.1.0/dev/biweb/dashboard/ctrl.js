///////////////////////////////////////////////////////////
// 控 件
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// 颜色选择控件
//
// 尺寸：高度22；宽度大于30，无上限。
// 添加控件：构造时传入父容器和颜色即可。
// 设置选中值：setSelectedColor(sColor)
// 获取选中值：getSelectedColor()
//
var _aaSupplyColors = new Array(
	new Array("#000000", "#000000", "#003300","#006600", "#009900", "#00CC00", "#00FF00", "#330000","#333300","#336600","#339900","#33CC00","#33FF00","#660000","#663300","#666600","#669900","#66CC00","#66FF00"),
	new Array("#333333", "#000033", "#003333","#006633", "#009933", "#00CC33", "#00FF33", "#330033","#333333","#336633","#339933","#33CC33","#33FF33","#660033","#663333","#666633","#669933","#66CC33","#66FF33"),
	new Array("#666666", "#000066", "#003366","#006666", "#009966", "#00CC66", "#00FF66", "#330066","#333366","#336666","#339966","#33CC66","#33FF66","#660066","#663366","#666666","#669966","#66CC66","#66FF66"),
	new Array("#999999", "#000099", "#003399","#006699", "#009999", "#00CC99", "#00FF99", "#330099","#333399","#336699","#339999","#33CC99","#33FF99","#660099","#663399","#666699","#669999","#66CC99","#66FF99"),
	new Array("#CCCCCC", "#0000CC", "#0033CC","#0066CC", "#0099CC", "#00CCCC", "#00FFCC", "#3300CC","#3333CC","#3366CC","#3399CC","#33CCCC","#33FFCC","#6600CC","#6633CC","#6666CC","#6699CC","#66CCCC","#66FFCC"),
	new Array("#FFFFFF", "#0000FF", "#0033FF","#0066FF", "#0099FF", "#00CCFF", "#00FFFF", "#3300FF","#3333FF","#3366FF","#3399FF","#33CCFF","#33FFFF","#6600FF","#6633FF","#6666FF","#6699FF","#66CCFF","#66FFFF"),
	new Array("#FF0000", "#990000", "#993300","#996600", "#999900", "#99CC00", "#99FF00", "#CC0000","#CC3300","#CC6600","#CC9900","#CCCC00","#CCFF00","#FF0000","#FF3300","#FF6600","#FF9900","#FFCC00","#FFFF00"),
	new Array("#00FF00", "#990033", "#993333","#996633", "#999933", "#99CC33", "#99FF33", "#CC0033","#CC3333","#CC6633","#CC9933","#CCCC33","#CCFF33","#FF0033","#FF3333","#FF6633","#FF9933","#FFCC33","#FFFF33"),
	new Array("#0000FF", "#990066", "#993366","#996666", "#999966", "#99CC66", "#99FF66", "#CC0066","#CC3366","#CC6666","#CC9966","#CCCC66","#CCFF66","#FF0066","#FF3366","#FF6666","#FF9966","#FFCC66","#FFFF66"),
	new Array("#FFFF00", "#990099", "#993399","#996699", "#999999", "#99CC99", "#99FF99", "#CC0099","#CC3399","#CC6699","#CC9999","#CCCC99","#CCFF99","#FF0099","#FF3399","#FF6699","#FF9999","#FFCC99","#FFFF99"),
	new Array("#00FFFF", "#9900CC", "#9933CC","#9966CC", "#9999CC", "#99CCCC", "#99FFCC", "#CC00CC","#CC33CC","#CC66CC","#CC99CC","#CCCCCC","#CCFFCC","#FF00CC","#FF33CC","#FF66CC","#FF99CC","#FFCCCC","#FFFFCC"),
	new Array("#FF00FF", "#9900FF", "#9933FF","#9966FF", "#9999FF", "#99CCFF", "#99FFFF", "#CC00FF","#CC33FF","#CC66FF","#CC99FF","#CCCCFF","#CCFFFF","#FF00FF","#FF33FF","#FF66FF","#FF99FF","#FFCCFF","#FFFFFF"));

var _sTransparentColor = "#efefef";
var colorTDInput;
function ColorSelector(oOwner, iWidth)
{
	this.sColor;
	this.oCtrl = document.createElement("DIV");
	this.oArrow;
	this.oPopup;
	this.bPop;

	this.bShowDefault;
	this.sDefaultPrompt;
	this.sDefaultColor;
	
	//控件放到父容器里
	oOwner.innerHTML = "";	
	oOwner.appendChild(this.oCtrl);

	this.oCtrl.style.width = (iWidth ? iWidth : "100%");

	//初始化控件外观及下拉箭头
//	this.setSelectedColor(this.sColor);
	this.oCtrl.innerHTML = '<table width="100%" height="22" border="0" cellPadding="0" cellSpacing="0"><tr>' 
			+ '<td width="4"><img src="images/combocolor_left.gif"></img></td>'
			+ '<td><img width="100%" height="22" src="images/combocolor_center.gif"></img></td>'
			+ '<td width="20"><img src="images/combocolor_right.gif"></img></td>'
			+ '</tr></table>';
	this.oArrow = this.oCtrl.childNodes[0].childNodes[0].childNodes[0].childNodes[2];
	var thisInst = this;
	this.oArrow.onmousedown = function(){thisInst.popup();};
}

ColorSelector.prototype.initPopup = function()
{
	var thisInst = this;
	//初始化弹出框
	this.oPopup = document.createElement("DIV");
	this.oPopup.style.background = "#ffffff";
	this.oPopup.style.padding = "4";
	this.oPopup.style.width = "170";
	this.oPopup.style.height = "120";
	this.oPopup.style.border = "1 solid gray";

	this.oPopup.style.position = "absolute";
	this.oPopup.onmousedown = function(){thisInst.select()};
	this.oPopup.onblur = function(){thisInst.popupBlur()};
	
	var oTable = document.createElement("Table");
	oTable.cellPadding = "1";
	oTable.cellSpacing = "1";
	var oTBody = document.createElement("TBody");
    oTBody.style.cursor="hand";
    
	if(this.bShowDefault)
	{
		var oTR = document.createElement("TR");
		var oTD = document.createElement("TD");	
		oTD.colSpan = _aaSupplyColors[0].length;
		oTD.id = "td" + this.sDefaultColor;
		oTD.style.border = "0";
		oTD.onmousemove = function()
		{
			var oSrc = event.srcElement;
			while(!oSrc.id || oSrc.id.substr(0, 2) != "td")
			{
				oSrc = oSrc.parentNode;
			}
			thisInst.doMouseMove(oSrc);
			event.cancelBubble = true;
		};
		oTD.onmouseout = function()
		{
			var oSrc = event.srcElement;
			while(!oSrc.id || oSrc.id.substr(0, 2) != "td")
			{
				oSrc = oSrc.parentNode;
			}
			thisInst.doMouseOut(oSrc);
			event.cancelBubble = true;
		};
	
		var oDiv = document.createElement("DIV");
		oDiv.dashboard_color = this.sDefaultColor;
		oDiv.style.width = 138;
		oDiv.style.height = 20;
		oDiv.style.border = "1 solid gray";
		oDiv.innerHTML = '<table cellPadding="0" cellSpacing="0" height="100%" width="100%">'
			+ '<tr><td width="16" style="padding:2">' 
			+ '<div style="width:12; height:12; border:1 solid gray; font-size:1pt;' 
			+ 'background:' + (this.sDefaultColor ? this.sDefaultColor : "") + '">&nbsp</div></td>'
			+ '<td style="font-size:9pt; text-align:center; vertical-align:middle">' 
			+ this.sDefaultPrompt + '&nbsp&nbsp&nbsp&nbsp' + '</td></tr></table>';
	
		oTD.appendChild(oDiv);
		oTR.appendChild(oTD);
		oTBody.appendChild(oTR);
	}

	for(var i = 0; i < _aaSupplyColors.length; i++)
	{
		var oTR = document.createElement("TR");
		var aSupplyColors = _aaSupplyColors[i];
		for(var j = 0; j < aSupplyColors.length; j++)
		{
			var oTD = document.createElement("TD");	
			oTD.id = "td" + aSupplyColors[j];//"td#ffffff"
			oTD.style.width = 10;//12 + (cellPadding 1 + border 1) * 2
			oTD.style.height = 10;
			oTD.style.border = "0";//
			oTD.onmousemove = function()
			{  
				thisInst.doMouseMove(event.srcElement);
				event.cancelBubble = true;
			};
			oTD.onmouseout = function()
			{
				thisInst.doMouseOut(event.srcElement);
				event.cancelBubble = true;
			};

			var oDiv = document.createElement("DIV");
			oDiv.dashboard_color = aSupplyColors[j];
			oDiv.style.width = 10
			oDiv.style.height = 10;
			oTD.style.background = aSupplyColors[j];
			//oDiv.style.border = "0";
			oDiv.style.fontSize = "2";
			//oDiv.innerHTML = "&nbsp";
			
			oTD.appendChild(oDiv);
			oTR.appendChild(oTD);
		}
		oTBody.appendChild(oTR);
	}
	//自定义颜色
	var colorTR = document.createElement("TR");
	var colorTDLabel = document.createElement("TD");	
    colorTDLabel.innerHTML="<font size=\"2\">自定义颜色:</font>";
    colorTDLabel.colSpan =6;
    colorTR.appendChild(colorTDLabel);
    //颜色输入框
    var colorTDText = document.createElement("TD");
    colorTDInput= document.createElement("INPUT");
    colorTDText.appendChild(colorTDInput);
    colorTDInput.size=6;
    colorTDText.colSpan =7;
    colorTR.appendChild(colorTDText);

	//确定
	var okTD = document.createElement("TD");
	okTD.colSpan=3;
	
	var okInput=document.createElement("INPUT");
	okInput.name="okInput";
	okInput.value="确定";
	okInput.type="button";
	okInput.style.height="20";
	
	okTD.appendChild(okInput);
	colorTR.appendChild(okTD);
	
	//取消
	var cancelTD = document.createElement("TD");
	cancelTD.colSpan=3;
	
	var cancelInput=document.createElement("INPUT");
	cancelInput.name="cancelInput";
	cancelInput.value="取消";
	cancelInput.type="button";
	cancelInput.style.height="20";
	cancelTD.appendChild(cancelInput);
	
	colorTR.appendChild(cancelTD);
	
	oTBody.appendChild(colorTR);
	oTable.appendChild(oTBody);
	this.oPopup.appendChild(oTable);
}

//颜色盘上面的大块，参数可传如（"透明",_sTransparentColor）或（"自动"，"#000000"）等等
ColorSelector.prototype.setShowDefault = function(sDefaultPrompt, sDefaultColor)
{
	this.bShowDefault = true;
	this.sDefaultPrompt = sDefaultPrompt;
	this.sDefaultColor = sDefaultColor;
}

ColorSelector.prototype.getSelectedColor = function()
{
	return this.sColor;
}

ColorSelector.prototype.setSelectedColor = function(sColor)
{
	this.sColor = sColor;
	this.oCtrl.style.background = (this.sColor ? this.sColor : "#efefef");//不确定的话用灰色显示
}

ColorSelector.prototype.doMouseMove = function(oTarget)
{   
	var oSrc = event.srcElement;
	if(oTarget)
	{   
		if(oTarget.tagName.toUpperCase() == "DIV")
		{
			oTarget = oTarget.parentNode;
		}
		//oTarget.style.border="1 solid blue";
		colorTDInput.value=oTarget.id.substr(2,oTarget.id.length);
		//初始化自定义颜色
	}else if(oTarget==null){
		colorTDInput.value=this.sColor;
	}
}

ColorSelector.prototype.doMouseOut = function(oTarget)
{
	if(oTarget)
	{
		if(oTarget.tagName.toUpperCase() == "DIV")
		{
			oTarget = oTarget.parentNode;
		}

		if(oTarget.children[0].dashboard_color != this.sColor)
		{
			oTarget.style.border = "0";
		}
	
	}
}

ColorSelector.prototype.popup = function()
{
	if(!this.oPopup)
	{
		this.initPopup();
	}
	
	if(this.bPop)
	{
		document.body.removeChild(this.oPopup);
	}
	else
	{
		document.body.appendChild(this.oPopup);
		
		var oObj = this.oCtrl;
		var left = 0, top = 0;
		do 
		{
			left += oObj.offsetLeft - oObj.scrollLeft;
			top += oObj.offsetTop - oObj.scrollTop;
		}
		while((oObj = oObj.offsetParent));

		if(left + this.oPopup.clientWidth > document.body.clientWidth)
		{
			left += this.oCtrl.clientWidth - this.oPopup.clientWidth;
		}
		top += this.oCtrl.clientHeight;
		this.oPopup.style.left = left;
		this.oPopup.style.top = top;
		colorTDInput.focus();//设置自定义输入框为焦点
		//this.oPopup.focus();
		this.doMouseMove(document.getElementById("td" + this.sColor));
	}
	this.bPop = !this.bPop;
}

ColorSelector.prototype.select = function()
{
	var oSrc = event.srcElement;
	//如果点击自定义确定按钮
	if(oSrc.name=="okInput")
	{   
		var sLastColor = this.sColor;
		var sColorSelected=colorTDInput.value;
		this.sColor = sColorSelected;
		this.doMouseOut(document.getElementById("td" + sLastColor));
		try {
		this.oCtrl.style.background = (this.sColor ? this.sColor : "#efefef");
		this.popup();
		}catch(e){
			alert("自定义颜色格式不正确");	
		}
	//如果点击自定义取消按钮	
	}else if(oSrc.name=="cancelInput")
	{
		this.popup();
	}else
	{
		while(!oSrc.dashboard_color && oSrc.tagName.toUpperCase() != "BODY")
		{
			oSrc = oSrc.parentNode;
		}
		var sColorSelected = oSrc.dashboard_color;
		if(sColorSelected || sColorSelected == _sTransparentColor)
		{
			var sLastColor = this.sColor;
			this.sColor = sColorSelected;
			this.doMouseOut(document.getElementById("td" + sLastColor));
			this.oCtrl.style.background = (this.sColor ? this.sColor : "#efefef");
			this.popup();
		}
	}
}

ColorSelector.prototype.popupBlur = function()
{
	var iLeft = this.oPopup.offsetLeft;
	var iRight = this.oPopup.offsetLeft + this.oPopup.offsetWidth;
	var iTop = this.oPopup.offsetTop;
	var iBottom = this.oPopup.offsetTop + this.oPopup.offsetHeight;
	if(event.x > iLeft && event.x < iRight 
		&& event.y > iTop && event.y < iBottom)
	{
		//在弹出框范围内，点表格任一对象也会使弹出框失去焦点，把焦点还给弹出框
		this.oPopup.focus();
	}
	else
	{
		//关闭
		this.popup();
	}
}
