/**
 * 企业指标模型的维度选择区的UI和处理逻辑
 * stone_zheng 2010/02/01
 * 
 * 	parentDiv：		父窗体
 * 	condition：		维度选择区的内容
 * 	post：			通讯post
 * 	urlSeparator：	返回数据的分隔符
 * 	refresh：		当发生变化时，需要回调refresh，自刷新
 * 
 */
function DimSelector( parentDiv, condition, post, urlSeparator, refresh ) {
	this.parentDiv = parentDiv;
	this.condition = condition;
	this.post = post;
	post=post;
	this.urlSeparator = urlSeparator;
	this.refresh = refresh;
}

/**
 * 创建一个容器
 */
DimSelector.prototype.createUI = function() {
	
	if(this._ui) 
		return this._ui;
	
	var post = this.post;	
	var urlSeparator = this.urlSeparator;
	var refresh = this.refresh;
	var parentDiv = this.parentDiv;
	
	this._ui = document.createElement("div");
	
	handleConditionUI(this.condition,this._ui);
	
	return this._ui;
	
	/**
	 * 解析条件区的数据，分解为多个条目
	 */
	function handleConditionUI( condition, parentDiv ) {
		var ret = condition;
		var pattern = /json(\{[\u0000-\uFFFF]*?\})json\:end/g, matcher, lastType;
		if ( !parentDiv.loaded ) {
			if ( /json(\{[\u0000-\uFFFF]*?\})json\:end/.test( ret ) ) {
				parentDiv.innerHTML = "";
			}
			while( matcher = pattern.exec( ret ) ) {
				var json = eval( "(" + matcher[1] + ")" );
				if ( json.type != lastType ) {
					var lineSpan = _.crt( "span", {
						isContainer: true
					}, parentDiv, "padding-top:10px" );
					lastType = json.type;
				}
				handleCondition( lineSpan, json );
				parentDiv.loaded = true;
			}
		}
		return ret.replace( pattern, "" );
	};
	
	/**
	 * 按单选和多选的不同，使用不同的选择器
	 */
	function handleCondition( div, json ) {
		
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
					json: 
						{
							uiid: json.uiid,
							command: "changeDimensionMember",
							dimension: node.dim,
							members: [ node.value ]
						},
					callback: function( r ) {
						//返回的数据，需要重新刷新显示
						refresh( parentDiv, eval(r), post, urlSeparator );
					}
				} );
			},
			lazyload = function( node, callback ) {
				post( {
					json: {
						uiid: json.uiid,
						command: "getDimensionChildren",
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
							uiid: json.uiid,
							command: "getDimensionChildren",
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
	
} 

/**
 * 刷新指标监控的显示
 * 
 */
function refreshKPIMonitor( parentDiv, dial, post, urlSeparator ) {
	// 生成条件选择区
	parentDiv.innerHTML = "";
	var dimSelector = new DimSelector( parentDiv, dial.condition, post, urlSeparator, refreshKPIMonitor);
	parentDiv.appendChild( dimSelector.createUI() );
	
	// 添加监控内容区 dial.content 为返回数据
	var dialId=dial.id;

	parentDiv.appendChild(createKPIUI(dial.content));
}
/**
 * 创建具体的内容UI
 */
function createKPIUI(xml){
	// 增加一个div
	var div = document.createElement("div");
	div.innerHTML = getKPIMonitorURL(xml)
	return div;
}
/**
 * 取得具体显示内容的URL地址
 */
function getKPIMonitorURL(xml){
	//debugger;
	//var URL="<table><tr>";//这种方式是为了在一行显示，应该改成一行
	var URL='<DIV><div style="overflow-x:scroll;white-space:nowrap;">';
	
	var xmlDoc=new ActiveXObject("Msxml2.DOMDocument");
	xmlDoc.async="false";
	xmlDoc.loadXML(xml);
	// 先取得当前条件区的内容
	var C=xmlDoc.getElementsByTagName("condition")[0];

	var servletUrl = C.getAttribute('servletUrl');//servlet 地址
	var servletType = C.getAttribute('servletType');//servlet 类型
	var uiid = C.getAttribute('uiid');//UIID
	var pageId = C.getAttribute('pageId');//pageId
	var paramOrg = C.getAttribute('paramOrg');//条件区域的值（这里应该考虑服务端拆开，在客户端拼接。因为有一个参数不知道）
	var paramYear = C.getAttribute('paramYear');
	var paramPeriod = C.getAttribute('paramPeriod');
	var paramMetric = C.getAttribute('paramMetric');
	
	var command = C.getAttribute('command');//command命令

	//先取得整体属性
	var M=xmlDoc.getElementsByTagName("kpis")[0];

	var title = M.getAttribute('title');//标题
	var kpiMonitorId = M.getAttribute('kpiMonitorId');//指标监控id（为了钻取）
	var width = M.getAttribute('width');//宽度（单个指标）
	var height = M.getAttribute('height');//高度（单个指标）
	var autoFlow = M.getAttribute('autoFlow');//自动换行（单个指标）
	if (autoFlow!=="true") autoFlow=false;//？有时为空
	var goodColor = M.getAttribute('goodColor');//正常颜色
	var warningColor = M.getAttribute('warningColor');//不良颜色
	var dangerColor = M.getAttribute('dangerColor');//危险颜色
	var monitorType = M.getAttribute('monitorType');//监控类型
	
	//再分别取得单个指标的属性
	var mList=xmlDoc.getElementsByTagName("kpi");//得到指标监控列表
	
	for (i=0,n=mList.length ; i<n ; i++)
	{
		//debugger;
		//得到第i个指标
	    var m=mList[i]; 
	    var message=m.getAttribute('message');
	    var monitorNumber=m.getAttribute('monitorNumber');
	    var monitorName=m.getAttribute('monitorName');
	    var showType=m.getAttribute('showType');
	    var edgeType=m.getAttribute('edgeType');
	    var showFormat=m.getAttribute('showFormat');
	    
	    //得到钻取信息
	    var drilldown=m.getElementsByTagName('drilldown')[0];
	    var drillDownOrg=drilldown.getAttribute('org');		    
	    var drillDownYear=drilldown.getAttribute('year');
	    var drillDownPeriod=drilldown.getAttribute('period');		    
	    var drillDowndefault=drilldown.getAttribute('default');		    
	    		    
	    //得到五个数据值
	    var data=m.getElementsByTagName("data")[0];
	    var pointv=data.getAttribute('point');
	    var minv=data.getAttribute('min');
	    var dangerv=data.getAttribute('danger');
	    var alertv=data.getAttribute('alert');
	    var maxv=data.getAttribute('max');		    
	    
	    var paramValue;
	    //钻取逻辑
	    var dillDownPostParam;
	    var dillDownCommandParam;
	    var dillDownUrlParam;
	    
//	    dillDownPostParam = "{servletUrl:'/easportal/BIReport',servletType:'kpiMonitor',uiid:'007',pageId:'38'}";	    
//	    //dillDownUrlParam = "../html/KPIMonitor.htm?kpiMonitorId=pqrdzMGhQBWZjF2Pg5GrUqvN7wA=&param={org:'01.001',year:'2007',period:'6',autoWrap:true,compWidth:80,compHeight:60}&url=/easportal/BIReport";	
//	    dillDownUrlParam = "{kpiMonitorId:'pqrdzMGhQBWZjF2Pg5GrUqvN7wA=',paramOrg:'01.001',paramYear:'2007',paramPeriod:'6',paramMetric:'007',paramAutoWrap:true,paramCompWidth:80,paramCompHeight:60,url:'/easportal/BIReport'}";	
//	    dillDownCommandParam = "{command:'drillDown',kpiMonitorNumber:'01.001'}";	
	    
	    var nextMonitorNumber;//下次钻取的number，用于取得showList
	    
	    switch(monitorType){
	    	case "org": nextMonitorNumber=monitorNumber; paramOrg=monitorNumber;	break;//目前只支持这种情况（只支持组织钻取）
	    	case "year": paramYear=monitorNumber;	break;
	    	case "period": paramPeriod=monitorNumber;	break;
	    	case "metric": nextMonitorNumber=paramOrg; paramMetric=monitorNumber;	break;
	    }
	    //debugger;
	    dillDownPostParam = "{servletUrl:'"+servletUrl+"',servletType:'"+servletType+"',uiid:'"+uiid+"',pageId:'"+pageId+"'}";
	    dillDownUrlParam = "{kpiMonitorId:'"+kpiMonitorId+"',paramOrg:'"+paramOrg+"',paramYear:'"+paramYear+"',paramPeriod:'"+paramPeriod+"',paramMetric:'"+paramMetric+"',paramAutoWrap:"+autoFlow+",paramCompWidth:"+width+",paramCompHeight:"+height+",url:'/easportal/BIReport'}";	
	    dillDownCommandParam = "{command:'"+command+"',kpiMonitorNumber:'"+nextMonitorNumber+"'}";	
	    
	    if(edgeType=="up"){
		    paramValue="../dashboard/bi_kpi_ybp.swf?" +
			"Unit=" + "" + 
			//"&mytype=" + "r.showPercent" +
			//"&pNum=" + "2" + 
			"&bgcolor=0xffffff&menuType=1"+
			"&title=" + monitorName +
			"&numMin=" + minv +
			"&numValue=" + pointv +
			"&numDanger=" + dangerv +
			"&numAlerm=" + alertv +
			"&numMax=" + maxv +
			"&colorI=" + goodColor + 
			"&colorII=" + warningColor + 
			"&colorIII=" + dangerColor +
			"&postParam=" + dillDownPostParam +	
			"&commandParam=" + dillDownCommandParam +	
			"&urlParam=" + dillDownUrlParam ;
				
	    }else{
		    paramValue="../dashboard/bi_kpi_ybp.swf?" +
			"Unit=" + "" + 
			//"&mytype=" + "r.showPercent" +
			//"&pNum=" + "2" + 
			"&bgcolor=0xffffff&menuType=1"+
			"&title=" + monitorName +
			"&numMin=" + minv +
			"&numDanger=" + dangerv +
			"&numAlerm=" + alertv +
			"&numValue=" + pointv +
			"&numMax=" + maxv +
			"&colorI=" + dangerColor + 
			"&colorII=" + warningColor + 
			"&colorIII=" + goodColor +
			"&postParam=" + dillDownPostParam +	
			"&commandParam=" + dillDownCommandParam +	
			"&urlParam=" + dillDownUrlParam ;	
	    }
		tempURL="";
if(false){
		if(message!=null&&message!=""){
			// 这种方法设置在IE中div中文字的水平垂直居中并且自动换行
			tempURL='<div  style="float:left;color:red;width:'+width+'px; height:'+height+'px; vertical-align:middle;text-align:center;"><i style="display:inline;width:0px; height:100%;vertical-align:middle;zoom:1;"></i><p style="display:inline;width:100%;vertical-align:middle;zoom:1;">'+message+'</p></div>';
		}else{
			//仪表盘
			if(showType=="dashboard"){
				tempURL='<div align="center" style="display:inline;padding:0px;float:left" ><object type="application/x-shockwave-flash" sue="kpi_flash" name="kpi_flash"  valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" '+
				'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" ' +
				' width="' +  width +  '" height="' + height + '">' +  			
				'<param name="movie" value="' + paramValue + '">' +
				'<param name="quality" value="High"><param name="wmode" value="transparent" />' +
				'</object></div>';
			}else if(showType=="light"){ // 红绿灯
				var color=getKPIMonitorColor(edgeType,pointv,minv,alertv,dangerv,maxv);
				var toolTip=getKPIMonitorToolTip(edgeType,pointv,minv,alertv,dangerv,maxv);
				tempURL=tempURL+'<div  style="display:inline;padding:0px;float:left" align="center"><object valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="' +  width +  '" height="' + height + '">';
				tempURL+='<param name="movie" value="../dashboard/bi_kpi_hld.swf?xmlInfo=<root><postParam>'+dillDownPostParam+'</postParam><commandParam>'+dillDownCommandParam+'</commandParam><urlParam>'+dillDownUrlParam+'</urlParam><color>'+color+'</color><bgcolor>0xffffff</bgcolor><menuType>1</menuType><label>'+""+'</label><name>'+monitorName+'</name><tooltip>'+toolTip+'</tooltip></root>"';
				tempURL+='<param name="quality" value="High"><param name="wmode" value="transparent" /></object></div>';
			}
			
		}
}	
		//仪表盘
		if(showType=="dashboard"){
		    //这里已经设置了按行显示了，即：display:inline
		    if(message!=null&&message!=""){
		    	tempURL='<div align="center" style="display:inline;padding:0px;float:left;color:red;text-align:center;vertical-align:middle;line-height:'+height+'px" width="'+ width + '" height="' + height + '" >'+message+'</div>';
		    }else{ 
		    	if(autoFlow=="false")
		    		tempURL='<span style="display:inline-block;">' ;
		    	tempURL+='<div align="center" style="display:inline;padding:0px;float:left;" ><object type="application/x-shockwave-flash" sue="kpi_flash" name="kpi_flash"  valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" '+
				'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" ' +
				' width="' +  width +  '" height="' + height + '">' +  			
				'<param name="movie" value="' + paramValue + '">' +
				'<param name="quality" value="High"><param name="wmode" value="transparent" />' +
				'</object></div>';
				if(autoFlow=="false")
					tempURL+='</span>';
		    }
		}else{
		 // 红绿灯
		    if(message!=null&&message!=""){
				//tempURL='<div style="float:left;color:red;vertical-align:middle;line-height:'+height+'px;height:'+height+'px;width:'+width+'px";overflow:hidden;><div style="word-break:break-all">'+message+'</div></div>';
				// 这种方法设置在IE中div中文字的水平垂直居中并且自动换行
				if(autoFlow=="false")
					tempURL='<span style="display:inline-block;">' ;
				tempURL+='<div  style="float:left;color:red;width:'+width+'px; height:'+height+'px; vertical-align:middle;text-align:center;"><i style="display:inline;width:0px; height:100%;vertical-align:middle;zoom:1;"></i><p style="display:inline;width:100%;vertical-align:middle;zoom:1;">'+message+'</p></div>';
		    	if(autoFlow=="false")
		    	   	tempURL+='</span>';
		    }else{
		    	//debugger;
				var color=getKPIMonitorColor(edgeType,pointv,minv,alertv,dangerv,maxv);
				var toolTip=getKPIMonitorToolTip(edgeType,pointv,minv,alertv,dangerv,maxv);
				if(autoFlow=="false")
					tempURL='<span style="display:inline-block;">' ;
				tempURL+=tempURL+'<div  style="display:inline;padding:0px;float:left;" align="center"><object valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="' +  width +  '" height="' + height + '">';
				tempURL+='<param name="movie" value="../dashboard/bi_kpi_hld.swf?xmlInfo=<root><postParam>'+dillDownPostParam+'</postParam><commandParam>'+dillDownCommandParam+'</commandParam><urlParam>'+dillDownUrlParam+'</urlParam><color>'+color+'</color><bgcolor>0xffffff</bgcolor><menuType>1</menuType><label>'+""+'</label><name>'+monitorName+'</name><tooltip>'+toolTip+'</tooltip></root>"';
				tempURL+='<param name="quality" value="High"><param name="wmode" value="transparent" /></object></div>';
		    	if(autoFlow=="false")
		    	  	tempURL+='</span>';
		    }	
		}
		URL=URL+tempURL;
	}
	//debugger;
	return URL+"</div></DIV";	
}
/**
 * 根据边界类型判断红绿灯
 */
function getKPIMonitorColor(edgeType,pointv,minv,alertv,dangerv,maxv){
	//debugger;
	var edgeType=edgeType;
    var pointValue=pointv;
    //var v0=minv;
    var v1=parseFloat(dangerv);
    var v2=parseFloat(alertv);
    //var v3=maxv;
    
    if(edgeType=="down"){
    	if(pointValue<=v1){
    		return "red";
    	}else if(pointValue>v1 && pointValue<v2){
    		return "orange";
    	}else if(pointValue>=v2){
    		return "green";
    	}
    }else if(edgeType=="up"){
		if(pointValue<=v1){
			return "green";
		}else if(pointValue>v1 && pointValue<v2){
			return "orange";
		}else if(pointValue>=v2){
			return "red";
		}
    }else if(edgeType=="double"){
    	//这里不可能被执行到了，因为在服务端已经把双边上下限转化为单边上限or单边下限
		//如果kpi的实际值小于中间值. 则应该是使用下限的参数来处理,否则使用上限
		var midv=(parseFloat(alertv)+parseFloat(dangerv))/2;
		if(pointv<midv)
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
		} else
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
/**
 * 显示Tips
 */
function getKPIMonitorToolTip(edgeType,pointv,minv,alertv,dangerv,maxv){
   	if(edgeType=="down")
   	{
   		return "br危险值:"+dangerv+"br实际值:"+pointv+"br不良值:"+alertv;
   	}
   	else if(edgeType=="up")
   	{
   		return "br不良值:"+dangerv+"br实际值:"+pointv+"br危险值:"+alertv;
   	}
   	else if(edgeType=="double")
   	{//这里不会被执行，在服务端已经转换，所以不可能是double
   		return "指针值:"+pointv+"br预警下限:"+minv+"br关注下限:"+dangerv+"br关注上限:"+alertv+"br预警上限:"+maxv;
	}
}


//以下为钻取逻辑
/**
 * 钻取类型，钻取参数
 */
function openDrillDownWindow(postParam,commandParam,urlParam,kpiMonitorType) {
	//debugger;
	var postParams = eval("(" + postParam + ")");//用于构造post： servletUrl,servletType,uiid,pageId
	var commandParams=eval("(" + commandParam + ")");//用于执行command：command,kpiMonitorNumber
	var urlParams=eval("(" + urlParam + ")");//用于callback的函数
	var URL=
	'../html/KPIMonitor.htm?'+
	'kpiMonitorId='+urlParams.kpiMonitorId+
	'&kpiMonitorType='+kpiMonitorType+
	'&param='+'{org:"'+urlParams.paramOrg+'",year:"'+urlParams.paramYear+'",period:"'+urlParams.paramPeriod+'",metric:"'+urlParams.paramMetric+
		'",autoWrap:'+urlParams.paramAutoWrap+',compWidth:'+urlParams.paramCompWidth+',compHeight:'+urlParams.paramCompHeight+'}'+
	'&url='+urlParams.url ;//拼出URL
	
	var kpiMonitorNumber;
	
	if("org"==kpiMonitorType)
	{//如果钻取组织
		kpiMonitorNumber=urlParams.paramOrg;
	}
	else if ("metric"==kpiMonitorType)
	{//如果钻取指标
		kpiMonitorNumber=urlParams.paramMetric;
	}
	
	
	var post;	
	_.post( {
		url: postParams.servletUrl,
		json: {
			servletType: postParams.servletType,
			pageId : postParams.pageId,
			uiid : postParams.uiid,
			//command: commandParams.command,
			command: "drillDown",
			kpiMonitorId:urlParams.kpiMonitorId,
			autoWrap:urlParams.paramAutoWrap,
			compWidth:urlParams.paramCompWidth,
			compHeight:urlParams.paramCompHeight,
			kpiMonitorType:kpiMonitorType,
			kpiMonitorNumber: commandParams.kpiMonitorNumber //kpiMonitorNumber//commandParams.kpiMonitorNumber 无用
			//kpiMonitorNumber: "001"//kpiMonitorNumber//commandParams.kpiMonitorNumber 无用 //2010-02-23 bruce_sha
		},
		async: false,
		nocache: true,
		beforeStart: null,
		afterEnd: null,
		callback: function( r ) {
			//debugger;
			if(r){
				//URL='../html/KPIMonitor.htm?kpiMonitorId=pqrdzMGhQBWZjF2Pg5GrUqvN7wA=&kpiMonitorType=org&param={org:"01.001",year:"2007",period:"6",autoWrap:true,compWidth:80,compHeight:60}&url=/easportal/BIReport';
				URL+="&showList="+r;
				window.showModalDialog(URL,"","dialogWeight=40;dialogHeight=35;center=yes;resizable=yes;help=no;scroll:yes");
			}else{
				alert("当前组织已经没有下级组织！");
			}
		}
	} );

	
}