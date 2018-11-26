/////////////////////////////////////////////
// 杜邦树   Along 091112
// 将XML解析成树控件的数据模，此XML由服务端传来。
// 提供树控件要求的视图实现。
/////////////////////////////////////////////

var DUPONT_PKEY_METRIC_ID = "dupont.metric.number";

//预测时节点值类型：没改动、编辑过、被动计算改变
var DUPONT_PDEDICT_NOCHANGE = "none";
var DUPONT_PDEDICT_EDITED = "edited";
var DUPONT_PDEDICT_CALCULATED = "calculated";

//**************************
//*  XML->树控件的数据模型
//**************************
function XmlParser()
{
	var _treeModel;//HorizontalTreeModel
	var _view;
	//debugger;
	
	this.parse = function(sXml)
	{
		var oDom = getDom(sXml);
		var oDomRoot = oDom.firstChild;
		var oDomView = getDomChildNode(oDomRoot, "View");
		var oDomMetric = getDomChildNode(oDomRoot, "Metric");
		var oTreeRoot = loadMetric(oDomMetric);
		_treeModel = new HorizontalTreeModel(oTreeRoot);
		
		_view = new DupontView();
//		var measureCount = oDomView.getAttribute("measureCount");
//		if(measureCount)
//		{
//			_view.setMeasureCount(parseInt(measureCount));
//		}
		var measureNames = new Array();
		for(var i = 0; i < oDomView.childNodes.length; i++)
		{
			var oDomMeasure = oDomView.childNodes[i];
			if(oDomMeasure.tagName == "Measure")
			{
				measureNames.push(oDomMeasure.text);
			}
		}
		_view.setMeasureNames(measureNames);
	}
	
	this.getTreeModel = function()
	{
		return _treeModel;
	}
	
	this.getView = function()
	{
		return _view;
	}
	
	var loadMetric = function(oDomMetric)
	{
		var oTreeNode = new HorizontalTreeNode();
		
		var sNumber = oDomMetric.getAttribute("number");
		var sAllowsExpand = oDomMetric.getAttribute("allowsExpand");
		var sExpanded = oDomMetric.getAttribute("expanded");
		
		oTreeNode.setExtProperty(DUPONT_PKEY_METRIC_ID, sNumber);
		oTreeNode.setAllowsExpand(sAllowsExpand != "false");//缺省为true允许展开
		oTreeNode.setExpanded(sExpanded != "false");//缺省为true展开着的
		
		//CompositeItem的设计已经不用了，但代码仍保留
		var bComposite = (oDomMetric.getAttribute("itemType") == "composite");
		var oItem;
		if(bComposite)
		{
			oItem = new CompositeItem();
		}
		
		var sSign = null;
		for(var i = 0; i < oDomMetric.childNodes.length; i++)
		{
			var oDomChildNode = oDomMetric.childNodes[i];
			if(oDomChildNode.tagName == "Sign")
			{
				sSign = oDomChildNode.text;
			}
			else if(oDomChildNode.tagName == "Item")
			{
				var item = loadSingleItem(oDomChildNode);
				if(bComposite)
				{
					oItem.addItem(sSign, item);
					sSign = null;
				}
				else
				{
					oItem = item;
				}
			}
			else if(oDomChildNode.tagName == "Children")
			{
				var iRelationIdx = 0;
				for(var j = 0; j < oDomChildNode.childNodes.length; j++)
				{
					var oDomChildNode2 = oDomChildNode.childNodes[j];
					if(oDomChildNode2.tagName == "Metric")
					{
						oTreeNode.addChild(loadMetric(oDomChildNode2));
						iRelationIdx++;
					}
					else if(oDomChildNode2.tagName == "Sign")
					{
						oTreeNode.setChildrenRelation(iRelationIdx, oDomChildNode2.text);
					}
				}
				oTreeNode.setWithBeanpodChildren(
						"true" == oDomChildNode.getAttribute("beanpod"));
			}
		}
		if(bComposite)
		{
			oItem.addEndSign(sSign);
		}
		oTreeNode.setValue(oItem);		return oTreeNode;
	}

	var loadSingleItem = function(oDomItem)
	{
		var oDomValues = getDomChildNode(oDomItem, "Values");
		if("true" == oDomItem.getAttribute("constant"))
		{
			var oDomValue = getDomChildNode(oDomValues, "Value");
			var oValue = loadValue(oDomValue);
			var oConstItem = new ConstItem();
			oConstItem.setValue(oValue);
			return oConstItem;
		}
		else
		{
			var oVarItem = new VarItem();
			oVarItem.setCaption(getDomChildNode(oDomItem, "Caption").text);
			for(var i = 0; i < oDomValues.childNodes.length; i++)
			{
				var oDomValue = oDomValues.childNodes[i];
				if(oDomValue.tagName == "Value")
				{
					var oValue = loadValue(oDomValue);
					oVarItem.addValue(oValue);
				}
			}
			return oVarItem;
		}
	}
	
	var loadValue = function(oDomValue)
	{
		var sText = oDomValue.text;
		
		var sOriDigital = oDomValue.getAttribute("ori");
		sOriDigital = (sOriDigital ? sOriDigital : sText);
		
		var sDigital = oDomValue.getAttribute("digital");
		sDigital = (sDigital ? sDigital : sOriDigital);
		
		var sUnit = oDomValue.getAttribute("unit");
		
		var sChanged = oDomValue.getAttribute("changed");
		
		return new NumbericalValue(sText, sOriDigital, sDigital, sUnit, sChanged);
	}

	var getDom = function(sXml)
	{
		if(window.DOMParser)   
		{   
			var p = new DOMParser();   
			return p.parseFromString(sXml, "text/xml");
		}   
		else if(window.ActiveXObject)
		{
			var doc	= new ActiveXObject("Msxml2.DOMDocument");
			doc.loadXML(sXml);
			return doc;
		}
		else
		{
			return false;
		}
	}
	
	var getDomChildNode = function(oDomParentNode, sChildTag)
	{
		for(var i = 0; i < oDomParentNode.childNodes.length; i++)
		{
			var oDomChildNode = oDomParentNode.childNodes[i];
			if(oDomChildNode.tagName == sChildTag)
			{
				return oDomChildNode;
			}
		}
		return null;
	}
}

//************************************************************
//* 数值的包装，是Item中一个Value对应的数据模型
//* 支持可分析 -- add at 09圣诞
//************************************************************
function NumbericalValue(sText, sOriDigital, sDigital, sUnit, sChangeMark)
{
	var _sText = sText;//显示的字符串
	var _sOriDigital = sOriDigital;//未编辑过的原始值，必须可解析成数字
	var _sDigital = sDigital;//可供编辑的数值，必须可解析成数字
	var _sUnit = sUnit;//字符串，单位，如"％"，"百万"等
	var _sChangedMark = sChangeMark;//值改变的标志：编辑（主动改）、计算（被动改）或没改
	
	this.getUnit = function()
	{
		return _sUnit;
	}

	this.getOriDigital = function()
	{
		return _sOriDigital;
	}
	
	this.getText = function()
	{
		return _sText;
	}
	
	this.setText = function(sText)
	{
		_sText = sText;
	}
	
	this.getDigital = function()
	{
		return _sDigital;
	}
	
	this.setDigital = function(sDigital)
	{
		_sDigital = sDigital;
	}
	
	//值改变了
	this.isEdited = function()
	{
		return (_sChangedMark == DUPONT_PDEDICT_EDITED 
			|| _sChangedMark == DUPONT_PDEDICT_CALCULATED);
	}
}

//************************************************************
//* 用作树节点中的value
//* 树节点与“指标”对应；一个节点中允许有1个或多个项目，
//* 如1-X，1是一个项目（常量），X是一个项目。
//* 1是ConstItem，X是VarItem，1-X是CompositeItem
//************************************************************
function ConstItem()
{
	var _oValue;//NumbericalValue
	
	this.setValue = function(oValue)
	{
		_oValue = oValue;
	}
	
	this.getValue = function()
	{
		return _oValue;
	}
	
	//return Dimension
	this.getDisplaySize = function()
	{
		var result = new Dimension();

		var span = document.createElement("span");
		span.className = "itemConst";
		span.style.fontWeight = _oValue.isEdited() ? 700 : 400;
		span.innerHTML = _oValue.getText();
		document.body.appendChild(span);
		result.setWidth(span.offsetWidth);
		result.setHeight(span.offsetHeight);
		document.body.removeChild(span);
		
		return result;
	}
}

function VarItem()
{
	var _sCaption;
	var _aValues = new Array();//NumbericalValue
	
	this.setCaption = function(sCaption)
	{
		_sCaption = sCaption;
	}
	
	this.getCaption = function()
	{
		return _sCaption;
	}
	
	this.addValue = function(oValue)
	{
		_aValues.push(oValue);
	}
	
	this.getValue = function(iIdx)
	{
		return _aValues[iIdx];
	}
	
	this.getValuesCount = function()
	{
		return _aValues.length;
	}
	
	//return Dimension
	this.getDisplaySize = function()
	{
		var span = document.createElement("span");
		span.className = "itemCaption";
		span.innerText = _sCaption;
		document.body.appendChild(span);
		var maxWidth = span.offsetWidth;
		var height = span.offsetHeight;
		document.body.removeChild(span);
		
		for(var i = 0; i < _aValues.length; i++)
		{
			var span = document.createElement("span");
			span.className = "itemValue";
			span.style.fontWeight = _aValues[i].isEdited() ? 700 : 400;
			span.innerText = _aValues[i].getText();
			document.body.appendChild(span);
			len = span.offsetWidth;
			height += span.offsetHeight;
			document.body.removeChild(span);
			
			if(len > maxWidth)
			{
				maxWidth = len;
			}
		}
		
		var result = new Dimension();
		result.setWidth(maxWidth);
		result.setHeight(height);
		return result;
	}
}

function CompositeItem()
{
	var _aSigns = new Array();//字符串
	var _aItems = new Array();//ConstItem 或 VarItem
	
	//(1-X)拆成如下录入：
	//addItem("(", 1);
	//addItem("-", X);
	//addEndSign(")");
	this.addItem = function(sSign, oSingleItem)
	{
		_aSigns.push(sSign);
		_aItems.push(oSingleItem);
	}
	
	this.addEndSign = function(sSign)
	{
		_aSigns.push(sSign);
	}
	
	this.getItemsCount = function()
	{
		return _aItems.length;
	}
	
	this.getSign = function(iIdx)
	{
		return _aSigns[iIdx];
	}
	
	this.getItem = function(iIdx)
	{
		return _aItems[iIdx];
	}
}

//********************
//*  视图的自定义实现
//********************
function DupontView()
{
	var _this = this;
	DefaultHorizontalTreeView.call(this);
	
	var LevelDistance = 24;//层间距
	var SiblingGap = 18;//亲兄弟节点的水平间距
	var CousinGap = 24;//表兄弟节点的水平间距
	var BeanpodBusWidth = 20;//纵向子的连接线所占宽度，亦即纵向子左沿相对其父节点的缩进值
	var BeanpodSiblingGap = 6;//纵向子之间的垂直间距

	var ExpanedBoxLength = 12;//展开点击块+-的大小
	var ConstItemWidth = 40;//常量Item的宽度
	var VarItemWidth = 80;//变量Item的宽度
	var VarItemValueHeight = 21;//变量Item的每个Value的高度，包括Caption
	var ItemGap = SiblingGap * 0.6;//用兄弟间距打个折做为item间距

	var _measureCount = 1;
	var _measureNames;// = new Array();
	
	var _analysable = false;
	var _analysing = false;
	var _analysisCallBackFun;//回调函数
	
	this.setAnalysable = function(analysable)
	{
		if(_analysable && !analysable)
		{
			this.clearAllEdited();
		}
		_analysable = analysable;
	}
	
	this.isAnalysable = function()
	{
		return _analysable;
	}
	
	this.setAnalysisCallBackFun = function(fun)
	{
		_analysisCallBackFun = fun;
	}
	
//	this.setMeasureCount = function(count)
//	{
//		_measureCount = count;
//	}
	
	this.setMeasureNames = function(aNames)
	{
		_measureNames = aNames;
		_measureCount = aNames.length;
	}
	
	this.drawNode = function(divOwner, node, x, y, width, height)
	{
		if(!node.getParent())//根节点
		{
			//图例
			var oTreeNode = new HorizontalTreeNode();
			var oVarItem = new VarItem();
			oVarItem.setCaption("指标名称");
			for(var i = 0; i < _measureCount; i++)
			{
				oVarItem.addValue(new NumbericalValue(_measureNames[i]));
			}
			oTreeNode.setValue(oVarItem);
			
			var dim = this.calculateNodeSize(oTreeNode);
			var xCutline = 5;
			var yCutline = 10;
			if(xCutline + dim.getWidth() + 20 > x)
			{
				xCutline = x + width + 20;
			}
			
			var div = document.createElement("div");
			div.innerText = "图\r\n例";
			div.style.position = "absolute";
			div.style.left = xCutline;
			div.style.top = yCutline;
			div.style.width = 15;
			div.style.height = 50;
			div.style.fontSize = "10pt";
			divOwner.appendChild(div);
			
			xCutline += 15;
			yCutline = 5;
			addItem(divOwner, oTreeNode, xCutline, yCutline, dim.getWidth(), dim.getHeight());
		}

		addExpandBox(divOwner, node, x, y, width, height);
		addItem(divOwner, node, x, y, width, height);
	}
	
	var addItem = function(owner, node, x, y, width, height)
	{
		var item = node.getValue();
		if(item instanceof CompositeItem)
		{
			//虚线外框，CompositeItem的设计已经不用了
			var div = document.createElement("div");
			div.style.position = "absolute";
			div.style.left = x - 2;
			div.style.top = y - 2;
			div.style.width = width + 4;
			div.style.height = height + 4;
			div.style.border = "1 dashed  #ff9999";
//			div.visibleControllerNode = node.getParent();
			owner.appendChild(div);
			
			addCompositeItem(node, item, owner, x, y, width, height);
		}
		else if(item instanceof VarItem)
		{
			addVarItem(node, item, owner, x, y, width, height);
		}
		else if(item instanceof ConstItem)
		{
			addConstItem(node, item, owner, x, y, width, height);
		}
	}
	
	var addCompositeItem = function(node, compositeItem, owner, x, y, width, height)
	{
		var addX = x;
		var i;
		for(i = 0; i < compositeItem.getItemsCount(); i++)
		{
			var sign = compositeItem.getSign(i);
			if(sign)
			{
				_this.drawRelation(owner, node.getParent(), sign, addX, y, ItemGap, height);
				addX += ItemGap;
			}
			
			var singleItem = compositeItem.getItem(i);
			if(singleItem instanceof ConstItem)
			{
				addConstItem(node, singleItem, owner, addX, y, ConstItemWidth, height);
				addX += ConstItemWidth;
			}
			else// if(singleItem instanceof VarItem)
			{
				addVarItem(node, singleItem, owner, addX, y, VarItemWidth, height);
				addX += VarItemWidth;
			}
		}
		var sign = compositeItem.getSign(i);
		if(sign)
		{
			_this.drawRelation(owner, node.getParent(), sign, addX, y, ItemGap, height);
		}
	}
	
	var addConstItem = function(node, constItem, owner, x, y, width, height)
	{
		var ctrl = document.createElement("div");
		ctrl.style.position = "absolute";
		ctrl.style.left = x;
		ctrl.style.top = y;
		ctrl.style.width = width;
		ctrl.style.height = height;
		
		var sText = constItem.getValue().getText();
		ctrl.innerHTML = '<table height="100%" width="100%"><tr><td>' + sText + "</td></tr></table>";
		ctrl.children[0].className = "itemConst";
		ctrl.children[0].style.fontWeight = constItem.getValue().isEdited() ? 700 : 400;
		
		ctrl.style.cursor = "text";
		ctrl.dupont_model = node;
		ctrl.dupont_metric_idx = 0;
		ctrl.onclick = onAnalysis;
		
//		ctrl.visibleControllerNode = node.getParent();
		owner.appendChild(ctrl);
	}
	
	var addVarItem = function(node, varItem, owner, x, y, width, height)
	{
		var valuesCount = varItem.getValuesCount();
		var valueHeight = Math.floor(height / (valuesCount + 1));
		var captionHeight = height - valueHeight * valuesCount;
		
		var ctrl = document.createElement("div");
		ctrl.style.position = "absolute";
		ctrl.style.left = x;
		ctrl.style.top = y;
		ctrl.style.width = width;
		ctrl.style.height = captionHeight;
		ctrl.className = "itemCaption";
		ctrl.style.cursor = "default";
		
		ctrl.innerText = varItem.getCaption();
//		ctrl.visibleControllerNode = node.getParent();
		owner.appendChild(ctrl);
		
		var yAdd = y + captionHeight;
		for(var i = 0; i < valuesCount; i++)
		{
			var ctrl = document.createElement("div");
			ctrl.style.position = "absolute";
			ctrl.style.left = x;
			ctrl.style.top = yAdd;
			ctrl.style.width = width;
			ctrl.style.height = valueHeight;
			ctrl.className = "itemValue";
			ctrl.style.fontWeight = varItem.getValue(i).isEdited() ? 700 : 400;

			ctrl.innerText = varItem.getValue(i).getText();
//			ctrl.visibleControllerNode = node.getParent();
			
			ctrl.style.cursor = (node.getParent() ? "text" : "default");
			ctrl.dupont_model = node;
			ctrl.dupont_metric_idx = i;
			ctrl.onclick = onAnalysis;

			owner.appendChild(ctrl);
			yAdd += valueHeight;
		}
	}
	
	var addExpandBox = function(divOwner, node, x, y, width, height)
	{
		if(!node.isLeaf() && node.isAllowsExpand())
		{
			var ex;
			if(node.isWithBeanpodChildren())
			{
				ex = x + (_this.getBeanpodBusWidth() - ExpanedBoxLength) / 2;
			}
			else
			{
				ex = x + (width - ExpanedBoxLength) / 2;
			}
			
			var ey = y + height;

			var eDiv = document.createElement("div");
			eDiv.style.cursor = "hand";
			eDiv.style.position = "absolute";
			eDiv.style.left = ex;
			eDiv.style.top = ey;
			eDiv.style.width = ExpanedBoxLength;
			eDiv.style.height = ExpanedBoxLength;
			eDiv.style.zIndex = 1;//在上面
			eDiv.userObject = node;
//			eDiv.visibleControllerNode = node.getParent();
			divOwner.appendChild(eDiv);	
			updateExpandBox(node, eDiv);

			eDiv.onclick = function()
			{
				if(_analysing)
				{
					return;
				}
				var div = window.event.srcElement;
				var node = div.userObject;
				node.setExpanded(!node.isExpanded());
				updateExpandBox(node, div);
				_this.getTree().updateUI();
//				_this.updateAllCtrlVisible(divOwner);
			};
			eDiv.onselectstart = function()
			{
				return false;
			};
		}
	}
	
	var updateExpandBox = function(node, div)
	{
		if(node.isExpanded())
		{
			div.innerText = "-";
			div.className = "expandBox_expanded";
		}
		else
		{
			div.innerText = "+";
			div.className = "expandBox_unExpanded";
		}
	}
	
	//节点大小	
	this.calculateNodeSize = function(node)
	{
		var w = 0;
		var h = 0;
		var item = node.getValue();
		if(item instanceof CompositeItem)
		{
			for(var i = 0; i < item.getItemsCount(); i++)
			{
				var sign = item.getSign(i);
				if(sign)
				{
					w += ItemGap;
				}
				var singleItem = item.getItem(i);
				if(singleItem instanceof ConstItem)
				{
					w += ConstItemWidth;
				}
				else// if(singleItem instanceof VarItem)
				{
					w += VarItemWidth;
					if(h == 0)
					{
						h = getNodeHeight(singleItem.getValuesCount());
					}
				}
			}
			if(item.getSign(item.getItemsCount()))
			{
				w += ItemGap;
			}
		}
		else if(item instanceof VarItem)
		{
			var dim = item.getDisplaySize();
			w = Math.max(dim.getWidth(), VarItemWidth);
			h = Math.max(dim.getHeight(), getNodeHeight(item.getValuesCount()));
		}
		else if(item instanceof ConstItem)
		{
			var dim = item.getDisplaySize();
			w = Math.max(dim.getWidth(), ConstItemWidth);
			h = Math.max(dim.getHeight(), getNodeHeight(_measureCount));
		}
		return new Dimension(w, h);
	}
	
	var getNodeHeight = function(valueCount)
	{
		return (valueCount + 1) * VarItemValueHeight;
	}

	//层间距
	this.getLevelDistance = function()
	{
		return LevelDistance;
	}

	//亲兄弟节点的水平间距
	this.getSiblingGap = function(relation)
	{
		var width = 0;
		if(relation)
		{
			var span = document.createElement("span");
			span.className = "sign";
			span.innerText = relation;
			document.body.appendChild(span);
			width = span.offsetWidth + 6;
			document.body.removeChild(span);
		}
		return Math.max(width, SiblingGap);
	}

	//表兄弟节点的水平间距
	this.getCousinGap = function()
	{
		return CousinGap;
	}
	
	//纵向子的连接线所占宽度，亦即纵向子左沿相对其父节点的缩进值
	this.getBeanpodBusWidth = function()
	{
		return BeanpodBusWidth;
	}

	//纵向子之间的垂直间距
	this.getBeanpodSiblingGap = function()
	{
		return BeanpodSiblingGap;
	}

	this.drawRelation = function(divOwner, parentNode, relation, x, y, width, height)
	{
		if(relation)
		{
			var div = document.createElement("div");
			div.style.position = "absolute";
			div.style.left = x;
			div.style.top = y;
			div.style.width = width;
			div.style.height = height;
			div.innerHTML = '<table height="100%" width="100%"><tr><td>' + relation + "</td></tr></table>";
			div.children[0].className="sign";
			
			divOwner.appendChild(div);
//			div.visibleControllerNode = parentNode;
		}
	}
	
	this.drawPreceding = function(divOwner, node, x, y)
	{
		//画承上的线
		var upMidY = y - this.getLevelDistance() * 0.33;
		var div = drawVLine(divOwner, x, upMidY, y);
//		div.visibleControllerNode = node.getParent();
	}
	
	this.drawFollowing = function(divOwner, node, x1, x2, xParentAss, yParentAss, yChildren)
	{
		var downMidY = yChildren - this.getLevelDistance() * 0.33;
		//画启下的线
		var div = drawVLine(divOwner, xParentAss, yParentAss, downMidY);
//		div.visibleControllerNode = node;
		//画横线
		div = drawHLine(divOwner, x1, x2, downMidY);
//		div.visibleControllerNode = node;
	}

	this.drawBeanpodBus = function(divOwner, node, x, y, xBeans, yBeans)
	{
		var lastBeanIdx = xBeans.length - 1;
		var div = drawVLine(divOwner, x, y, yBeans[lastBeanIdx]);
//		div.visibleControllerNode = node;
		for(var i = 0; i <= lastBeanIdx; i++)
		{
			div = drawHLine(divOwner, x, xBeans[i], yBeans[i]);
//			div.visibleControllerNode = node.getChild(i);	
		}
	}

	//画横线
	var drawHLine = function(divOwner, x1, x2, y)
	{
		var div = document.createElement("div");
		div.style.fontSize = 0;
		div.style.position = "absolute";
		div.style.left = x1;
		div.style.top = y;
		div.style.width = x2 - x1;
		div.style.height = 1;
		div.className = "lineH";
		divOwner.appendChild(div);
		return div;
	}
	
	//画竖线
	var drawVLine = function(divOwner, x, y1, y2)
	{
		var div = document.createElement("div");
		div.style.fontSize = 0;
		div.style.position = "absolute";
		div.style.left = x;
		div.style.top = y1;
		div.style.width = 1;
		div.style.height = y2 - y1;
		div.className = "lineV";
		divOwner.appendChild(div);
		return div;
	}
	
	var onAnalysis = function()
	{
		if(!_analysable || _analysing)
		{
			return;
		}
		var src = event.srcElement;
		while(!src.dupont_model)
		{
			src = src.parentNode;
		}
		var node = src.dupont_model;
		if(!node.getParent())
		{
			return;//根节点修改没有意义
		}
		_analysing = true;
		
		//Item/NumbericalValue
		var nv = node.getValue().getValue(src.dupont_metric_idx);
		
		var ctrlWraper = new InputCtrl();
		ctrlWraper.setOriValue(nv.getOriDigital());
		ctrlWraper.setCurrentValue(nv.getDigital());
		ctrlWraper.setValueChanged(nv.isEdited());
				
		var ctrl = ctrlWraper.getCtrl(src.offsetWidth, nv.getUnit());
		ctrl.style.left = src.offsetLeft;
		ctrl.style.top = src.offsetTop;
		
		var owner = src.parentNode;
		owner.removeChild(src);
		owner.appendChild(ctrl);
		
		var oriClickFun = owner.onclick;
		var ctrlCallBackFun = function(isOk, isRecoverValue)
		{
			if(isOk)
			{
				nv.setDigital(ctrlWraper.getCurrentValue());
				if(_analysisCallBackFun)
				{	
					_analysisCallBackFun(
						node.getExtProperty(DUPONT_PKEY_METRIC_ID), 
						src.dupont_metric_idx, 
						nv.getDigital(),
						isRecoverValue);
				}
			}
			
			owner.removeChild(ctrl);
			owner.appendChild(src);
			_analysing = false;
			owner.onclick = oriClickFun;
		}
		ctrlWraper.setCallBack(ctrlCallBackFun);
		owner.onclick = function()
		{
			var src = event.srcElement;
			do
			{
				if(src == ctrl)
				{
					return;
				}
				src = src.parentNode;
			}
			while(src != null)
			ctrlCallBackFun(false);
		};
		
		ctrlWraper.init();
	}
	
	//整树还原
	this.clearAllEdited = function()
	{
		var root = this.getTree().getModel().getRoot();
		_analysisCallBackFun(root.getExtProperty(DUPONT_PKEY_METRIC_ID), -1, 0, true);
		//根节点还原即整树还原；用-1表示所有度量
	}
}

//**********************************
//*  该类定义一个分析用的输入控件
//**********************************
function InputCtrl()
{
	var _ctrl = document.createElement("div");//总的容器
	var _txtInput = document.createElement("Input");//输入控件
	var _btnReduce = document.createElement("Input");
	var _btnIncrease = document.createElement("Input");
	var _labUnit = document.createElement("span");
	var _btnBack = document.createElement("Input");
	var _btnOK = document.createElement("Input");
	
	var INPUT_HEIGHT = 21;
	var BUTTON_HEIGHT = 17;
	
	var _timer;//用于点下按钮后连续的增减值
	var _timerStop;
	
	var _oriValue;//分析时修改前原始的数值
	var _currentValueBackup;
	
	var _callBackFun;//按[确定]或[清除]后回调的函数
	
	_txtInput.type = "text";
	_txtInput.style.position = "absolute";
	_txtInput.style.border = "1 solid gray";
	_txtInput.onkeypress = function(){doKeyPress()};
	
	_btnReduce.type = "button";
	_btnReduce.value = "-";
	_btnReduce.style.position = "absolute";
	_btnReduce.className = "inputCtrlButton";
	_btnReduce.hideFocus = true;
	_btnReduce.onmousedown = function(){doIRStart(false)};
	_btnReduce.onmouseup = function(){doIRStop()};
	
	_btnIncrease.type = "button";
	_btnIncrease.value = "+";
	_btnIncrease.style.position = "absolute";
	_btnIncrease.className = "inputCtrlButton";
	_btnIncrease.hideFocus = true;
	_btnIncrease.onmousedown = function(){doIRStart(true)};
	_btnIncrease.onmouseup = function(){doIRStop()};
	
	_btnBack.type = "button";
	_btnBack.value = "还原";
	_btnBack.style.position = "absolute";
	_btnBack.className = "inputCtrlButton";
	_btnBack.hideFocus = true;
	_btnBack.onclick = function(){doRecoverValue()};
	
	_btnOK.type = "button";
	_btnOK.value = "确定";
	_btnOK.style.position = "absolute";
	_btnOK.className = "inputCtrlButton";
	_btnOK.hideFocus = true;
	_btnOK.onclick = function(){doOK()};
	
	_labUnit.style.position = "absolute";
	
	_labUnit.className = "inputCtrlUnit";
	
	_ctrl.style.zIndex = 99;
	_ctrl.style.position = "absolute";
	_ctrl.className = "inputCtrl";
	
	_ctrl.appendChild(_txtInput);
	_ctrl.appendChild(_labUnit);
	_ctrl.appendChild(_btnReduce);
	_ctrl.appendChild(_btnIncrease);
	_ctrl.appendChild(_btnBack);
	_ctrl.appendChild(_btnOK);
	
	this.setOriValue = function(oriValue)
	{
		_oriValue = oriValue
	}
	
	this.setCurrentValue = function(value)
	{
		_currentValueBackup = value;
		_txtInput.value = value;
	}
	
	this.setValueChanged = function(isValueChanged)
	{
		_btnBack.disabled = (!isValueChanged);
	}
	
	this.getCurrentValue = function()
	{
		var value = parseFloat(_txtInput.value);
		if(value || value == 0)
		{
			return value;
		}
		return _currentValueBackup;
	}
	
	this.setCallBack = function(fun)
	{
		_callBackFun = fun
	}
	
	this.init = function()
	{
		_txtInput.focus();
		var r = _txtInput.createTextRange(); 
		r.collapse(false); 
		r.select(); 
	}
	
	this.getCtrl = function(iWidth, sUnit)
	{
		var labUnitWidth = 0;
		var labUnitHeight;
		if(sUnit)
		{
			_labUnit.innerText = sUnit;
			_ctrl.removeChild(_labUnit);
			document.body.appendChild(_labUnit);
			labUnitWidth = _labUnit.offsetWidth;
			labUnitHeight = _labUnit.offsetHeight;
			document.body.removeChild(_labUnit);
			_ctrl.appendChild(_labUnit);
		}
		
		var allWidth = iWidth + labUnitWidth;
		if(allWidth < 80)//和View的VarItemWidth一致会好看
		{
			allWidth = 80;
			iWidth = allWidth - labUnitWidth;
		}
		
		//布局 [输入控件][单位]	
		var x = 1;
		var y = 1;
		layoutCtrl(_txtInput, x, y, iWidth, INPUT_HEIGHT);
		
		if(sUnit)
		{
			x += iWidth;
			var labY = y + (INPUT_HEIGHT - labUnitHeight);// / 2;
			layoutCtrl(_labUnit, x, labY, labUnitWidth, labUnitHeight);
		}
		
		//布局 [-][+]
		var btnWidth = 12;
		x = 1;
		y += INPUT_HEIGHT + 1;
		layoutCtrl(_btnReduce, x, y, btnWidth, BUTTON_HEIGHT);
		
		x += btnWidth;
		layoutCtrl(_btnIncrease, x, y, btnWidth, BUTTON_HEIGHT);
		
		//从后向前布局 [复原][确定]
		var btnWidth = 28;
		x = allWidth - btnWidth + 1;
		layoutCtrl(_btnOK, x, y, btnWidth, BUTTON_HEIGHT);
		
		x = x - btnWidth;
		layoutCtrl(_btnBack, x, y, btnWidth, BUTTON_HEIGHT);
		
		//使容器有背景色，可以盖住下面的内容
		_ctrl.style.width = allWidth + 4;
		_ctrl.style.height = y + BUTTON_HEIGHT + 3;
		return _ctrl;
	}
	
	var layoutCtrl = function(obj, x, y, widht, height)
	{
		obj.style.left = x;
		obj.style.top = y;
		obj.style.width = widht;
		obj.style.height = height;
	}
	
	var doIRStart = function(bIncrease)
	{
		//先来一次，停一会再……
		doIncreaseOrReduce(bIncrease);
		_timerStop = false;
		_timer = setTimeout(bIncrease ? repeatIncrease : repeatReduce, 500);
	}
	
	var doIRStop = function()
	{
		if(_timer)
		{
			clearTimeout(_timer);
		}
		_timerStop = true;
	}
	
	var repeatIncrease = function()
	{
		if(!_timerStop)
		{
			doIncreaseOrReduce(true);
			_timer = setTimeout(repeatIncrease, 100);
		}
	}
	
	var repeatReduce = function()
	{
		if(!_timerStop)
		{
			doIncreaseOrReduce(false);
			_timer = setTimeout(repeatReduce, 100);
		}
	}
	
	var doIncreaseOrReduce = function(bIncrease)
	{
		var value = parseFloat(_txtInput.value);
		if(value || value == 0)
		{
			if(bIncrease)
			{
				value++;
			}
			else
			{
				value--;	
			}
			_txtInput.value = value;
		}
	}

	var doKeyPress = function()
	{
		if(event.keyCode == 13)
		{
			doOK();
		}
		else if(event.keyCode == 27)
		{
			doCancel();
		}
	}
		
	var doOK = function()
	{
		_callBackFun(true);
	}
	
	var doRecoverValue = function()
	{
		_txtInput.value = _oriValue;
		_callBackFun(true, true);
	}
	
	var doCancel = function()
	{
		_callBackFun(false);
	}
}

//整棵树的节点展开状态，要传到服务端的
//格式约束：收起节点A \1 收起节点B \1 收起节点C
function getTreeExpandedStatus(treeModel)
{
	//递归
	var lookFor = function(node)
	{
		var result;
		if(!node.isLeaf() && !node.isExpanded())
		{
			result = node.getExtProperty(DUPONT_PKEY_METRIC_ID);
		}
		for(var i = 0, c = node.getChildCount(); i < c; i++)
		{
			var childResult = lookFor(node.getChild(i), result);
			if(childResult)
			{
				if(result)
				{
					result += "\1";
					result += childResult;
				}
				else
				{
					result = childResult;
				}
			}
		}
		return result;
	}
	
	var result = lookFor(treeModel.getRoot());
	return (result ? result : "");
}
