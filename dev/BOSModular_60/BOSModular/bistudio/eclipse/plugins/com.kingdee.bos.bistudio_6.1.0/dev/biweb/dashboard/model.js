//此文件主要定义数据模
var _oModel = new DesignedModel();//数据模


///////////////////////////////////////////////////////////
// 设计时模板的model
///////////////////////////////////////////////////////////

function DesignedModel()
{
	this.oLayoutTable = null;//数据模持有布局大表格，其它所有对象都是它的子
	this.tempIdCount = 0;//减少对不重复ID的试探次数而已
	
	this.aStyles = new Array();//保存时剔除重复的Style
	
	this.bDirty = false;//编辑过未保存为脏，退出时需要提示保存
	this.sBackgroundPic;//背景图片
	this.sBackgroundScale;//图片布局方式
	this.sBackgroundColor;//背景颜色
	this.oVariantsManager = new SqlVariantsManager(webUtilServlet);//SqlVariants的集合
	this.oSwitchableCtrlsManager = new SwitchableCtrlsManager();//可切换组件的集合
    
	this.oLimited = {iMaxRows:20, iMaxCols:20};//限制表格最多行列数
   
}

DesignedModel.prototype.isDirty = function()
{
	return this.bDirty;
}

DesignedModel.prototype.setDirty = function(b)
{
	this.bDirty = b;
}

DesignedModel.prototype.search = function()
{
	//由于给Html对象加了dashbroad_model自定义属性，拿到UI，直接就得到model。居然不需要此接口了！
}

DesignedModel.prototype.distributeUid = function(sPrefix)
{
	while(true)
	{
		var sId = sPrefix + (this.tempIdCount++);
		var bExist = false;
		if(this.oLayoutTable == null)
		{
			//OK
		}
		else if(this.oLayoutTable.sUid == sId)
		{
			bExist = true;
		}
		else
		{
			var aChildren = this.oLayoutTable.aChildren;
			for(i = 0; i < aChildren.length; i++)
			{
				var vChild = aChildren[i];
				if(vChild.getUID() == sId)
				{
					bExist = true;
					break;
				}
			}
			if(!bExist)
			{
				var switchArea = this.oSwitchableCtrlsManager;
				var icount = switchArea.getCellsCount();
				for(i=0;i<icount;i++)
				{
					var vChild = switchArea.getCell(i);
					if(vChild.getUID() == sId)
					{
						bExist = true;
						break;
					}
				}
			}
		}
		
		if(!bExist)
		{
			return sId;
		}
	}
}

DesignedModel.prototype.buildUI = function(oParentHtml)
{
	var oTable = this.oLayoutTable.createUI();
	oParentHtml.innerHTML = "";
	oParentHtml.appendChild(oTable);
	//以下由于有document的搜索，必须在add进parent之后
	for(var i = 0; i < this.oLayoutTable.aChildren.length; i++)
	{
		var oCell = this.oLayoutTable.aChildren[i];
		var oTD = document.getElementById(oCell.oLayout.getUID());
		if(oTD != null)
		{
			oTD.innerHTML = "";
			oTD.appendChild(oCell.createUI());
		}
	}
}

DesignedModel.prototype.isEmpty = function(){
     var obj=this.oLayoutTable;
     if(obj==null){
        return true;
     }else{
        return false;
     }
}
DesignedModel.prototype.save = function()
{   
	var objNames=new Array();
	this.aStyles = new Array();
	var sContents = '<Contents>';
	for(var i = 0; i < this.oLayoutTable.aChildren.length; i++)
	{
		var sCell = this.oLayoutTable.aChildren[i].toXml(this);
		//判断对象名是否重复
		for(var y=0;y<objNames.length;y++){
		   var name=objNames[y];
		   if(name!=null && name.length>0 && this.oLayoutTable.aChildren[i].name==name){
		      alert("对象名["+name+"]不能重复!");
		      return "duplicate";
		   }
		}
		if(this.oLayoutTable.aChildren[i].name!=null && this.oLayoutTable.aChildren[i].name.length>0){
		   objNames.push(this.oLayoutTable.aChildren[i].name);
		}
		sContents += sCell;
	}
	sContents += '</Contents>';
	
	var sExtContents = '<ExtContents>';
	for(var i = 0; i < this.oSwitchableCtrlsManager.getCellsCount(); i++)
	{
		var sCell = this.oSwitchableCtrlsManager.getCell(i).toXml(this);
		sExtContents += sCell;
	}
	sExtContents += '</ExtContents>';

	//Contents必须先于Styles
	var sStyles = '<Styles>';
	for(var i = 0; i < this.aStyles.length; i++)
	{
		var sStyle = this.aStyles[i].toXml();
		sStyles += sStyle;
	}
	sStyles += '</Styles>';
	
	var sLayoutTable = this.oLayoutTable.toXml();
	var sLayout = '<Layout width="' + this.oLayoutTable.getWidth() 
		+ '" height="'+ this.oLayoutTable.getHeight() + '">'
	sLayout += sLayoutTable;
	sLayout += '</Layout>';

	var sBackground = '<Background';
	if(this.sBackgroundColor)
	{
		sBackground += ' color="' + this.sBackgroundColor + '"';
	}
	if(this.sBackgroundPic)
	{
		if(this.sBackgroundScale)
		{
			sBackground += ' scale="' + this.sBackgroundScale + '"';
		}
		sBackground += '>';
		sBackground += this.sBackgroundPic;
	}
	else
	{
		sBackground += '>';
	}
	sBackground += '</Background>';
	var pageScript = SubScriptEngine.Runtime.ScriptManager.getScript( SubScriptEngine.Runtime.getCurrentPage() );
	var sScript = pageScript ? ( "<Script><![CDATA[" + pageScript + "]]></Script>" ) : "";
	var sPage = '<Page>' + sBackground + sScript + '</Page>';

	var sVariants = this.oVariantsManager.toXml();
	
	var sXml = '<DashBoard version="1.0">' + DataSource.toXml() + sStyles 
		+ sContents + sExtContents + sVariants + sLayout + sPage + '</DashBoard>';
	
	this.setDirty(false);
	return sXml;
}

DesignedModel.prototype.load = function(sXml)
{
	var oDom = this.getDom(sXml);
	var oDomRoot = oDom.firstChild;
	if(!oDomRoot || oDomRoot.tagName != "DashBoard")
	{
		alert("加载内容不是仪表板模板文件。");
		return;
	}

	var oDomStyles = getDomChildNode(oDomRoot, "Styles");
	var oDomContents = getDomChildNode(oDomRoot, "Contents");
	var oDomExtContents = getDomChildNode(oDomRoot, "ExtContents");
	var oDomLayout = getDomChildNode(oDomRoot, "Layout");
	var oPage = getDomChildNode(oDomRoot, "Page");
	
	var datasources = getDomChildNode(oDomRoot, "DataSources");
	if (datasources) {
		DataSource.createInstancesFromXml(datasources);
	}
	
	var oVariants = getDomChildNode(oDomRoot, "Variants");
	/*
	var Table  = getDomChildNode(oDomLayout, "Table");
	_oModel.MergeBlocks= getDomChildNode(Table, "MergeBlocks");
	*/
	if(oVariants)
	{
		this.oVariantsManager.fromXml(oVariants);
	}
	
	if(oPage)
	{
		var oBackground = getDomChildNode(oPage, "Background");
		var sColor = oBackground.getAttribute("color");
		_oModel.sBackgroundColor = (sColor ? sColor : null);
		var sScale = oBackground.getAttribute("scale");
		_oModel.sBackgroundScale = (sScale ? sScale : null);
		_oModel.sBackgroundPic = (oBackground.text ? oBackground.text : null);
		var oScript = getDomChildNode(oPage, "Script");
		if ( oScript ) {
			SubScriptEngine.Runtime.ScriptManager.setScript( SubScriptEngine.Runtime.getCurrentPage(), oScript.text );
		}
	}	
	
	_oDesignArea.setSize(
			parseInt(oDomLayout.getAttribute("width")), 
			parseInt(oDomLayout.getAttribute("height")));

	//Styles - Contents - Layout 的解析顺序不能颠倒
	this.aStyles = new Array();
	for(var i = 0; i < oDomStyles.childNodes.length; i++)
	{
		var oStyle = new Style();
		oStyle.fromXml(oDomStyles.childNodes[i]);
		this.aStyles.push(oStyle);
	}

	var aCells = new Array();
	for(var i = 0; i < oDomContents.childNodes.length; i++)	
	{
		var oDomCell = oDomContents.childNodes[i];
		var sType = oDomCell.getAttribute("type");
		var sStyle = oDomCell.getAttribute("style");
		var oStyle;
		if(sStyle)
		{
			oStyle = this.getStyleById(sStyle);
			if(oStyle)
			{
				oStyle = oStyle.clone();
			}
		}
		var oCell = cellFactory(sType);
		oCell.fromXml(oDomCell, oStyle);
		
		aCells.push(oCell);
	}
	
	var oDomTable = oDomLayout.childNodes[0];
	this.oLayoutTable = new LayoutTable();
	this.oLayoutTable.fromXml(oDomTable, aCells);
	this.oLayoutTable.setSizeChangedListener(function(iWidth, iHeight)
		{
			_oDesignArea.setSize(iWidth, iHeight);
		});

	if ( oDomExtContents ) {
		for(var i = 0; i < oDomExtContents.childNodes.length; i++)	
		{
			var oDomCell = oDomExtContents.childNodes[i];
			var sType = oDomCell.getAttribute("type");
			var sStyle = oDomCell.getAttribute("style");
			var oStyle;
			if(sStyle)
			{
				oStyle = this.getStyleById(sStyle);
				if(oStyle)
				{
					oStyle = oStyle.clone();
				}
			}
			var oCell = cellFactory(sType);
			oCell.fromXml(oDomCell, oStyle);
			
			this.oSwitchableCtrlsManager.addCell(oCell);
		}
	}
		
	this.buildUI(_oDesignArea.oHtmlDesignContainer);
	this.oSwitchableCtrlsManager.syncUI();
}

DesignedModel.prototype.getDom = function(sXml)
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


//该函数在保存的时候，把对象的style不重复地保留下来，同时给对象返回一个Style的ID
DesignedModel.prototype.getStoreStyleId = function(oStyle)
{
	for(var i = this.aStyles.length - 1; i >= 0; i--)
	{
		if(this.aStyles[i].equals(oStyle))
		{
			return this.aStyles[i].sUID;
		}
	}
	
	var sNewId = "style" + this.aStyles.length;
	oStyle.sUID = sNewId;
	this.aStyles.push(oStyle);
	return sNewId;
}

DesignedModel.prototype.getStyleById = function(sId)
{
	for(var i = this.aStyles.length - 1; i >= 0; i--)
	{
		if(this.aStyles[i].sUID == sId)
		{
			return this.aStyles[i];
		}
	}
	return null;
}

DesignedModel.prototype.getAllCells = function()
{
	var cells = new Array();
	for(var i=0;i<this.oLayoutTable.aChildren.length;i++)
		cells.push(this.oLayoutTable.aChildren[i]);
	var len = this.oSwitchableCtrlsManager.getCellsCount();
	for(var i=0;i<len;i++)
		cells.push(this.oSwitchableCtrlsManager.getCell(i));
	
	return cells;
}

//////////////////////////////////////////////////////////
// 以下定义可切换组件的内容
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// Class 可切换组件管理
function SwitchableCtrlsManager()
{
	var aSwitchableCtrls = new Array();//可切换组件

	this.addCell = function(oCell)
	{
		oCell.clearLayout();
		aSwitchableCtrls.push(oCell);
		
		var name = oCell.name;
		if ( name ) {
			var instance = SubScriptEngine.Runtime.evalDial( oCell.type || oCell.sType, name );
			oCell.iid = instance.iid;
			var ha = SubScriptEngine.Runtime.getCurrentHiddenArea();
			ha.push( instance );
			oCell.tdIID = ha.iid;
			if ( oCell.lastScript ) {
				SubScriptEngine.Runtime.ScriptManager.setScript( instance, oCell.lastScript );
			}
		}
	}

	this.removeCell = function(oCell)
	{
		if ( oCell.name ) {
			var instance = SubScriptEngine.Runtime.NameManager.lookupIID( oCell.iid );
			var ha = SubScriptEngine.Runtime.getCurrentHiddenArea();
			var index = _.indexOf( ha, function( x ) {
				return x == instance;
			} );
			ha.splice( index, 1 );
			SubScriptEngine.Runtime.NameManager.unregister( instance.iid );
		}
		
		for(var i = 0; i < aSwitchableCtrls.length; i++)
		{
			if(aSwitchableCtrls[i] == oCell)
			{
				aSwitchableCtrls.splice(i, 1);//从i开始，删除1个元素
				break;
			}
		}
	}

	this.getCellsCount = function()
	{
		return aSwitchableCtrls.length;
	}
	
	this.getCell = function(iIndex)
	{
		return aSwitchableCtrls[iIndex];
	}
	
	this.syncUI = function()
	{
		var oParentHtml = _oDesignArea.oHtmlSwitchableArea;
		oParentHtml.innerHTML = "";
		if(aSwitchableCtrls.length == 0)
		{
			return;
		}
		
		var iUnitLength = 80;//每个单元对象的边长
		var iRows = 1;//将布局多少行
		var iMaxCols;//按当前对象边长，最多可布局多少列
		var bFirst = true;
		do
		{
			if(!bFirst)
			{
				iUnitLength /= 2;
				iRows *= 2;
			}
			bFirst = false;
			//+4 = (spacing 1 padding 1) * 2
			iMaxCols = Math.floor(oParentHtml.clientWidth / (iUnitLength + 4)) - 1;
			var iMaxCells = iRows * iMaxCols;
		}
		while (iMaxCells < aSwitchableCtrls.length)
		
		var oTableWrap = _.table("", oParentHtml);
		var oTable = oTableWrap.table;//这个才是HTML的<Table>
		oTable.border = 0;
		oTable.cellSpacing = 1;
		oTable.cellPadding = 1;
		oTable.style.height = (iUnitLength + 4) * Math.ceil(aSwitchableCtrls.length / iMaxCells);
		var oTr;
		for(var i = 0; i < aSwitchableCtrls.length; i++)
		{
			if(i % iMaxCols == 0)
			{
				oTr = _.crt("tr", null, oTable.firstChild);
			}
			var oTd = _.crt("td", null, oTr);
			var oDiv = aSwitchableCtrls[i].createUI();
			oTd.appendChild(oDiv);
			oDiv.style.width = iUnitLength;
			oDiv.style.height = iUnitLength;
		}
	}
}


///////////////////////////////////////////////////////////
// 以下定义变量相关的内容
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// Class 一个SQL变量
function SqlVariants(sId, sDesc, sSql)
{
	this.sId = sId;
	this.sDescription = sDesc;
	this.sSql = sSql;
}

SqlVariants.prototype.clone = function()
{
	var newInst = new SqlVariants(this.sId, this.sDescription, this.sSql);
	return newInst;
}

SqlVariants.prototype.toXml = function()
{
	var sXml = '<Sql name="' + this.sId + '">'
		+ '<Description><![CDATA[' + this.sDescription + ']]></Description>'
		+ '<Content><![CDATA[' + this.sSql + ']]></Content>'
		+ '</Sql>';		
	return sXml;
}

SqlVariants.prototype.fromXml = function(oDom)
{
	this.sId = oDom.getAttribute("name");	
	this.sDescription = getDomChildText(oDom, "Description", "");
	this.sSql = getDomChildText(oDom, "Content", "");
}

///////////////////////////////////////////////////////////
// Class SQL变量管理
function SqlVariantsManager(webUtilServlet)
{
	this.aVariants = new Array();
	this.webUtilServlet = webUtilServlet;
}

SqlVariantsManager.prototype.size = function()
{
	return this.aVariants.length;
}

SqlVariantsManager.prototype.get = function(iIdx)
{
	return this.aVariants[iIdx];
}

SqlVariantsManager.prototype.clear = function()
{
	this.aVariants.length = 0;
}

SqlVariantsManager.prototype.addModel = function(oModel)
{
	this.aVariants[this.size()] = oModel;	
}

SqlVariantsManager.prototype.add = function(sId, sDesc, sSql)
{
	this.aVariants[this.size()] = this.createOneModel(sId, sDesc, sSql);
}

SqlVariantsManager.prototype.createOneModel = function(sId, sDesc, sSql)
{
	var oModel = new SqlVariants(sId, sDesc, sSql);
	return oModel;
}

SqlVariantsManager.prototype.toXml = function()
{
	var sXml = '<Variants>'
	for(var i = 0; i < this.size(); i++)
	{
		sXml += this.get(i).toXml();
	}
	sXml += '</Variants>';
	return sXml;
}

SqlVariantsManager.prototype.fromXml = function(oDom)
{
	this.clear();
	for(var i = 0; i < oDom.childNodes.length; i++)	
	{
		var oDomSql = oDom.childNodes[i];
		var oModel = this.createOneModel();
		oModel.fromXml(oDomSql);
		this.addModel(oModel);
	}
}

SqlVariantsManager.prototype.getServletURL = function()
{
	return this.webUtilServlet;
}

function DataSource(param) {
	this.param = param;
	// 构造数据源自动添加到实例池中
	DataSource.dsInstances.push( this );
	var ds = new SubScriptEngine.Types.Datasource( param.name );
	SubScriptEngine.Runtime.Dashboard.Datasources.push( ds );
	this.param.iid = ds.iid;
}

_.extend( DataSource, {
	dsInstances: [],
	// 全部数据源xml化
	toXml: function() {
		return _.format( "<DataSources>%s</DataSources>", _.map(this.dsInstances, function( ds ) {
			return ds.toXml();
		} ).join("") );
	},
	getInstancesByName: function( name ) {
		return _.collect( this.dsInstances, function( inst ) {
			return inst.param.name == name;
		} );
	},
	// 从xml节点中实例化全部仪表板数据源，避免重复实例化，本方法只有执行第一次有效
	createInstancesFromXml: function(dom) {
		_.map( dom.childNodes, function( ds ) {
			var datasource = new DataSource( {
				name: ds.getAttribute("name"),
				type: ds.getAttribute("type"),
				datacenter: ds.getAttribute("datacenter"),
				saveLocation: "dashboard",
				maxRowCount: ds.getAttribute("maxRowCount"),
				content: getDomChildNode(ds, "Content").text,
				description: getDomChildNode(ds, "Description").text,
				outputColumns: _.map( getDomChildNode(ds, "OutputColumns").childNodes, function( oc ) {
					return {
						column: oc.getAttribute("column"),
						alias: oc.getAttribute("alias"),
						type: oc.getAttribute("type")
					};
				} )
			} );
			return datasource;
		} );
		DataSource.createInstancesFromXml = _.Z;
	},
	/*
	 * 返回包含本仪表板数据源和存储库数据源的树实例
	 * param = {
	 * 		parent: (DOM) 树的父节点（容器）
	 * 		isFolderSelected: (boolean) 是否允许目录可选（仪表板数据源目录总是不可选）
	 * 		dashboardNodeClick: (function) 仪表板节点点击钩子
	 * 		dashboardNodeDblclick: (function) 双击钩子
	 * 		repositoryNodeClick: (function) 存储库节点点击钩子
	 * 		repositoryNodeDblclick: (function) 双击钩子
	 * }
	 */
	getAllDataSourceTree: function( param ) {
		var tree = Sue.ui.tree( {
			parent: param.parent,
			caption: "数据源",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "database" );
			}
		} ),
			Node = tree.getNodeConstructor(),
			dashboardRoot = Node( {
				caption: "仪表板数据源",
				folder: true,
				isRoot: true
			} );
		tree.setRoot( dashboardRoot );
		_.map(this.dsInstances, function( ds ) {
			dashboardRoot.append( Node( {
				caption: ds.param.name,
				click: param.dashboardNodeClick,
				dblclick: param.dashboardNodeDblclick || null,
				ds: ds
			} ) );
		});
		dashboardRoot.expand();
		/*
		 * 屏蔽存储库共享
		var repositoryNode = Node( {
			caption: "存储库数据源",
			folder: true,
			isRoot: true,
			click: param.isFolderSelected ? _.Z : null
		} );
		tree.setRoot( repositoryNode );
		// 存储库的数据源从服务端查询而来
		_.post( {
			url: webUtilServlet,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				action: "getAllRepositoryDataSources"
			},
			callback: function( r ) {
				repositoryNode.append( _.map( r.split("\1"), function( s ) {
					var m = s.match( /^(.*?)\u0002(.*)$/ );
					return Node( {
						caption: m[1],
						dsPath: m[2],
						click: param.repositoryNodeClick,
						dblclick: param.repositoryNodeDblclick || null
					} );
				} ) );
			}
		} );
		*/
		return tree;
	}
} );

DataSource.prototype = {
	isDashboardDataSource: true,
	// 本数据源xml化
	toXml: function() {
		var a = [];
		a.push( _.format( "<DataSource type=\"%s\" name=\"%s\" datacenter=\"%s\" maxRowCount=\"%s\">", this.param.type, this.param.name,this.param.datacenter&&!this.param.datacenter==""?this.param.datacenter:"", this.param.maxRowCount ) );
		a.push( _.format( "<Content><![CDATA[%s]]></Content>", this.param.content ) );
		a.push( _.format( "<Description><![CDATA[%s]]></Description>", this.param.description ) );
		a.push( _.format( "<OutputColumns>%s</OutputColumns>", _.map(this.param.outputColumns, function( c ) {
			return _.format( "<OutputColumn column=\"%s\" alias=\"%s\" type=\"%s\"/>", c.column, c.alias, c.type );
		} ).join("") ) );
		a.push( "</DataSource>" );
		return a.join("");
	},
	destroy: function() {
		var index = _.indexOf( DataSource.dsInstances, this );
		DataSource.dsInstances.splice( index, 1 );
		this.param = null;
	}
};

///////////////////////////////////////////////////////////
// 以下定义布局表格对象
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// Class 布局表格的数据模
function LayoutTable(iRows, iCols)
{
	this.sUid = _oModel.distributeUid("table");
	this.iRows = 0;//行数
	this.iCols = 0;//列数
	this.aRowHeights = new Array();//行高
	this.aColWidths = new Array();//列宽
	this.aChildren = new Array();//直接放单元对象，注意没有行、列、单元格
	this.aMergeBlocks = new Array();//融合块
	this.aListeners = [];//事件
	this.aGridsInfos = [];//单元格的属性,区别于单元对象Cell,用Grid表示单元格
	
	this.setRows(iRows);
	this.setCols(iCols);
}

LayoutTable.prototype.setRows = function(iRows)
{
	if(iRows < this.iRows)//行数变小
	{
		//干掉位于缩减部分的子对象
		for(var i = this.aChildren.length - 1; i >= 0; i--)
		{
			var oChildLayout = this.aChildren[i].oLayout;
			if(oChildLayout.iRowIdx >= iRows)
			{
				this.aChildren.splice(i, 1);
			}
		}
		//干掉跨到缩减部分的融合块
		for(var i = this.aMergeBlocks.length - 1; i >= 0; i--)
		{
			var oMb = this.aMergeBlocks[i];
			if(oMb.iBottom >= iRows)
			{
				this.aMergeBlocks.splice(i, 1);
			}
		}
	}
	this.iRows = iRows;
	if(iRows > this.aRowHeights.length)
	{
		for(var i = this.aRowHeights.length; i < iRows; i++)
		{
			this.aRowHeights[i] = 20;//置缺省初始行高
		}
	}
	else if(iRows < this.aRowHeights.length)
	{
		this.aRowHeights.splice(iRows, this.aRowHeights.length - iRows);
		this.aGridsInfos.splice(iRows, this.aGridsInfos.length - iRows);
	}
}

LayoutTable.prototype.setCols = function(iCols)
{
	if(iCols < this.iCols)//列数变小
	{
		for(var i = this.aChildren.length - 1; i >= 0; i--)
		{
			var oChildLayout = this.aChildren[i].oLayout;
			if(oChildLayout.iColIdx >= iCols)
			{
				this.aChildren.splice(i, 1);
			}
		}
		for(var i = this.aMergeBlocks.length - 1; i >= 0; i--)
		{
			var oMb = this.aMergeBlocks[i];
			if(oMb.iRight >= iCols)
			{
				this.aMergeBlocks.splice(i, 1);
			}
		}
	}
	this.iCols = iCols;
	if(iCols > this.aColWidths.length)
	{
		for(var i = this.aColWidths.length; i < iCols; i++)
		{
			this.aColWidths[i] = 100;
		}
	}
	else if(iCols < this.aColWidths.length)
	{
		this.aColWidths.splice(iCols, this.aColWidths.length - iCols);
		for(var i = 0; i < this.aGridsInfos.length; i++)
		{
			this.aGridsInfos[i].splice(iCols, this.aGridsInfos[i].length - iCols);
		}
	}	
}

LayoutTable.prototype.getGridInfo = function(iRowIdx, iColIdx) 
{
	var aRowInfos = this.aGridsInfos[iRowIdx];
	if(aRowInfos)
	{
		return aRowInfos[iColIdx];
	}
	return null;
}

LayoutTable.prototype.setGridInfo = function(iRowIdx, iColIdx, oInfo)
{
	var aRowInfos = this.aGridsInfos[iRowIdx];
	if(!aRowInfos)
	{
		aRowInfos = this.aGridsInfos[iRowIdx] = [];
	}
	aRowInfos[iColIdx] = oInfo;
}

//将当前对象的UI作为传入parent的唯一子
LayoutTable.prototype.createUI = function()
{
	var oTable = document.createElement("table");
	oTable.id = this.sUid;
	oTable.dashboard_model = this;
	
	oTable.cellSpacing = "0";
	oTable.cellPadding = "0";
	oTable.style.backgroundColor = "#EEE";
	oTable.style.width = "100%";
	oTable.style.height = "100%";
	oTable.style.tableLayout = "fixed";//表格不会被内容撑大
	
	// 在表格上点击delete键删除某单元格内容
	_.bindEvent(oTable, "keydown", function( e ) {
		if (e.keyCode == 46) {
			_delete();
		}
	});
	
	this.updateUI(oTable);
	return oTable;
}

LayoutTable.prototype.getRowUid = function(iRowIdx)
{
	return this.sUid + "_" + iRowIdx;
}

LayoutTable.prototype.getColUid= function(iColIdx)
{
	return this.sUid + "_x_" + iColIdx;
}

LayoutTable.prototype.updateUI = function(oTable)
{
	var oColgroup = document.createElement("COLGROUP");
	oTable.appendChild(oColgroup);
	for(var j = 0; j < this.iCols; j++)
	{
		//创建列定义,设置列宽
		var oCol = document.createElement("col");
		oCol.id = this.getColUid(j);
		oCol.width = this.getColWidth(j);
		oColgroup.appendChild(oCol);

		//作为可拖动分隔线的小列
		var oCol = document.createElement("col");
		oCol.width = 2;
		oColgroup.appendChild(oCol);
	}
	
	var oTbody = document.createElement("TBODY");
	oTable.appendChild(oTbody);

	var thisInst = this;
	for(var i = 0; i < this.iRows; i++)
	{
		//创建行,设置行高
		var oTR = document.createElement("tr");
		oTR.id = this.getRowUid(i);
		oTR.height = this.getRowHeight(i);
		oTbody.appendChild(oTR);

		for(var j = 0; j < this.iCols; j++)
		{
			var oTD = document.createElement("td");
			var oLayout = new Layout(this, i, j);
			oLayout.updateBorder(oTD);
			oTD.dashboard_model = oLayout;
			oTD.id = oLayout.getUID();
			oTD.style.padding = 5;
			oTD.style.fontSize = 10;
			oTD.vAlign = "top";
			oTD.align = "left";
			oTD.innerHTML = "&nbsp";
			oTD.onclick = function(){thisInst.onClick()};
			oTR.appendChild(oTD);
			
			//作为可拖动分隔线的小列
			var oTD = document.createElement("td");
			oTD.name = "betweenCol";
			oTD.dashboard_between = j;
			oTD.style.cursor = "e-resize";
			oTD.style.backgroundColor = "#DBDBDB";
			oTD.onmousedown = function(){thisInst.onMouseDown()};	
			oTR.appendChild(oTD);
		}
		
		//作为可拖动分隔线的小行
		var oTrSeparator = document.createElement("tr");
		oTrSeparator.height = 2;
		oTbody.appendChild(oTrSeparator);
		for(var j = 0; j < this.iCols; j++)
		{
			var oTD = document.createElement("td");
			oTD.name = "betweenRow";
			oTD.dashboard_between = i;
			oTD.style.cursor = "n-resize";
			oTD.style.backgroundColor = "#DBDBDB";
			oTD.onmousedown = function(){thisInst.onMouseDown()};
			oTrSeparator.appendChild(oTD);

			//小行、小列交叉的小块
			var oTD = document.createElement("td");
			oTD.name = "betweenRow";
			oTD.dashboard_between = i;
			oTD.style.cursor = "n-resize";
			oTD.style.backgroundColor = "#DBDBDB";
			oTD.onmousedown = function(){thisInst.onMouseDown()};
			oTrSeparator.appendChild(oTD);
		}
	}
	//没有单元格数据模，采用先创建TD，再按融合块信息给rowSpan、colSpan，并干掉多余的TD
	this.mergeTd(oTbody);
}

LayoutTable.prototype.mergeTd = function(oTbody)
{
	//注意此时的表格已包含了分隔线小行列，所以有*2
	for(var i = 0; i < this.aMergeBlocks.length; i++)
	{
		var mb = this.aMergeBlocks[i];
		var rowSpan = mb.rowSpan() * 2 - 1;
		var colSpan = mb.colSpan() * 2 - 1;
		for(var r = mb.iTop * 2; r <= mb.iBottom * 2; r++)
		{
			var oTr = oTbody.children[r];
			for(var c = mb.iLeft * 2; c <= mb.iRight * 2; c++)
			{
				var oTd = oTr.children[c];
				if(mb.isMainCell(r / 2, c / 2))
				{
					if(rowSpan > 1)
					{
						oTd.rowSpan = rowSpan;
					}
					if(colSpan > 1)
					{
						oTd.colSpan = colSpan;
					}
				}
				else
				{
					oTd.dashboard_toRemove = true;
				}
			}
		}
	}
	for(var r = oTbody.children.length - 1; r >= 0; r--)
	{
		var oTr = oTbody.children[r];
		for(var c = oTr.children.length - 1; c >= 0; c--)
		{
			var oTd = oTr.children[c];
			if(oTd.dashboard_toRemove)
			{
				oTr.removeChild(oTd);
			}
		}
	}
}

LayoutTable.prototype.addMergeBlock = function(iTop, iLeft, iBottom, iRight)
{   
	var mb = new MergeBlock(iTop, iLeft, iBottom, iRight);
	this.aMergeBlocks.push(mb);
}

LayoutTable.prototype.removeMergeBlock = function(oMergeBlock)
{
	for(var i = this.aMergeBlocks.length - 1; i >= 0; i--)
	{
		var mb = this.aMergeBlocks[i];
		if(mb.iTop == oMergeBlock.iTop && mb.iBottom == oMergeBlock.iBottom
			&& mb.iLeft == oMergeBlock.iLeft && mb.iRight == oMergeBlock.iRight)
		{
			this.aMergeBlocks.splice(i, 1);
			return;
		}
	}
}

LayoutTable.prototype.onClick = function()
{
	var oHtml = event.srcElement;
	var oModel = oHtml.dashboard_model;
	_oSelectionModel.addSelectedOperate(oModel, event);
	event.cancelBubble = true;
}

LayoutTable.prototype.onMouseDown = function()
{
	var sName = event.srcElement.name;
	if(sName == "betweenRow" || sName == "betweenCol")
	{
		var iIdx = event.srcElement.dashboard_between;
		var bCtrlPress;
		if((sName == "betweenRow" && iIdx == this.iRows - 1)
			|| (sName == "betweenCol" && iIdx == this.iCols - 1))
		{
			bCtrlPress = true;//拖最后一行（列）时强行置为按下[ctrl]逻辑
		}
		else
		{
			bCtrlPress = event.ctrlKey;
		}
		var oMs = new MouseState_DragRowCol((sName == "betweenRow"), this, iIdx, event, bCtrlPress);
		_oDesignArea.setMouseState(oMs);
	}
}

LayoutTable.prototype.toXml = function()
{
	var sXml = '<Table id="' + this.sUid + '"><ColGroup>';
	for(var i = 0; i < this.iCols; i++)
	{
		var sCol = '<Col width="' + this.getColWidth(i) + '"/>';
		sXml += sCol;
	}
	sXml +=	'</ColGroup><TBody>';
	for(var i = 0; i < this.iRows; i++)
	{
		var sTR = '<TR height="' + this.getRowHeight(i) + '">';
		for(var j = 0; j < this.iCols; j++)
		{
			var oCell = this.getChild(i, j);
			var gridInfo = this.getGridInfo(i, j);
			var sTD = '<TD name="' + ( ( gridInfo ? gridInfo.name : "" ) || "" ) + '">';
			if(oCell)
			{
				var sCell = '<Div cell="' + oCell.getUID() + '"/>';
				sTD += sCell;
			}
			sTD += '</TD>';
			sTR += sTD;
		}
		sTR += '</TR>';
		sXml += sTR;
	}
	sXml +=	'</TBody>';
	if(this.aMergeBlocks.length > 0)
	{
		sXml += '<MergeBlocks>';
		for(var i = 0; i < this.aMergeBlocks.length; i++)
		{
			sXml += this.aMergeBlocks[i].toXml();
		}
		sXml += '</MergeBlocks>';
	}
	sXml += '</Table>';
	return sXml;
}

LayoutTable.prototype.fromXml = function(oDomTable, aCells)
{
	var sId = oDomTable.getAttribute("id");
	this.sUid = (sId ? sId : this.sUid);

	var oColGroup = getDomChildNode(oDomTable, "ColGroup");
	var oTBody = getDomChildNode(oDomTable, "TBody");
	var oMergeBlocks = getDomChildNode(oDomTable, "MergeBlocks");
	
	this.iCols = oColGroup.childNodes.length;
	this.iRows = oTBody.childNodes.length;

	for(var i = 0; i < this.iCols; i++)	
	{
		this.aColWidths[i] = parseInt(oColGroup.childNodes[i].getAttribute("width"));
	}
	for(var i = 0; i < this.iRows; i++)
	{
		var oTR = oTBody.childNodes[i];
		this.aRowHeights[i] = parseInt(oTR.getAttribute("height"));
		for(var j = 0; j < oTR.childNodes.length; j++)
		{
			var oTD = oTR.childNodes[j];
			var tdName = oTD.getAttribute( "name" );
			// 未定义名称取出来的是"undefined"字符串，而不是undefined，这里修正
			if ( tdName == "undefined" ) {
				tdName = undefined;
			}
			this.setGridInfo(i, j, {
				name: tdName
			});
			if ( tdName ) {
				var cells = SubScriptEngine.Runtime.getCurrentCells();
				var cell = new SubScriptEngine.Types.Cell( tdName );
				cells.push( cell );
			} 
			var oDiv = getDomChildNode(oTD, "Div");
			if(oDiv)
			{
				var sCellId = oDiv.getAttribute("cell");
				var oCell;
				for(var k = 0; k < aCells.length; k++)
				{
					if(aCells[k].sUID == sCellId)
					{
						oCell = aCells[k];
						break;
					}
				}
				if(oCell)
				{
					this.addChild(oCell, i, j);
				}
			}
		}
	}
	
	if(oMergeBlocks)
	{
		for(var i = 0; i < oMergeBlocks.childNodes.length; i++)
		{
			var oMb = oMergeBlocks.childNodes[i];
			var iLeft = parseInt(oMb.getAttribute("left"));
			var iRight = parseInt(oMb.getAttribute("right"));
			var iTop = parseInt(oMb.getAttribute("top"));
			var iBottom = parseInt(oMb.getAttribute("bottom"));
			this.addMergeBlock(iTop, iLeft, iBottom, iRight);
		}
	}
}

//给定行列的单元格是否在任一融合块中，是则返回融合块，否则返回空
LayoutTable.prototype.getMergeBlock = function(iRowIdx, iColIdx)
{
	for(var i = 0; i < this.aMergeBlocks.length; i++)
	{
		if(this.aMergeBlocks[i].isInside(iRowIdx, iColIdx))
		{
			return this.aMergeBlocks[i];
		}
	}
	return null;
}

LayoutTable.prototype.setRowHeight = function(iRowIdx, iHeight)
{
	this.aRowHeights[iRowIdx] = iHeight;
	var oTr = document.getElementById(this.getRowUid(iRowIdx));
	if(oTr != null)
	{
		oTr.height = iHeight;
	}
	this.fireSizeChanged();
}

LayoutTable.prototype.getRowHeight = function(iRowIdx)
{
	if(typeof this.aRowHeights[iRowIdx] == "undefined")
	{
		return "";
	}
	return this.aRowHeights[iRowIdx];
}

LayoutTable.prototype.setColWidth = function(iColIdx, iWidth)
{
	this.aColWidths[iColIdx] = iWidth;
	var oCol = document.getElementById(this.getColUid(iColIdx));
	if(oCol != null)
	{
		oCol.width = iWidth;
	}
	this.fireSizeChanged();
}

LayoutTable.prototype.getColWidth = function(iColIdx)
{
	if(typeof this.aColWidths[iColIdx] == "undefined")
	{
		return "";
	}
	return this.aColWidths[iColIdx];
}

//遵循一个单元格最多放一个单元对象的规则，调用者须自行确保参数指定的单元格空着
LayoutTable.prototype.addChild = function(oCell, iRowIdx, iColIdx)
{
	oCell.oLayout.oLayoutTable = this;
	oCell.oLayout.iRowIdx = iRowIdx;
	oCell.oLayout.iColIdx = iColIdx;
	this.aChildren.push(oCell);
	
	//同步UI：
	var oHtml = document.getElementById(oCell.oLayout.getUID());
	if(oHtml != null)
	{
		oHtml.innerHTML = "";
		oHtml.appendChild(oCell.createUI());
	}
	
	var gridInfo = this.getGridInfo(iRowIdx, iColIdx);
	var tdName = gridInfo ? gridInfo.name : "";
	// 恢复交互式组件元素
	if ( tdName ) {
		var cells = SubScriptEngine.Runtime.getCurrentCells();
		var index = _.indexOf( cells, function( x ) {
			return x.name == tdName;
		} );
		var cell = cells[ index ];
		oCell.tdIID = cell.iid;
	}
	var name = oCell.name;
	if ( name ) {
		var instance = SubScriptEngine.Runtime.evalDial( oCell.type || oCell.sType, name );
		oCell.iid = instance.iid;
		if ( tdName ) {
			cell[ name ] = instance;
		} else {
			var anonymousCell = SubScriptEngine.Runtime.getCurrentCells().getAnonymousCell( true );
			anonymousCell[ name ] = instance;
			oCell.tdIID = anonymousCell.iid;
		}
		if ( oCell.lastScript ) {
			SubScriptEngine.Runtime.ScriptManager.setScript( instance, oCell.lastScript );
		}
	}
}

LayoutTable.prototype.removeChild = function(oCell)
{
	var iIdx = -1;
	for(var i = 0; i < this.aChildren.length; i++)
	{
		if(this.aChildren[i] == oCell)
		{
			iIdx = i;
			break;
		}
	}
	
	if(iIdx >= 0)
	{
		if ( oCell.name ) {
			var cell = SubScriptEngine.Runtime.NameManager.lookupIID( oCell.tdIID );
			delete cell[ oCell.name ];
			SubScriptEngine.Runtime.NameManager.unregister( oCell.iid );
		}
		oCell.tdIID = null;
		
		this.aChildren.splice(iIdx, 1);
		
		//同步UI：
		var oHtml = document.getElementById(oCell.oLayout.getUID());
		if(oHtml != null)
		{
			oHtml.innerHTML = "&nbsp";
		}
	}
}

LayoutTable.prototype.getChild = function(iRowIdx, iColIdx)
{
	for(var i = 0; i < this.aChildren.length; i++)
	{
		oCell = this.aChildren[i];
		if(oCell.oLayout.iRowIdx == iRowIdx && oCell.oLayout.iColIdx == iColIdx)
		{
			return oCell;
		}
	}
	return null;
}

//取表格的宽度，是各列宽度的和
//从第iIdxFrom列到第iIdxTo列，可省略，为整个表格。
LayoutTable.prototype.getWidth = function(iIdxFrom, iIdxTo)
{
	if(iIdxFrom == undefined || iIdxTo == undefined)
	{
		iIdxFrom = 0;
		iIdxTo = this.aColWidths.length - 1;
	}
	var iWidth = 0;
	for(var i = iIdxFrom; i <= iIdxTo; i++)
	{
		iWidth += this.aColWidths[i];
	}
	return iWidth;
}

//设置表格宽度，变化量按比例分给各列
//从第iIdxFrom列到第iIdxTo列，用于处理融合块；也可省略，为整个表格。
LayoutTable.prototype.setWidth = function(iWidth, iIdxFrom, iIdxTo)
{
	if(iIdxFrom == undefined || iIdxTo == undefined)
	{
		iIdxFrom = 0;
		iIdxTo = this.aColWidths.length - 1;
	}
	var iOldWidth = this.getWidth(iIdxFrom, iIdxTo);
	var iDelta = iWidth - iOldWidth;
	if(iDelta == 0)
	{
		return;
	}
	//前N-1列按比例分，运算取整，最后一列分剩余的
	var iAdd = 0;
	for(var i = iIdxFrom; i < iIdxTo; i++)
	{
		var iColAdd = Math.floor(this.aColWidths[i] / iOldWidth * iDelta);
		this.aColWidths[i] += iColAdd;
		iAdd += iColAdd;
	}
	this.aColWidths[iIdxTo] += (iDelta - iAdd);
	this.fireSizeChanged();
}

//取表格的高度，是各行高度的和
//从第iIdxFrom行到第iIdxTo行，可省略，为整个表格。
LayoutTable.prototype.getHeight = function(iIdxFrom, iIdxTo)
{
	if(iIdxFrom == undefined || iIdxTo == undefined)
	{
		iIdxFrom = 0;
		iIdxTo = this.aRowHeights.length - 1;
	}
	var iHeight = 0;
	for(var i = iIdxFrom; i <= iIdxTo; i++)
	{
		iHeight += this.aRowHeights[i];
	}
	return iHeight;
}

//设置表格的高度，变化量按比例分给各行
//从第iIdxFrom行到第iIdxTo行，用于处理融合块；也可省略，为整个表格。
LayoutTable.prototype.setHeight = function(iHeight, iIdxFrom, iIdxTo)
{
	if(iIdxFrom == undefined || iIdxTo == undefined)
	{
		iIdxFrom = 0;
		iIdxTo = this.aRowHeights.length - 1;
	}
	var iOldHeight = this.getHeight(iIdxFrom, iIdxTo);
	var iDelta = iHeight - iOldHeight;
	if(iDelta == 0)
	{
		return;
	}
	//前N-1行按比例分，运算取整，最后一行分剩余的
	var iAdd = 0;
	for(var i = iIdxFrom; i < iIdxTo; i++)
	{
		var iRowAdd = Math.floor(this.aRowHeights[i] / iOldHeight * iDelta);
		this.aRowHeights[i] += iRowAdd;
		iAdd += iRowAdd;
	}
	this.aRowHeights[iIdxTo] += (iDelta - iAdd);
	this.fireSizeChanged();
}

//在指定位置前或后插入行，返回新行index
LayoutTable.prototype.insertRow = function(iRowIdx, bBefore, iRowHeight)
{
	var iInsertIdx = (bBefore ? iRowIdx : iRowIdx + 1);
	//行数加一
	this.iRows++;
	//插入行高值
	this.aRowHeights.splice(iInsertIdx, 0, iRowHeight);
	//调整单元格属性的位置
	this.aGridsInfos.splice(iInsertIdx, 0, []);
	//调整子对象的位置
	for(var i = 0; i < this.aChildren.length; i++)
	{
		var oCell = this.aChildren[i];
		//插入位置在对象位置前，对象的坐标后移
		if(iInsertIdx <= oCell.oLayout.iRowIdx)
		{
			oCell.oLayout.iRowIdx++;
		}
	}
	//处理融合块
	for(var i = 0; i < this.aMergeBlocks.length; i++)
	{
		var mb = this.aMergeBlocks[i];
		if(iInsertIdx <= mb.iTop)//插入位置在融合块上方
		{
			//融合块下移
			mb.iTop++;
			mb.iBottom++;
		}
		else if(iInsertIdx <= mb.iBottom)//插入位置在融合块中间
		{
			//撑大融合块
			mb.iBottom++;
		}
	}
	//触发事件
	this.fireSizeChanged();
	return iInsertIdx;
}

//在指定位置前或后插入列，返回新列index
LayoutTable.prototype.insertCol = function(iColIdx, bBefore, iColWidth)
{
	var iInsertIdx = (bBefore ? iColIdx : iColIdx + 1);
	//列数加一
	this.iCols++;
	//插入列宽值
	this.aColWidths.splice(iInsertIdx, 0, iColWidth);
	//调整单元格属性的位置
	for(var i = 0; i < this.aGridsInfos.length; i++)
	{
		this.aGridsInfos[i].splice(iInsertIdx, 0, {});
	}
	//调整子对象的位置
	for(var i = 0; i < this.aChildren.length; i++)
	{
		var oCell = this.aChildren[i];
		//插入位置在对象位置前，对象的坐标后移
		if(iInsertIdx <= oCell.oLayout.iColIdx)
		{
			oCell.oLayout.iColIdx++;
		}
	}
	//处理融合块
	for(var i = 0; i < this.aMergeBlocks.length; i++)
	{
		var mb = this.aMergeBlocks[i];
		if(iInsertIdx <= mb.iLeft)//插入位置在融合块左方
		{
			//融合块右移
			mb.iLeft++;
			mb.iRight++;
		}
		else if(iInsertIdx <= mb.iRight)//插入位置在融合块中间
		{
			//撑大融合块
			mb.iRight++;
		}
	}
	//触发事件
	this.fireSizeChanged();
	return iInsertIdx;
}

//删除指定index的行
LayoutTable.prototype.deleteRow = function(iRowIdx)
{
	//删除行高值
	this.aRowHeights.splice(iRowIdx, 1);
	//行数减一
	this.iRows--;
	//调整单元格属性的位置
	this.aGridsInfos.splice(iRowIdx, 1);
	//删除子对象及调整子对象位置
	for(var i = this.aChildren.length - 1; i >= 0; i--)
	{
		var oCell = this.aChildren[i];
		if(iRowIdx == oCell.oLayout.iRowIdx)
		{
			this.removeChild(oCell);
		}
		else if(iRowIdx < oCell.oLayout.iRowIdx)
		{
			//删除位置在对象位置前，对象的坐标前移
			oCell.oLayout.iRowIdx--;
		}
	}
	//处理融合块，有删除，循环要从后向前
	for(var i = this.aMergeBlocks.length - 1; i >= 0; i--)
	{
		var mb = this.aMergeBlocks[i];
		if(iRowIdx < mb.iTop)//删除位置在融合块上方
		{
			//融合块上移
			mb.iTop--;
			mb.iBottom--;
		}
		else if(iRowIdx <= mb.iBottom)//删除位置在融合块中间
		{
			//缩小融合块
			mb.iBottom--;
			if(mb.isInvalid())//缩小成1x1，无效则去掉
			{
				this.aMergeBlocks.splice(i, 1);
			}
		}
	}
	//触发事件
	this.fireSizeChanged();
}

//删除指定index的列
LayoutTable.prototype.deleteCol = function(iColIdx)
{
	//删除列宽值
	this.aColWidths.splice(iColIdx, 1);
	//行数减一
	this.iCols--;
	//调整单元格属性的位置
	for(var i = 0; i < this.aGridsInfos.length; i++)
	{
		this.aGridsInfos[i].splice(iColIdx, 1);
	}
	//删除子对象及调整子对象位置
	for(var i = this.aChildren.length - 1; i >= 0; i--)
	{
		var oCell = this.aChildren[i];
		if(iColIdx == oCell.oLayout.iColIdx)
		{
			this.removeChild(oCell);
		}
		else if(iColIdx < oCell.oLayout.iColIdx)
		{
			//删除位置在对象位置前，对象的坐标前移
			oCell.oLayout.iColIdx--;
		}
	}
	//处理融合块，有删除，循环要从后向前
	for(var i = this.aMergeBlocks.length - 1; i >= 0; i--)
	{
		var mb = this.aMergeBlocks[i];
		if(iColIdx < mb.iLeft)//删除位置在融合块左边
		{
			//融合块左移
			mb.iLeft--;
			mb.iRight--;
		}
		else if(iColIdx <= mb.iRight)//删除位置在融合块中间
		{
			//缩小融合块
			mb.iRight--;
			if(mb.isInvalid())//缩小成1x1，无效则去掉
			{
				this.aMergeBlocks.splice(i, 1);
			}
		}
	}
	//触发事件
	this.fireSizeChanged();	
}

//把单元格(iRowIdx,iColIdx)拆成iRNums行，iCNums列
LayoutTable.prototype.split = function(iRowIdx, iColIdx, iRNums, iCNums)
{
	var iEndColIdx = iColIdx + iCNums - 1;
	if(iCNums > 1)
	{
		var iColWidth = this.aColWidths[iColIdx];
		var iSplitedWidth = Math.floor(iColWidth / iCNums);
		var iSplitedWidthAdd = iColWidth % iCNums;
		for(var i = 0; i < iCNums - 1; i++)
		{
			var w = iSplitedWidth + (iSplitedWidthAdd > i ? 1 : 0);
			this.insertCol(iColIdx, false, w);
		}
		this.setColWidth(iColIdx, iSplitedWidth);
		for(var i = 0; i < this.iRows; i++)
		{
			if(i == iRowIdx)
			{
				continue;//当前行，跳掉
			}
			var mb;
			var state = 0;
			for(var k = 0; k < this.aMergeBlocks.length; k++)
			{
				if(this.aMergeBlocks[k].isInside(i, iEndColIdx))
				{
					state = 1;
					break;//新插入的单元格已在融合块中，OK。
				}
				if(this.aMergeBlocks[k].isInside(i, iColIdx))//它行主格在融合块中
				{
					state = 2;
					mb = this.aMergeBlocks[k];
					break;
					//新增格所在的融合块，一定也是它行主格所在的融合块；反之，它行主格在融合块A中，
					//而新增格不在A中，可以肯定新增格一定不在融合块中，不用再判断，直接break。
				}
			}
			if(state == 0)
			{
				this.addMergeBlock(i, iColIdx, i, iEndColIdx);
			}
			else if(state == 2)
			{
				//把新增单元格并入融合块。
				//不是并入一角，而是并入整列，这样可能把后续行一起并了，但不影响，
				//轮到后续行时，新增格已在融合块中。
				mb.iRight = iEndColIdx;
			}
		}
	}
	if(iRNums > 1)
	{
		var iRowHeight = this.aRowHeights[iRowIdx];
		var iSplitedHeight = Math.floor(iRowHeight / iRNums);
		var iSplitedHeightAdd = iRowHeight % iRNums;
		for(var i = 0; i < iRNums - 1; i++)
		{
			var h = iSplitedHeight + (iSplitedHeightAdd > i ? 1 : 0);
			this.insertRow(iRowIdx, false, h);
		}
		this.setRowHeight(iRowIdx, iSplitedHeight);
		var iEndRowIdx = iRowIdx + iRNums - 1;
		for(var i = 0; i < this.iCols; i++)
		{
			if(iColIdx <= i && i <= iEndColIdx)
			{
				continue;//当前列(考虑之前已插入列)，跳掉
			}
			var mb;
			var state = 0;
			for(var k = 0; k < this.aMergeBlocks.length; k++)
			{
				if(this.aMergeBlocks[k].isInside(iEndRowIdx, i))
				{
					state = 1;
					break;//新插入的单元格已在融合块中，OK。
				}
				if(this.aMergeBlocks[k].isInside(iRowIdx, i))//它列主格在融合块中
				{
					state = 2;
					mb = this.aMergeBlocks[k];
					break;
				}
			}
			if(state == 0)
			{
				this.addMergeBlock(iRowIdx, i, iEndRowIdx, i);
			}
			else if(state == 2)
			{
				mb.iBottom = iEndRowIdx;
			}
		}
	}
}

LayoutTable.prototype.setSizeChangedListener = function(func)
{
	//只支持一个KEY对应一个事件监听
	this.aListeners["sizeChanged"] = func;
}

LayoutTable.prototype.fireSizeChanged = function()
{
	var func = this.aListeners["sizeChanged"];
	if(func)
	{
		func(this.getWidth(), this.getHeight());
	}
}

//一些融合状态可以把模型优化化简
LayoutTable.prototype.optimize = function()
{
	//表格数据模型优化第一定律（融合优化）:
	//某一行（列）的所有单元格都在融合块中，且不是融合块的主格，
	//则这一行（列）可以删除（删除操作包含融合块调整），
	//删除后它的高（宽）分给它的上一行（列）。
	for(var i = this.iRows - 1; i > 0; i--)
	{
		var bAllRowDead = true;
		for(var j = 0; j < this.iCols; j++)
		{
			var mb = this.getMergeBlock(i, j);
			bAllRowDead = bAllRowDead && (mb && !mb.isMainCell(i, j));
		}
		if(bAllRowDead)
		{
			var h = this.aRowHeights[i];
			this.aRowHeights[i - 1] += h;
			this.deleteRow(i);
		}
	}
	for(var j = this.iCols - 1; j > 0; j--)
	{
		var bAllColDead = true;
		for(var i = 0; i < this.iRows; i++)
		{
			var mb = this.getMergeBlock(i, j);
			bAllColDead = bAllColDead && (mb && !mb.isMainCell(i, j));
		}
		if(bAllColDead)
		{
			var w = this.aColWidths[j];
			this.aColWidths[j - 1] += w;
			this.deleteCol(j);
		}
	}
}

///////////////////////////////////////////////////////////
// Class 描述布局信息的对象

function Layout(oLayoutTable, iRowIdx, iColIdx)
{
	this.oLayoutTable = oLayoutTable;//所在表格
	this.iRowIdx = iRowIdx;//第几行
	this.iColIdx = iColIdx;//第几列
}

Layout.prototype.getUID = function()
{
	//由于Html的表格融合时，被融合的<td>会省略掉，不能简单地通过对象的索引得到目标。
	//通过类似于这样：<td id="layout_1_2"> 的方式，可以通过id定位到目标。
	return this.oLayoutTable.sUid + "_" + this.iRowIdx + "_" + this.iColIdx;
}

Layout.prototype.updateBorder = function(oTd)
{
	oTd.style.border = "solid 1px #DDD";
}

Layout.prototype.equals = function(oAnother)
{
	if(oAnother == this)
	{
		return true;
	}
	
	if(this.oLayoutTable == oAnother.oLayoutTable
		&& this.iRowIdx == oAnother.iRowIdx
		&& this.iColIdx == oAnother.iColIdx)
	{
		return true;
	}
	
	return false;
}

Layout.prototype.clone = function()
{
	var newInst = new Layout(this.oLayoutTable, this.iRowIdx, this.iColIdx);
	return newInst;
}

Layout.prototype.isMultiSettingSupported = function()
{
	return true;//支持多选设置属性
}

Layout.prototype.propertySetting = function(f)
{
	//对于单选，直接从table取行高列宽；对于多选，取合并过的并保留在临时变量里的值。
	var oParms = new Object();
	var bMultiSelected = false;
	if(this.iRowIdx >= 0)//单选的
	{
		oParms.bHeightEnabled = true;
		oParms.bWidthEnabled = true;
		var mb = this.oLayoutTable.getMergeBlock(this.iRowIdx, this.iColIdx);
		if(mb)
		{
			oParms.iHeight = mb.getHeight(this.oLayoutTable);
			oParms.iWidth = mb.getWidth(this.oLayoutTable);
		}
		else
		{
			oParms.iHeight = this.oLayoutTable.getRowHeight(this.iRowIdx);
			oParms.iWidth = this.oLayoutTable.getColWidth(this.iColIdx);
		}
	}
	else
	{
		oParms.bHeightEnabled = this.bHeightEnabled;
		oParms.bWidthEnabled = this.bWidthEnabled;
		oParms.iHeight = this.iHeight;//合并的，可能有不确定值null
		oParms.iWidth = this.iWidth;
		bMultiSelected = true;
	}
	
	if(bMultiSelected)
	{
		oParms.name = null;//用null代表unsure
	}
	else
	{
		var oCell = this.oLayoutTable.getChild(this.iRowIdx, this.iColIdx);
		var gridInfo = this.oLayoutTable.getGridInfo(this.iRowIdx, this.iColIdx);
		var oldName = oParms.name = ( gridInfo ? gridInfo.name : "" ) || "";
		oldName = _.trim( oldName );
	}

	var _this = this;
	_wrapHTMLPageInDialog( {
		uri: "dlgRowCol.htm",
		width: 360,
		height: 200,
		param: oParms,
		callback: function( returnValue ) {
			if ( !returnValue ) return;
			if(oParms.iHeight != null)
			{
				if(_this.iRowIdx >= 0)//单选的情况，直接应用
				{
					var mb = _this.oLayoutTable.getMergeBlock(_this.iRowIdx, _this.iColIdx);
					if(mb)
					{
						_this.oLayoutTable.setHeight(oParms.iHeight, mb.iTop, mb.iBottom);
					}
					else
					{
						_this.oLayoutTable.setRowHeight(_this.iRowIdx, oParms.iHeight);
					}
				}
				else//多选的情况，留在临时属性中
				{
					_this.iHeight = oParms.iHeight;
				}
			}
			if(oParms.iWidth != null)
			{
				if(_this.iColIdx >= 0)
				{
					var mb = _this.oLayoutTable.getMergeBlock(_this.iRowIdx, _this.iColIdx);
					if(mb)
					{
						_this.oLayoutTable.setWidth(oParms.iWidth, mb.iLeft, mb.iRight);
					}
					else
					{
						_this.oLayoutTable.setColWidth(_this.iColIdx, oParms.iWidth);
					}
				}
				else
				{
					_this.iWidth = oParms.iWidth;
				}
			}
			f && f();//回调多选的属性应用
			//
			
			if(oParms.name == null)
			{
				return;
			}
			var newName = _.trim( oParms.name );
			var gridInfo = _this.oLayoutTable.getGridInfo( _this.iRowIdx, _this.iColIdx );
			if ( gridInfo ) {
				gridInfo.name = newName;
			} else {
				_this.oLayoutTable.setGridInfo( _this.iRowIdx, _this.iColIdx, {
					name: newName
				} );
			}
			if ( oldName != newName ) {
				var se = SubScriptEngine,
					rt = se.Runtime,
					nm = rt.NameManager;
				if ( !oldName ) {
					var cell = new se.Types.Cell( newName );
					var cells = rt.getCurrentCells();
					cells.push( cell );
					if ( oCell && oCell.tdIID && oCell.iid ) {
						var anonymousCell = nm.lookupIID( oCell.tdIID );
						var instance = nm.lookupIID( oCell.iid );
						delete anonymousCell[ instance.name ];
						cell[ instance.name ] = instance;
					}
					oCell && ( oCell.tdIID = cell.iid );
				} else if ( !newName ) {
					var cells = rt.getCurrentCells();
					var index = _.indexOf( cells, function( x ) {
						return x.name == oldName;
					} );
					var cell = cells[ index ];
					cells.splice( index, 1 );
					nm.unregister( cell.iid );
					if ( oCell && oCell.iid ) {
						var anonymousCell = rt.getCurrentCells().getAnonymousCell( true );
						var instance = nm.lookupIID( oCell.iid );
						anonymousCell[ instance.name ] = instance;
						oCell.tdIID = anonymousCell.iid;
					} else if ( oCell ) {
						oCell.tdIID = null;
					}
				} else {
					var cells = rt.getCurrentCells();
					var index = _.indexOf( cells, function( x ) {
						return x.name == oldName;
					} );
					var cell = cells[ index ];
					cell.changeName( newName );
				}
			}

		}
	} );
}

//用传入对象把当前合并成可能带有不确定值的对象
Layout.prototype.mergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof Layout))
	{
		return;
	}
	//用于多选属性设置的“属性合并对象”，会多出以下属性：
	//宽度设置有效 bWidthEnabled
	//高度设置有效 bHeightEnabled
	//宽度 iWidth，如果多选值不同则为null
	//高度 iHeight，如果多选值不同则为null
	//合并进来的对象所带的融合块 aMbs，为统一处理，无融合块的按1x1算一块
	//注意这些属性只要不和类的成员变量冲突就可以。
	if(this.aMbs == undefined)//第一次合并，先处理自己
	{
		this.aMbs = new Array();
		this.bWidthEnabled = true;
		this.bHeightEnabled = true;
		var mb = this.oLayoutTable.getMergeBlock(this.iRowIdx, this.iColIdx);
		if(!mb)
		{
			mb = new MergeBlock(this.iRowIdx, this.iColIdx, this.iRowIdx, this.iColIdx);
		}
		this.aMbs.push(mb);
		this.iWidth = mb.getWidth(this.oLayoutTable);
		this.iHeight = mb.getHeight(this.oLayoutTable);
	}
	//置-1标志有合并的情况，但它必须在上面的引用之后改变值	
	this.iRowIdx = -1;
	this.iColIdx = -1;
	//oAnother.oLayoutTable和this.oLayoutTable其实是同一个
	var mb = oAnother.oLayoutTable.getMergeBlock(oAnother.iRowIdx, oAnother.iColIdx);
	if(!mb)
	{
		mb = new MergeBlock(oAnother.iRowIdx, oAnother.iColIdx, oAnother.iRowIdx, oAnother.iColIdx);
	}
	if(this.bWidthEnabled || this.bHeightEnabled)
	{
		//融合块不交叉的情况，可以一起设置大小；否则不行
		for(var i = 0; i < this.aMbs.length; i++)
		{
			var mbTemp = this.aMbs[i];
			if(this.bWidthEnabled)
			{
				if(mb.iRight < mbTemp.iLeft 
					|| (mb.iLeft == mbTemp.iLeft && mb.iRight == mbTemp.iRight) 
					|| mb.iLeft > mbTemp.iRight)
				{
					var w = mb.getWidth(oAnother.oLayoutTable);
					if(this.iWidth != w)
					{
						this.iWidth = null;
					}
				}
				else
				{
					this.bWidthEnabled = false;
				}
			}
			if(this.bHeightEnabled)
			{
				if(mb.iBottom < mbTemp.iTop 
					|| (mb.iTop == mbTemp.iTop && mb.iBottom == mbTemp.iBottom) 
					|| mb.iTop > mbTemp.iBottom)
				{
					var h = mb.getHeight(oAnother.oLayoutTable);
					if(this.iHeight != h)
					{
						this.iHeight = null;
					}
				}
				else
				{
					this.bHeightEnabled = false;
				}
			}
		}
		this.aMbs.push(mb);
	}
}

//将另一个对象的属性应用到当前对象
Layout.prototype.applyProperty = function(oAnother)
{
	var mb = this.oLayoutTable.getMergeBlock(this.iRowIdx, this.iColIdx);
	if(oAnother.bWidthEnabled && oAnother.iWidth != null)
	{
		if(mb)
		{
			this.oLayoutTable.setWidth(oAnother.iWidth, mb.iLeft, mb.iRight);
		}
		else
		{
			//要用setColWidth接口，同步UI；不能直接拿属性出来改。
			this.oLayoutTable.setColWidth(this.iColIdx, oAnother.iWidth);
		}
	}
	if(oAnother.bHeightEnabled && oAnother.iHeight != null)
	{
		if(mb)
		{
			this.oLayoutTable.setHeight(oAnother.iHeight, mb.iTop, mb.iBottom);
		}
		else
		{
			this.oLayoutTable.setRowHeight(this.iRowIdx, oAnother.iHeight);
		}
	}
}

///////////////////////////////////////////////////////////
// Class 融合块
function MergeBlock(iTop, iLeft, iBottom, iRight)
{
	this.iTop = Math.min(iTop, iBottom);
	this.iBottom = Math.max(iTop, iBottom);
	this.iLeft = Math.min(iLeft, iRight);
	this.iRight = Math.max(iLeft, iRight);
}

MergeBlock.prototype.rowSpan = function()
{
	return this.iBottom - this.iTop + 1;
}

MergeBlock.prototype.colSpan = function()
{
	return this.iRight - this.iLeft + 1;
}

MergeBlock.prototype.isMainCell = function(iRow, iCol)
{
	return (iRow == this.iTop && iCol == this.iLeft);
}

MergeBlock.prototype.isInside = function(iRow, iCol)
{
	return (this.iTop <= iRow && iRow <= this.iBottom
		&& this.iLeft <= iCol && iCol <= this.iRight);	
}

//一行一列，无效的融合块
MergeBlock.prototype.isInvalid = function()
{
	return (this.iTop == this.iBottom && this.iLeft == this.iRight);
}

MergeBlock.prototype.toXml = function()
{
	var sXml = '<Block top="' + this.iTop + '" bottom="' + this.iBottom 
		+ '" left="' + this.iLeft + '" right="' + this.iRight + '"/>';
	return sXml;
}

MergeBlock.prototype.getWidth = function(oLayoutTable)
{
	var w = 0;
	for(var i = this.iLeft; i <= this.iRight; i++)
	{
		w += oLayoutTable.aColWidths[i];
	}
	return w;
}

MergeBlock.prototype.getHeight = function(oLayoutTable)
{
	var h = 0;
	for(var i = this.iTop; i <= this.iBottom; i++)
	{
		h += oLayoutTable.aRowHeights[i];
	}
	return h;
}

///////////////////////////////////////////////////////////
// 以下定义样式
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// Class 样式对象
function Style()
{
	this.sUID;
	
	this.sFontName = "宋体";
	this.iFontSize = "9";
	this.sFontColor = "#000000";
	this.bBold = false;
	this.bItalic = false;
	this.bUnderline = false;

	this.sBackground = "#ffffff";

	this.sAlignH = "center";
	this.sAlignV = "middle";
}

Style.prototype.updateUI = function(oHtml)
{
	if(this.sFontName)
	{
		oHtml.style.fontFamily = this.sFontName;
	}
	if(this.iFontSize)
	{
		oHtml.style.fontSize = this.iFontSize + "pt";
	}
	if(this.sFontColor)
	{
		oHtml.style.color = this.sFontColor;
	}
	if(this.sBackground == "" || this.sBackground)
	{
		oHtml.style.backgroundColor = this.sBackground;
	}

	oHtml.style.textDecorationUnderline = (this.bUnderline ?  true : false);
	oHtml.style.fontStyle = (this.bItalic ? "italic" : "normal");
	oHtml.style.fontWeight = (this.bBold ? "bold" : "normal");

	if(this.sAlignH)
	{
		oHtml.style.textAlign = this.sAlignH;
	}
	if(this.sAlignV)
	{
		oHtml.style.verticalAlign = this.sAlignV;
	}
}

Style.prototype.toXml = function()
{
	var sXml = '<Style id="' + this.sUID + '">'
		+ '<fontFamily>' + this.sFontName + '</fontFamily>'
		+ '<fontSize>' + this.iFontSize + 'pt</fontSize>'
		+ '<color>' + this.sFontColor + '</color>'
		+ '<textAlign>' + this.sAlignH + '</textAlign>'
		+ '<verticalAlign>' + this.sAlignV + '</verticalAlign>'
		+ '<backgroundColor>' + this.sBackground + '</backgroundColor>';
		
	if(this.bItalic)
	{
		sXml += '<fontStyle>italic</fontStyle>';
	}
	if(this.bBold)
	{
		sXml += '<fontWeight>bold</fontWeight>';
	}
	if(this.bUnderline)
	{
		sXml += '<textDecoration>underline</textDecoration>';
	}
	sXml += '</Style>';
	return sXml;
}

Style.prototype.fromXml = function(oDom)
{
	this.sUID = oDom.getAttribute("id");	

	this.sFontName = getDomChildText(oDom, "fontFamily", this.sFontName);
	this.iFontSize = parseInt(getDomChildText(oDom, "fontSize", this.iFontSize));
	this.sFontColor = getDomChildText(oDom, "color", this.sFontColor);
	this.sAlignH = getDomChildText(oDom, "textAlign", this.sAlignH);
	this.sAlignV = getDomChildText(oDom, "verticalAlign", this.sAlignV);
	this.sBackground = getDomChildText(oDom, "backgroundColor", this.sBackground);
	
	this.bItalic = (getDomChildText(oDom, "fontStyle") == "italic" ? true : false);
	this.bBold = (getDomChildText(oDom, "fontWeight") == "bold" ? true : false);
	this.bUnderline = (getDomChildText(oDom, "textDecoration") == "underline" ? true : false);
}

Style.prototype.clone = function()
{
	var newInst = new Style();
	newInst.sFontName 	= this.sFontName;
	newInst.iFontSize 	= this.iFontSize;
	newInst.sFontColor 	= this.sFontColor;
	newInst.bBold 		= this.bBold;
	newInst.bItalic 	= this.bItalic;
	newInst.bUnderline 	= this.bUnderline;
	newInst.sBackground = this.sBackground;
	newInst.sAlignH 	= this.sAlignH;
	newInst.sAlignV 	= this.sAlignV;
	return newInst;
}

Style.prototype.equals = function(oAnother)
{
	return (oAnother.sFontName 	== this.sFontName
		&& oAnother.iFontSize == this.iFontSize
		&& oAnother.sFontColor == this.sFontColor
		&& oAnother.bBold == this.bBold
		&& oAnother.bItalic == this.bItalic
		&& oAnother.bUnderline == this.bUnderline
		&& oAnother.sBackground == this.sBackground
		&& oAnother.sAlignH == this.sAlignH
		&& oAnother.sAlignV == this.sAlignV)
}

//用传入对象把当前合并成可能带有不确定值的对象
Style.prototype.mergePropertyFrom = function(oAnother)
{
	if(!(oAnother instanceof Style))
	{
		return;
	}
	
	this.sFontName = mergeProperty(oAnother.sFontName, this.sFontName);
	this.iFontSize = mergeProperty(oAnother.iFontSize, this.iFontSize);
	this.sFontColor = mergeProperty(oAnother.sFontColor, this.sFontColor);
	this.bBold = mergeProperty(oAnother.bBold, this.bBold);
	this.bItalic = mergeProperty(oAnother.bItalic, this.bItalic);
	this.bUnderline = mergeProperty(oAnother.bUnderline, this.bUnderline);
	this.sBackground = mergeProperty(oAnother.sBackground, this.sBackground);
	this.sAlignH = mergeProperty(oAnother.sAlignH, this.sAlignH);
	this.sAlignV = mergeProperty(oAnother.sAlignV, this.sAlignV);
}

//将另一个对象的属性应用到当前对象
Style.prototype.applyProperty = function(oAnother)
{
	if(oAnother.sFontName != null)
	{
		this.sFontName = oAnother.sFontName;
	}
	if(oAnother.iFontSize != null)
	{
		this.iFontSize = oAnother.iFontSize;
	}
	if(oAnother.sFontColor != null)
	{
		this.sFontColor = oAnother.sFontColor;
	}
	if(oAnother.bBold != null)
	{
		this.bBold = oAnother.bBold;
	}
	if(oAnother.bItalic != null)
	{
		this.bItalic = oAnother.bItalic;
	}
	if(oAnother.bUnderline != null)
	{
		this.bUnderline = oAnother.bUnderline;
	}
	if(oAnother.sBackground != null)
	{
		this.sBackground = oAnother.sBackground;
	}
	if(oAnother.sAlignH != null)
	{
		this.sAlignH = oAnother.sAlignH;
	}
	if(oAnother.sAlignV != null)
	{
		this.sAlignV = oAnother.sAlignV;
	}
}


///////////////////////////////////////////////////////////
// Utils
///////////////////////////////////////////////////////////

function mergeProperty(v1, v2)
{
	return (v1 == v2 ? v1 : null);
}

function getDomChildNode(oDom, sChildTag)
{
	for(var i = 0; i < oDom.childNodes.length; i++)
	{
		var oNode = oDom.childNodes[i];
		if(oNode.tagName == sChildTag)
		{
			return oNode;
		}
	}
	return null;
}

//假设oDom节点有[0,1]个sChildTag的子节点，该方法返回子节点的内容；如果不存在此子节点，则返回指定的缺省值。
function getDomChildText(oDom, sChildTag, sDefault)
{
	var oNode = getDomChildNode(oDom, sChildTag);
	return (oNode ? oNode.text : sDefault);
}

function cellFactory(sTag)
{
	if(sTag == "text")
	{
		return new Cell_Text();
	}
	else if(sTag == "piece")
	{
		return new Cell_Piece();			
	}
	else if(sTag == "picture")
	{
		return new Cell_Picture();
	}
	else if(sTag == "table")
	{
		return new Cell_Table();
	}
	else if(sTag == "chart") {
		return new Cell_Chart();
	} else if ( sTag == "input" || sTag == "select" || sTag == "button" || sTag == "checkbox" || sTag == "radiobox" || sTag == "slider") {
		return new Cell_Input();
	} else if ( sTag == "url" ) {
		return new Cell_Url();
	}else if(sTag=="kpi"){
	  return new Cell_KPI();
	} else if ( sTag == "easkpi" ) {
	  	return new Cell_EASKPI();
	} else if ( sTag == "KPIMonitor" ) {
		//bruce_sha 2010-01-13
	  	return new Cell_KPIMonitor();
	}
	return null;
}
