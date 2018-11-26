var tab_include=null;
function setDial( env, td, dial, instance ) {
	// 某些情况下(链接打开仪表盘)，div.clientWidth和clientHeight不正确，所以，采用以下值。
	var iWidth = td.width;
	if(!iWidth||iWidth==null||iWidth==""||iWidth==0)
		iWidth = td.clientWidth;
	if(!iWidth||iWidth==null||iWidth==""||iWidth==0)
		iWidth = td.offsetWidth;
	var dialWidth = parseInt( iWidth );
	var iHeight = td.height;
	if(!iHeight||iHeight==null||iHeight==""||iHeight==0)
		iHeight = td.clientHeight;
	if(!iHeight||iHeight==null||iHeight==""||iHeight==0)
		iHeight = td.offsetWidth;
	var dialHeight = parseInt( iHeight); 
	
	if ( td.innerHTML ) {
		td.innerHTML = "";
		td.style.cssText = td.orignalCSSText;
	} else {
		td.orignalCSSText = td.style.cssText;
	}
	
	_.copyStyle( td,
		"padding,tableLayout,verticalAlign",
		[ "0px", "fixed", "top" ] );
	var d = _.div( {
		parent: td,
		cssText: _.format( "width:%spx;height:100%;table-layout:fixed;overflow:hidden", td.width )
	} );
	
	var focusDiv;
	// 点击一次获得焦点，再次点击取消焦点，点击其它焦点转移
	if ( 
		dial.type != "select" && dial.type != "button" 
		&& dial.type != "table" //表格用Ext控件 
		&& dial.type != "chart" 
		&& dial.type != "piece_chart_dynamic" //动态Chart片断是自适应的
		&& (!(dial.type == "picture"&&dial.displayMode == "filled")) //如果是充满图片，不需要滚动条 
		&& dial.type != "url" && dial.type != "kpi" && dial.type != "easkpi" ) 
	{
		
		_.bindEvent( d, "click", function( e ) {
			var div = d.$body || d;
			if ( focusDiv == div ) {
				doBlur();
				
				return;
			}
			doBlur();
			focusDiv = div;
			_.extend( div.style, {
				overflow: "auto"
//				,
//				border:"solid 0px #F90"
			} );
		} );
	}

	dial.style && _.extend( d.style, dial.style );
	
	d.$cssText = d.style.cssText;
	switch( dial.type ) {
		case "text":
			// 滤除特殊字符
			dial.text = dial.text.replace( new RegExp( _.map( "*[]{}^~!".split( "" ), function( c ) { return "\\" + c; } ).join( "|" ), "g" ), function( c ) {
				return "&#" + c.charCodeAt(0) + ";";
			} );
			var textInnerTable = _.table( _.format( "{[!padding:0px~%s]}!border-collapse:collapse;padding:0px;width:100%;height:100%", dial.text ), d );
			_.extend( textInnerTable.td( 0, 0 ).style, dial.style );
			var content = textInnerTable.td(0, 0);
			if( dial.linkType && dial.linkType != "" ) {
				content.innerHTML = "";
				var a = _.crt( "span", {
					innerHTML:dial.text,
					title:dial.linkTip
				}, content, "color:blue;text-decoration:underline;cursor:pointer" );
				_.bindEvent( a, "click",
					function() {
						doLink( dial.linkType, dial.linkURI, dial.linkReportType );
					});
				a.style.cursor = "pointer";
			}
			break;
		case "picture":
			var div = d;
			width = dialWidth;
			height = dialHeight;
			if ( dial.isShowTitle ) {
				div = createTitleBox( dial.title, d ).div;
				height = height - 20;
				width = width - 2;
			}
			var img;
			if ( dial.displayMode == "original" ) {
			   var table= _.table( "{[!padding:0px;text-align:center;vertical-align:middle]}!border-collapse:collapse;padding:0px;width:100%;height:100%", div );
				img = _.crt( "img", {
					src: dial.content
				}, table.td(0,0)); 
				
			} else if ( dial.displayMode == "filled" ) {
				img = _.crt( "img", {
					src: dial.content,
					width: width,
					height: height
				}, div );
			} else throw new Error( "仪表盘图片显示模式错误" );
			//添加链接的处理
			if( img && dial.linkType && dial.linkType != "" ) {
				img.style.cursor = "pointer";
				img.title = dial.linkTip;
				_.bindEvent( img, "click",
					function() {
						doLink( dial.linkType, dial.linkURI, dial.linkReportType );
					});
			}
			break;
		case "piece_worksheet_dynamic":
		case "piece_worksheet_snapshot":
		case "piece_chart_dynamic":
			if ( dial.isShowTitle ) {
				var drill = null;
				if(dial.canDrill&&dial.type != "piece_worksheet_snapshot")
					drill = { env: env, id: dial.id };
				var o = createTitleBox( dial.title, d, drill );
				
				o.div.innerHTML = dial.content;
			} else {
				d.innerHTML = dial.content;
			}
			break;
		case "piece_chart_snapshot":
			if ( dial.isShowTitle ) {
				div = createTitleBox( dial.title, d ).div;
				_.crt( "img", { src: dial.content }, div );
			} else {
				_.crt( "img", { src: dial.content }, d );
			}
			break;
		case "table":
			if ( dial.isShowTitle ) {
				d = createTitleBox( dial.title, d ).div;
				dialHeight = dialHeight - 22;
			}
			
			var dial_data = eval( dial.data );
			var head = dial_data.shift();
			var types = dial_data.shift();
			
			var fields =  [],columns = [];
			
			for(var i=0;i<head.length;i++)
			{
				fields[i] = {
					name:head[i],
					type:types[i]
				};
				columns[i] = 
				{
					header:head[i],
					dataIndex:head[i],
					sortable:true,
					width:75
				};
				if(types[i]=="date")
				{
					fields[i].dateFormat = "m/d/Y";
					columns[i].renderer = Ext.util.Format.dateRenderer('Y-m-d');
				}	
			}
			
			var store = new Ext.data.SimpleStore({fields:fields});
			store.loadData(dial_data);
			
			/**
			var store = new Ext.data.Store({
        		proxy: new Ext.data.MemoryProxy(dial.data),
        		remoteSort:true,
		        reader: new Ext.data.ArrayReader({
            		fields: fields
                })
    		});
			
			var pagingBar = new Ext.PagingToolbar({
        		pageSize: 25,
        		store: store,
        		displayInfo: true,
        		displayMsg: '显示 {0} - {1} of {2}',
        		emptyMsg: "没有数据",
                items:[
        		    '-' 
        		]
    		});
    		*/
    		
			var grid = new Ext.grid.GridPanel({
        		store: store,
        		columns:columns,
        		stripeRows: true,
        		width:dialWidth,
        		height:dialHeight,
        		viewConfig:{
  					columnsText:'显示的列',
  					scrollOffset:30,
  					sortAscText:'升序',
  					sortDescText:'降序'
  					//forceFit:true
        		}
			});
			grid.render(d);
			
			//store.load();
			
			break;
		
		case "chart":
			var div = d;
			if ( dial.isShowTitle ) {
				div = createTitleBox( dial.title, d ).div;
				dialHeight = dialHeight - 21;
			}
			doChart(div,dial.chartType,dial.src);
			//div.style.height=div.clientHeight-20;
			break;
		case "kpi":
		        var div = d;
		        if ( dial.isShowTitle ) {
			    	div = createTitleBox( dial.title, d ).div;
			    }
			    div.style.padding="0px";
			    try{
				  doKPI(div,dial.data,0);
				  div.style.height=div.clientHeight-10;
				}catch(e){
					div.style.paddingTop=div.clientHeight/3;
					div.innerHTML="<font style='font-size:12; color:#FF0000'>构建KPI图表失败!<br/>数据源可能已被修改,<br/>请重新设计该仪表板</font>";
					return;
				}
				
				break;
		case "select":
			d.style.textAlign = "center";
			dial.data = eval( dial.data );
			var innerTable = _.table( _.format( "{[!padding:0px~%s]}!border-collapse:collapse;padding:0px;font-size:12px;width:100%;height:100%", dial.hintText ), d );
			var content = innerTable.td(0,0);
            content.style.textAlign = "center";
			var select = _.crt( "select", null, content);
			if(dial.width&&dial.width!="")
				select.style.width = dial.width + "px";
			else
				select.style.width = "100px";
			for( var i = 0; i < dial.data.length; i++ ) {
				select.add( new Option( dial.data[i][0], dial.data[i][1] ) );
			}
			if ( instance ) {
				instance.rt.targetDOM = select;
			}
			if ( dial.script ) {
				env.scriptEngine.Runtime.ScriptManager.setScript( instance, dial.script );
			}
			
			break;
		case "button": "/bi_subject/dev/biweb/html/BISystem_View.jsp"
			d.style.textAlign = "center";
			var innerTable = _.table( _.format( "{[!padding:0px]}!border-collapse:collapse;padding:0px;width:100%;height:100%" ), d );
			var content = innerTable.td(0,0);
			content.style.textAlign = "center";
			var button = _.crt( "button", {
				innerHTML: dial.hintText
				}, content );
			button.className="portal_button";
			bi.updateToPortalStyleButtonWithoutClick(button,"",dial.name);	
			var btn=document.getElementById(dial.name);
			if(dial.width&&dial.width!="")
				button.style.width = dial.width + "px";
			if ( instance ) {
				instance.rt.targetDOM = btn;
			}
			if ( dial.script ) {
				env.scriptEngine.Runtime.ScriptManager.setScript( instance, dial.script );
			}
			break;
		case "checkbox":
			d.style.textAlign = "center";
			var innerTable = _.table( _.format( "{[!padding:0px]}!border-collapse:collapse;padding:0px;width:100%;height:100%" ), d );
			var content = innerTable.td(0,0);
			content.style.textAlign = "center";
			content.style.fontSize=12;
			var checkbox =_.crt( "input", { type:"checkbox"},content );
			content.appendChild(document.createTextNode(dial.hintText));
			if(dial.isChecked=="true"){
				checkbox.checked="checked";
			}	
			if ( instance ) {
				instance.rt.targetDOM = checkbox;
			}
			if ( dial.script ) {
				env.scriptEngine.Runtime.ScriptManager.setScript( instance, dial.script );
			}
			break;
		case "radiobox":
			d.style.textAlign = "center";
			dial.data = eval( dial.data );
			var innerTable = _.table( _.format( "{[!padding:0px]}!border-collapse:collapse;padding:0px;width:100%;height:100%" ), d );
			var content = innerTable.td(0,0);
			content.style.textAlign = "center";
			content.style.fontSize=12;
			content.appendChild(document.createTextNode(dial.hintText));

			for(var i=0;i< dial.data.length; i++){
				var radio;
				if(i==0){
					radio=document.createElement( "<input type='radio' checked='checked' name='"+dial.name+"' >");
				}else{
					radio=document.createElement( "<input type='radio' name='"+dial.name+"' >");
				}
				radio.value=dial.data[i][1];
				var lb=document.createElement("label");
				lb.style.width=10;
				content.appendChild(lb);
				content.appendChild(radio);
				content.appendChild(document.createTextNode(dial.data[i][0]));
				if ( instance ) {
				    instance[i].rt.targetDOM = radio;
			    }
				if ( dial.script ) {
					env.scriptEngine.Runtime.ScriptManager.setScript( instance[i], dial.script );
				}
			}
			break;
		case "slider":
			//d.style.textAlign = "center";
			dial.data = eval( dial.data );
			var innerTable = _.table( _.format( "{[!padding:0px]}!border-collapse:collapse;padding:0px;width:100%;height:100%" ), d );
			var content = innerTable.td(0,0);
			content.style.textAlign = "center";
			content.style.fontSize=12;
			content.appendChild(document.createTextNode(dial.hintText));
		    content.style.verticalAlign="top";
			var minValue=null,maxValue=null,distance=null,step=null,value=null;
			if(dial.maxValue_input.length>0){//最大值
				maxValue=parseFloat(dial.maxValue_input);
			}else{
				maxValue=parseFloat(dial.data[0][0]);
			}
			if(dial.minValue_input.length>0){//最小值
				minValue=parseFloat(dial.minValue_input);
			}else{
				minValue=parseFloat(dial.data[0][1]);
			}
			if(dial.distance_input.length>0){//间隔间值
				distance=parseFloat(dial.distance_input);
			}else{
				distance=parseFloat(dial.data[0][2]);
			}
			if(dial.step_input.length>0){//步长
				step=parseFloat(dial.step_input);
			}else{
				step=parseFloat(dial.data[0][3]);
			}
			if(dial.minValue_input.length>0){//默认值
				value=parseFloat(dial.dfValue_input);
			}else{
				value=parseFloat(dial.data[0][4]);
			}
			var basedivWidth=d.clientWidth;
			var basedivHidth=d.clientHeight;
			var slider =new Slider({
			           	targetDiv:content,//复层容器
                        width:dial.width,//控件宽度
                        maxValue: maxValue,//最大值
                        minValue: minValue,//最小值
                        distance:distance,//间隔间值
                        step:step,//间隔间值
                        value:value,//默认值
                        layout:dial.layout,//方向
                        Label:dial.hintText,//标签
                        unit:dial.unit_input,//单位
                        basedivWidth:basedivWidth,//仪表板DIV宽度
                        basedivHidth:basedivHidth,//仪表板DIV高度
						name:dial.name//对象名称
                       });
            
			slider.create();
			var slider_div=document.getElementById("base_div_"+slider.name);
			if ( instance ) {
				    instance.rt.targetDOM = slider_div;
			   }
			if ( dial.script ) {
					env.scriptEngine.Runtime.ScriptManager.setScript( instance, dial.script );
			}
			sliders.push(slider);
		
			break;
		case "url":
			var iframe = _.crt( "iframe", {
				frameborder: "0",
				noresize: "noresize",
				scrolling: "yes"
			}, d, "margin:-10px" );
			// 避免子页面脚本错误，这里全部屏蔽
			_.bindEvent( iframe.contentWindow, "load", function() {
				this.onerror = _.K( false );
			} );
			iframe.src = dial.url;
			iframe.style.width = dialWidth + "px";
			iframe.style.height = dialHeight + "px";
			break;
		case "easkpi":
			d.style.textAlign = "center";	
			d.style.backgroundColor = "#ffffff";				
			if( dial.errorMsg != "" ) {
				//有业务逻辑错误,直接返回错误信息.
				d.innerHTML = dial.errorMsg;
				break;
			}
			var selectHeight = 40;			
			d.innerHTML = 
				'<object type="application/x-shockwave-flash" sue="kpi_flash" valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" '+
				'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" ' +
				//' width="' +  calcWidth(dialWidth,dialHeight,selectHeight) +  '" height="' +  
				 //calcHeight(dialWidth,dialHeight,selectHeight) + 
				' width="200" height="150" >' +  				
				'<param name="movie" value="' + getFlashURL(0,dial) + '">' +
				'<param name="quality" value="High"><param name="wmode" value="transparent" />' +
				'</object><br>';
			var kpi_flash = _.select( d, "sue", 1, "kpi_flash" );
			var select = _.crt( "select", null, d, "font-size:12px" );
			var len = dial.bizDate.length; 
			for( var i = 0; i < len; i++ ) {
				select.add( new Option( dial.bizDate[i],dial.bizDate[i] ) );
			}
			_.bindEvent( select, "change", function() {
				kpi_flash.movie = getFlashURL( select.selectedIndex, dial );
			});
			break;
		//指标监控显示 bruce_sha 2010-01-18
		case "kpiMonitor":
			//debugger;
			//用作指标监控的标准通讯Post
			var post = _.compose( function( cfg ) {
				cfg.url || ( cfg.url = env.url );
				cfg.json.servletType = env.servletType;
				cfg.json.pageId = env.pageId;
				cfg.json.id = dial.id;
				return cfg;
			}, _.post );
			refreshKPIMonitor( d, dial, post, env.urlSeparator );
			break;
	}
	bi.tryResetBaseIFrameHeight( Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight, window.screen.availHeight - 140 ) );
	//重新计算Flash的高宽
	//规则：采用 宽:高 为 2:1的比例显示，注意：去除下拉框的高度
	function calcWidth( width, height, selectHeight ) {
  	  height = height - selectHeight;
	  if(width > 2 * height) 
   	     return height * 2;
	  else
	     return width;
	}
	
	function calcHeight( width, height, selectHeight ) {
  	  height = height - selectHeight;
	  if(width > 2 * height) 
   	     return height;
	  else
	     return width / 2;
	}
    function doChart(chartDiv,chartType,src){
        var width=dialWidth;
        var height=dialHeight;
    	switch(chartType)
    	{
		  case "Bar":{//柱状图 Bar2D
			   var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSColumn2D.swf", "MSColumn2D",width,height);
			   chart.setDataXML(src);
			   chart.render(chartDiv);
			   break;									
		}
		 case "BarH":{//"柱状图（水平）"
		       var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSBar2D.swf", "MSBar2D",width, height);
		       chart.setDataXML(src);		   
		       chart.render(chartDiv);
			   break;
		}
		 case "Bar3D":{//"3D柱状图
			   var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSColumn3D.swf", "MSColumn3D",width, height);
		       chart.setDataXML(src);		   
		       chart.render(chartDiv);
		       break;
		 }
		 case "StackedBar":{//"叠加柱状图"
			   var chart = new FusionCharts("../dashboard/FusionCharts/FCF_StackedColumn2D.swf", "StCol2D",width, height);
			   chart.setDataXML(src);		   
			   chart.render(chartDiv);
			   break;
	    }
		case "StackedBarH":{//"叠加柱状图（水平）"
				var chart = new FusionCharts("../dashboard/FusionCharts/FCF_StackedBar2D.swf", "StBar2D", width, height);
				chart.setDataXML(src);		   
				chart.render(chartDiv);
				break;
		}
		case "Line":{//"折线图"
				var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSLine.swf", "MSLine", width, height);
				chart.setDataXML(src);		   
				chart.render(chartDiv);
				break;
		}
		case "Area":{//"区域图"
				var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSArea2D.swf", "MSArea2D", width, height);
				chart.setDataXML(src);	   
				chart.render(chartDiv);
				break;
		}
		case "StackedArea":{//"叠加区域图"
				var chart = new FusionCharts("../dashboard/FusionCharts/FCF_StackedArea2D.swf", "StArea2D", width, height);
				chart.setDataXML(src);		   
				chart.render(chartDiv);
				break;
		}
		case "BarLine":{//"柱线图"
				var chart = new FusionCharts("../dashboard/FusionCharts/FCF_MSColumn3DLineDY.swf", "Col3DLineDY",width, height);
				chart.setDataXML(src);		   
				chart.render(chartDiv);
				 break;
		}default :{//jfreechart
				chartDiv.innerHTML =src;
				break;
			}
    }
    }
	//显示KPI图形
	function doKPI(div,rs,selected){
		var md_array=new Array();//主维度
		var split1="@/";
        var split2="@//";
        var split3="@///";

	    var index=selected;
	    d.style.textAlign = "center";	
		//d.style.backgroundColor = "#E3E3DF";
		div.style.overflow="auto";
		div.style.textAlign = "center";
		var options="";
		var objectsrc="";
		var error=false;
		var massage="";
		if(rs.error==null || rs.error=="undefined")
		   {//构造关联下拉框
				var items=rs.split(split3);
				var count=0;
				for(var i=0;i<items.length;i++)
					{
						var item=items[i].split(split2);
						for(var z=0;z<item.length;z++)
							{
								var itemValue=(item[z].split(split1));
								addToArray(itemValue[0],md_array);
								if(itemValue[0]==md_array[index])
								{//以第一条记录作为初始显示图形
									 var temp=itemValue[1].split(",");
									 if(itemValue[2]=="ok")
										{//如果取回的参数合法，则填充图形
											var displayType=itemValue[6];
											var chartType=itemValue[7];
											var KPIHL=itemValue[8]
											if(itemValue[5]=="undefind")
											{
											    itemValue[5]="";
											 }
											if(displayType=="KPI")
											{											       
												objectsrc=objectsrc+"<td align=\"center\"><object valign='left' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0' width='200px' height='150px'>";
														  objectsrc+="<param name=\"movie\" value=\"../dashboard/bi_kpi_ybp.swf?";
														  objectsrc+="Unit="+itemValue[5].replace(/\%/g,"%25");
														  objectsrc+="&bgcolor=0xffffff&menuType=0&numValue="+temp[3]+"&title="+itemValue[4];
														  objectsrc+="&numMin="+temp[0]+"&numMax="+temp[4]+"&numAlerm="+temp[2]+"&numDanger="+temp[1]+itemValue[3]+"\">";
														  objectsrc+="<param name='quality' value='High'><param name='wmode' value='transparent' /></object></td>";	
											   count=count+1;
											}else
											{
												var color=getHLD(i,temp,chartType,KPIHL);
												var toolTip=getToolTip(chartType,temp[3],temp[0],temp[1],temp[2],temp[4]);
												objectsrc=objectsrc+'<td align="center"><object valign="left" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="200px" height="150px">';
												objectsrc+='<param name="movie" value="../dashboard/bi_kpi_hld.swf?xmlInfo=<root><color>'+color+'</color><bgcolor>0xffffff</bgcolor><label>'+itemValue[5].replace(/\%/g,"%25")+'</label><menuType>0</menuType><name>'+itemValue[4]+'</name><tooltip>'+toolTip+'</tooltip></root>"';
												objectsrc+='<param name="quality" value="High"><param name="wmode" value="transparent" /></object></br></td>';	
											   count=count+1;
											}
										}else
										{
										objectsrc=objectsrc+"<td align=\"center\" style=\"WIDTH:300px\"><font color=\"#FF0000\">"+itemValue[3]+"</font></br></br>"+itemValue[4]+"</td>";	
										}
									   }
									 }
									
								 }	
                objectsrc="<TR>"+objectsrc+"</TR>";
                
				div.innerHTML = "<TABLE style=\"font:12px;width:"+count*200+"px;height:170px\">"+objectsrc+"</TABLE>";  
                
				var select = _.crt( "select", null, div, "font-size:12px" );
				for(var z=0;z<md_array.length;z++)
				{
					select.add( new Option( md_array[z],md_array[z] ) );
				}			  	    
		        select.options[index].selected="selected";						 
			    _.bindEvent( select, "onchange", function() { doKPI(div,rs,select.selectedIndex)});
			}
				
							 
	}
	//将主维度添加到数组
	   function addToArray(value,md_array){
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
	    	var chartType=chartType;
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
	function doBlur() {
		if ( focusDiv ) {
			focusDiv.style.cssText = focusDiv.$cssText;
		}
		focusDiv = null;
	}
	
	function getFlashURL( index, r ) {
		if( index < 0 || r.bizDate.length < index + 1 )
			return "";
		return "../dashboard/bi_easkpi_ybp.swf?" +
				"Unit=" + encodeURIComponent( r.unit ) + 
				"&mytype=" + r.showPercent +
				"&bgcolor=0xffffff&menuType=0"+
				"&numValue=" + r.numValue[index].toFixed( r.displayPrecision ) +
				"&pNum=" + r.displayPrecision + 
				"&title=" + encodeURIComponent( r.title ) +
				"&numMin=" + r.numMin[index].toFixed( r.displayPrecision ) +
				"&numMax=" + r.numMax[index].toFixed( r.displayPrecision ) +
				"&numAlerm=" + r.numAlerm[index].toFixed( r.displayPrecision ) +
				"&numDanger=" + r.numDanger[index].toFixed( r.displayPrecision ) +
				"&colorIII=" + r.colorIII[index] + 
				"&colorII=" + r.colorII[index] + 
				"&colorI=" + r.colorI[index];	
	}
	
	function getLinkURL( type, URI, reportType ) {
		var url = "";
		var servletURL = env.url;
		switch ( type )
		{
			case "url":
				url = URI;
				break;
			case "piece":
				url = "../html/piece.htm?path=" + URI + "&url=" + servletURL;
				break;				
			case "dashboard":
				url = "../dashboard/show_dashboard.htm?requestType=get&url=" 
					+ servletURL + "?servletType=BIDashBoard&dashboard_path=" + URI + "&random=" + Math.round(Math.random() * 1000000);
				break;
			case "report":
				var reportServletType = "report";
				if( reportType && reportType == "ext" )
					reportServletType = "extReport";
				else if( reportType && reportType == "dupont" )
					reportServletType = "dupontReport";
				url = "../html/report_loader.htm?servletURL=" 	
					 + servletURL 
					 + "&load=" + servletURL
					 + "?servletType=" + reportServletType + "&repositoryPath=" + URI;
				break;
		}
		return url;
	}
	
	function doLink( type, URI, reportType ) {
		var url = getLinkURL(type, URI, reportType);
		if (url != "") {
			// 如果tabs为空,则不是从bi中心进入,此时弹出窗口
			var tab_tem=null;
			if(window.tabs){//从bi中心进入
				tab_tem=tabs;
			}
			if(parent.tab_include){//从portal页签进入
				tab_tem=parent.tab_include;
			}
			if (tab_tem) {
				// 判断当前链接是否已经打开，没打开则新增个页签
				var open = false;
				var width = tab_tem.el.dom.scrollWidth - 50;
				var parentDashboard_Id = tab_tem.getActiveTab().id;
				var newTitle = '<div id="' + (parentDashboard_Id + dial.text)
						+ '"title="' + dial.text + '">' + dial.text + '</div>'
				for (var i = 0; i < tab_tem.items.length; i++) {
					var item = tab_tem.items.items[i].title;
					if (item == newTitle) {
						open = true;
						tab_tem.setActiveTab(i);
						break;
					}
				}
				if (!open) {
					//仪表板不需要内嵌iframe				
						tab_tem.add({
									title : newTitle,
									html : '<iframe  width="' + width
											+ '" height="1200" src="' + url
											+ '"   border=1></iframe>',
									listeners : {
										activate : resetIFrameHeight
									}
								});
						tab_tem.setActiveTab(tab_tem.items.length - 1);
					
				}
			} else {
				var sArg = 'dialogWidth:' + screen.availWidth
						+ 'px; dialogHeight:' + screen.availHeight
						+ 'px; help:no; scroll:yes; status:no; resizable:yes;';
				window.showModelessDialog(url, null, sArg);
			}
		}
	}
	function resetIFrameHeight() {
		document.frames.frameElement.style.height = 1300 + "px";
	}
	function createTitleBox( title, d, penetrate ) {
		d.style.border = "none";
		var csn = Sue.config.cs.name;
		var table = _.table( _.format( "A|[!width:5px;padding:0px;?B($)no-repeat]|B|background:url(../img/ui-web/dashboard_cell_title_$.gif) |@{?A(left_%s)[!?B(middle_%s)repeat-x]?A(right_%s)!height:20px;}!border-collapse:collapse;width:100%", csn, csn, csn ), d );
		//var titleTable = _.table( _.format( "A|!padding-$:0px;padding-top:0px|@{[?A(left)][~%s][?A(right);text-align:right]}!border-collapse:collapse;width:100%;font-size:12px", title.length > 15 ? title.substring(0, 15) + "..." : title ), table.td( 0, 1 ) );
		var titleTable = _.table( _.format( "{[!padding-left:0px;width:10px;][!width:100%;~%s][!padding-right:0px;width:10px;text-align:right;]}!border-collapse:collapse;width:100%;font-size:12px;text-align:center;", title.length > 15 ? title.substring(0, 15) + "..." : title ), table.td( 0, 1 ) );
		if ( penetrate ) {
			var a = _.crt( "a", { innerHTML: "穿透" }, titleTable.td( 0, 2 ), "color:#F00;cursor:pointer;text-decoration:none" );
			_.bindEvent( a, "click", function() {
				_.post({
					url: penetrate.env.url,
					json: {	
						servletType: penetrate.env.servletType, 
						pageId: penetrate.env.pageId,
						id: penetrate.id,
						command: "penetrate"
					},
					callback: function( r ) {
						// 有些机器在modal dialog上不能正常执行window.open(出现一闪自动关闭的情况),这里还是改成modal dialog
						var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:yes;"; 
						window.showModalDialog(r, null, sArg);
						//window.open( r, null, _.format( "left=0,top=0,width=%s,height=%s,help=no,scroll=no", screen.availWidth - 10, screen.availHeight - 30 ) );
					}
				} );
			});
		}
		var div = d.$body = _.div( {
			parent: d,
			cssText: _.format( "table-layout:fixed;overflow:hidden;border:solid 1px #D3DFE9;padding:0px")
		} );
		div.style.width = dialWidth + "px";
		div.style.height = (dialHeight - 21)<0 ? 200:(dialHeight - 21) + "px";
		div.$cssText = div.style.cssText;
		return {
			table: table,
			div: div
		};
	}
}
//滑动条组件
Slider=function(cfg)
  {
     this.targetDiv=cfg.targetDiv?cfg.targetDiv:"";//父层div
	 this.width=cfg.width?cfg.width:100;//滑动条宽度
	 this.minValue=cfg.minValue?cfg.minValue:0;//最小值
	 this.maxValue=cfg.maxValue?cfg.maxValue:100;//最大值
	 this.distance=cfg.distance?cfg.distance:10;//刻度间隔
	 this.step=cfg.step?cfg.step:5;//刻度间隔
	 this.layout=cfg.layout?cfg.layout:"h";//v垂直，h水平 
	 this.value=cfg.value?cfg.value:0;//当前值
	 this.name=cfg.name?cfg.name:"";//对象名称
	 this.Label=cfg.Label?cfg.Label:"";//标签
	 this.unit=cfg.unit?cfg.unit:"";//单位
	 this.basedivWidth=cfg.basedivWidth;//仪表板底层宽度
	 this.basedivHidth=cfg.basedivHidth;//仪表板底层高速
	 
	 this.distanWidth=null;//间隔宽度（px）
	 this.onstart=null;//是否开始拖动
 	 this.gt_count=null;//刻度个数
	 this.init_position=null;//滑块对象初始位置
	 this.mousedown_position=null;
	
  }
Slider.prototype = {
	create:function () 
	{
		 try 
		 {
		 	        
				    var _self=this;
					_self.minValue=_self.Math_round(_self.minValue);//保留一位小数
					_self.maxValue=_self.Math_round(_self.maxValue);//保留一位小数
					_self.value=_self.Math_round(_self.value);//保留一位小数
					_self.gt_count=(_self.Math_round(_self.maxValue-_self.minValue))/_self.distance;
					_self.distanWidth=_self.width/_self.gt_count;
					_self.width=_self.distanWidth*_self.gt_count+20;
				    if(_self.layout=="h")
				    { 
				    	var div_left=(_self.basedivWidth-_self.width)/2;
					    var head='<div style="position:absolute; width:'+_self.width+'px; height:44px; z-index:70;left:'+div_left+'px;">'
									+'<div id="base_div_'+_self.name+'"style="position:absolute; width:'+_self.width+'px; height:19px; z-index:80;left:0px;padding-left:0px;">'
					                +'<div id="'+_self.name+'" style="cursor:hand;position:absolute; width:20px; height:20px; z-index:90;left:0px; top:-3px; background-image: url(../dashboard/images/slider_top.gif);" id="top_div"></div> '
									+'<img src="../dashboard/images/slider_head_v.gif" width="10" height="19" /><img src="../dashboard/images/slider_begin_v.gif" width="'+_self.distanWidth/2+'" height="19" />'
						var body="";
						var tail='<img src="../dashboard/images/slider_end_v.gif" width="'+_self.distanWidth/2+'" height="19" /><img src="../dashboard/images/slider_tail_v.gif" width="10" height="19" /></div><br/>'
						            +'<table  style="width:100%; border:0; font-size:12px" ><tr><td  align="left">'+_self.minValue+'</td><td  align="right">'+_self.maxValue+'</td></tr><tr><td colspan="2" align="center" id="'+_self.name+'_value"></td></tr></table></div>';
						for(var i=0;i<_self.gt_count-1;i++)
						{
							body=body+'<img src="../dashboard/images/slider_split_v.gif" width="'+_self.distanWidth+'" height="19" />';
						}	
						if(typeof(_self.targetDiv)!="object")
						{
					     _self.targetDiv=document.getElementById(_self.targetDiv);
				       	}
						_self.targetDiv.innerHTML=_self.Label+"(单位："+_self.unit+")<br/><br/>"+head+body+tail;
						_self.targetDiv.onselectstart=function(){return false;}
						
				   }else if(_self.layout=="v"){
				    	var div_top=(_self.basedivHidth-_self.width)/2;
				    	var div_left=(_self.basedivWidth-40)/2;
				   	    var head='<DIV style="Z-INDEX: 69;top: '+(div_top-25)+'px;left:'+div_left+'px;TEXT-ALIGN: center;WIDTH: 40px; POSITION: absolute; HEIGHT:20px; ">'+_self.Label+'(单位：'+_self.unit+')</DIV><DIV  style="Z-INDEX: 70;top: '+div_top+'px; WIDTH: 57px; POSITION: absolute; HEIGHT: '+_self.width+'px; ">' +
				   	    		 '<table width="100" style="font-size:12px" height="'+_self.width+'" border="0" cellpadding="0" cellspacing="0"><tr><td width="20" rowspan="3">' +
				   	    		 '<div  id="base_div_'+_self.name+'" style="position:absolute; top:0px; width:19px; height:'+_self.width+'px;left:-3px;Z-INDEX: 80;">  ' +
				   	    		 '<img src="../dashboard/images/slider_tail_h.gif" width="19" height="10" />'+
		                         '<img src="../dashboard/images/slider_end_h.gif" width="19" height="'+_self.distanWidth/2+'" />';
				   	    var body="";
				   	    var tail='<img src="../dashboard/images/slider_begin_h.gif" width="19" height="'+_self.distanWidth/2+'" />'+
				   	             '<img src="../dashboard/images/slider_gead_h.gif" width="19" height="10" />'+
	                             '<div id="'+_self.name+'" style="cursor:hand;position:absolute; top:'+(_self.width-20)+'px; width:20px; height: 20px; left:-3px; Z-INDEX: 90; background-image: url(../dashboard/images/slider_top.gif);"></div>'+
	                             '</div></td><td width="80" height="20">'+_self.maxValue+'</td></tr><tr><td height="'+(_self.width-40)+'" align="center" id="'+_self.name+'_value"></td>'+
                                 '</tr><tr><td width="80" height="20">'+_self.minValue+'</td></tr></table></DIV>';
				   	    for(var i=0;i<_self.gt_count-1;i++)
						{
							body=body+'<img src="../dashboard/images/slider_split_h.gif" width="19" height="'+_self.distanWidth+'" />';
						}
						if(typeof(_self.targetDiv)!="object")
						{
					     _self.targetDiv=document.getElementById(_self.targetDiv);
				       	}
						_self.targetDiv.innerHTML=head+body+tail;
						_self.targetDiv.onselectstart=function(){return false;}										    
				   }
				       _self.init_position=_self.getElementPos(document.getElementById(_self.name));
						
						document.getElementById(_self.name).onmousedown=function(){
							_self.onMouseDown(_self);
						}; 
						document.getElementById(_self.name).onmouseup=function(){
							_self.onMouseUp(_self); 
						}
						document.getElementById("base_div_"+_self.name).onmousemove=function(){
						   _self.onMouseMove(_self); 
					    }
					    /**document.getElementById("base_div_"+_self.name).onmouseout=function(){
						_self.onMouseOut(_self,"base"); 
						}
						document.getElementById(_self.name).onmouseout=function(){
						_self.onMouseOut(_self,"top"); 
						}	
						*/
					    document.getElementById("base_div_"+_self.name).onmousedown=function(){
						   _self.onclick(_self,"button");
					    }
			}catch(e){
				alert("滑动条"+e.message+"请重新输入!");
				return;
			}
		 _self.setValue(_self,_self.value,"create");
	},//end function 
	Math_round:function(value){//四舍五入运算,保留整数
	  return Math.round(value);
	},
	mouseCoords:function (ev){
			if(ev.pageX || ev.pageY)
			{ 
				return {x:ev.pageX, y:ev.pageY}; 
			} 
			return { 
			x:ev.clientX + document.body.scrollLeft - document.body.clientLeft, 
			y:ev.clientY + document.body.scrollTop - document.body.clientTop 
			}; 
	 },
	 getElementPos:function (_object)   {  
		var _left = parseInt(_object.offsetLeft, 10); 
		var _top = parseInt(_object.offsetTop, 10); 
		while(_object = _object.offsetParent) 
		{ 
		_left += parseInt(_object.offsetLeft, 10); 
		_top += parseInt(_object.offsetTop, 10); 
		if(_object != document.body) 
		{ 
		_left -= parseInt(_object.scrollLeft, 10); 
		_top -= parseInt(_object.scrollTop, 10); 
		} 
		} 
		return {
		x:_left,
		y:_top
		}
    } ,
	 getValue:function(_self){
			 return _self.value;
	 },
	 onclick:function(_self){
	 	var ev= ev || window.event; 
		var mousePos = _self.mouseCoords(ev); 
		var slider=document.getElementById(_self.name);
		if(_self.layout=="h")
		{ 
			 if((_self.init_position.x+10)<=mousePos.x && mousePos.x<=(_self.init_position.x+_self.width-10))
			 {
			  slider.style.left=mousePos.x-_self.init_position.x-10;
			  var index=slider.style.left.indexOf("px");
			  var slider_left=parseInt(slider.style.left.substr(0,index));
			  _self.value=(_self.gt_count*_self.distance)*(slider_left/(_self.width-20))+_self.minValue;
			  var sliderValue=document.getElementById(_self.name+"_value");	
		      sliderValue.innerText ="值="+_self.Math_round(_self.value); 	
			 } 
		}else if(_self.layout=="v"){
			 if((_self.init_position.y+10)>=mousePos.y && mousePos.y>=(_self.init_position.y-_self.width+30))
			 {
			  slider.style.top=(_self.width-20)-(_self.init_position.y-mousePos.y+10);
			  var index=slider.style.top.indexOf("px");
			  var slider_top=parseInt(slider.style.top.substr(0,index)); 
			  _self.value=(_self.gt_count*_self.distance)*((_self.width-20-slider_top)/(_self.width-20))+_self.minValue;
			  var sliderValue=document.getElementById(_self.name+"_value");	
		      sliderValue.innerText ="值="+_self.Math_round(_self.value); 	
			 }
		}
	 },
	 setValue:function (_self,newValue,type){
	 	    var slider=document.getElementById(_self.name);
	 	    if(type=="create"){//首次创建组件		 
				 if(_self.layout=="h"){
				 	 var index=slider.style.left.indexOf("px");	
				     var slider_left=parseInt(slider.style.left.substr(0,index));
				     var width=((newValue-_self.minValue)/(_self.gt_count*_self.distance))*(_self.width-20);
				     slider.style.left =slider_left+width;
				 }else{
				 	 var index=slider.style.top.indexOf("px");	
				 	 var slider_top=parseInt(slider.style.top.substr(0,index));
				     var width=((newValue-_self.minValue)/(_self.gt_count*_self.distance))*(_self.width-20);
				     slider.style.top =slider_top-width;
				 }
			 }else if(type=="reset"){//重新设置组件值
			 	if(newValue>_self.value)
			 	{    var creaseValue=newValue-_self.value;
			 		 if(_self.layout=="h")
			 		 {
					 	 var index=slider.style.left.indexOf("px");	
					     var slider_left=parseInt(slider.style.left.substr(0,index));
					     var width=((creaseValue)/(_self.gt_count*_self.distance))*(_self.width-20);
					     slider.style.left =slider_left+width;
				    }else
				    {
					 	 var index=slider.style.top.indexOf("px");	
					 	 var slider_top=parseInt(slider.style.top.substr(0,index));
					     var width=((creaseValue)/(_self.gt_count*_self.distance))*(_self.width-20);
					     slider.style.top =slider_top-width;
				    }
			 	}else if(newValue<_self.value)
			 	{
			 		var decreaseValue=_self.value-newValue;
			 		 if(_self.layout=="h")
			 		 {
					 	 var index=slider.style.left.indexOf("px");	
					     var slider_left=parseInt(slider.style.left.substr(0,index));
					     var width=((decreaseValue)/(_self.gt_count*_self.distance))*(_self.width-20);
					     slider.style.left =slider_left-width;
				    }else
				    {
					 	 var index=slider.style.top.indexOf("px");	
					 	 var slider_top=parseInt(slider.style.top.substr(0,index));
					     var width=((decreaseValue)/(_self.gt_count*_self.distance))*(_self.width-20);
					     slider.style.top =slider_top+width;
				    }
			 	}
			  
			 }
			_self.value=newValue;
			var sliderValue=document.getElementById(_self.name+"_value");	
		    sliderValue.innerText ="值="+_self.Math_round(_self.value); 	
	 },
	 onMouseDown:function(_self){
	 	       var ev= ev || window.event; 
			   var mousePos = _self.mouseCoords(ev);   
	 	       _self.mousedown_position=mousePos;
			   _self.onStart=true;
	 },
	 onMouseUp:function (_self){
			   _self.onStart=false;
	 },	
	 onMouseOut:function (_self,obj){
	 	       if(obj=="base"){
			    _self.onStart=false;
			   }
	 },	 
	 onMouseMove:function (_self){ 
	 	          
			if(_self.onStart)
			{   
				var currentValue=null;
				var ev= ev || window.event; 
			    var mousePos = _self.mouseCoords(ev);   
				var slider=document.getElementById(_self.name);	
				var pos_slider=_self.getElementPos(slider);		
			    if(_self.layout=="h")//横向
				{   				
					if(_self.init_position.x<=pos_slider.x && pos_slider.x<=(_self.init_position.x+_self.width-20))
					{
						var index=slider.style.left.indexOf("px");
						var slider_left=parseInt(slider.style.left.substr(0,index));
						var new_position=slider_left+(mousePos.x-_self.mousedown_position.x);
						if(new_position>=0 && new_position<=(_self.width-20)){
						  slider.style.left =new_position;
						}
						_self.mousedown_position.x=_self.mousedown_position.x+(mousePos.x-_self.mousedown_position.x);
						currentValue=(_self.gt_count*this.distance)*((pos_slider.x-this.init_position.x)/(_self.width-20))+_self.minValue;
					}else if(pos_slider.x<_self.init_position.x){
						currentValue=_self.minValue;		
					}else if(pos_slider.x>(_self.init_position.x+_self.width-20)){
						currentValue=_self.maxValue;		
					}	
					
	             }else//纵向
				 {   
				 	if(_self.init_position.y>=pos_slider.y && pos_slider.y>=(_self.init_position.y-_self.width-20))
					{
						var index=slider.style.top.indexOf("px");
						var slider_top=parseInt(slider.style.top.substr(0,index));
						var new_position=slider_top-(_self.mousedown_position.y-mousePos.y);
						if(new_position>=0 && new_position<=(_self.width-20)){
						  slider.style.top =new_position;
						}
						_self.mousedown_position.y=_self.mousedown_position.y+(mousePos.y-_self.mousedown_position.y);
						currentValue=(_self.gt_count*this.distance)*((this.init_position.y-pos_slider.y)/(_self.width-20))+_self.minValue;
					}else if(pos_slider.y<_self.init_position.y){
						currentValue=_self.maxValue;			
					}else if(pos_slider.x>(_self.init_position.y+_self.width-20)){					
						currentValue=_self.minValue;	
					}		

				 }	
			    if(_self.Math_round(currentValue)%_self.step==0){
			    	_self.value=_self.Math_round(currentValue);
			    	var sliderValue=document.getElementById(_self.name+"_value");	
				    sliderValue.innerText = "值="+_self.value; 	
			    }	
			}
}}
////////////////////
function runAllScript( scriptEngine ) {
	var se = scriptEngine;
	eval( se.Runtime.NameManager.getConstructContextScript( "se" ) );
	var a = se.Runtime.ScriptManager.exportAll(),
		page;
	for( var i = 0; i < a.length; i++ ) {
		if ( a[i].instance.name == "Page" ) {
			page = a[i];
		} else {
			runScript( a[i].instance, a[i].script );
		}
	}
	if ( page ) {
		runScript( page.instance, page.script );
	}
	
	function runScript( instance, script ) {
		var self = instance;
		try {
			eval( script );
		} catch ( e ) {
			if ( e instanceof se.Error ) {
				bi.portalDialog( e.message );
			} else {
				bi.portalDialog( e.message );
			}
		}
	}
}

function createScriptEngine( env ) {
	// 一个仪表板对应一个独立的脚本引擎
	env.scriptEngine = SubScriptEngine.anotherInstance();
	// 非静态分析模式
	env.scriptEngine.Runtime.debugMode( false );
	// 注入Page对象的脚本
	if ( env.pageScript ) {
		env.scriptEngine.Runtime.ScriptManager.setScript( env.scriptEngine.Runtime.getCurrentPage(), env.pageScript );
	}
}

function createScriptEngineDatasources( env ) {
	// 生成数据源对象
	for( var i = 0; i < env.datasources.length; i++ ) {
        env.scriptEngine.Runtime.Dashboard.Datasources.push( new env.scriptEngine.Types.Datasource( env.datasources[i] ) );
	}
	// 注入数据源的AJAX方法
	var dss = env.scriptEngine.Runtime.Dashboard.Datasources;
	for( var i = 0; i < dss.length; i++ ) {
		dss[i].rt = dss[i].rt || {};
		dss[i].rt.ajax = ajax;
	}
	
	function ajax( json ) {
		_.post( {
			url: env.url,
			async: false,
			json: _.extend( {
				pageId: env.pageId,
				servletType: env.servletType
			}, json || {} )
		} );
	}
}

var cellMap = {};

function createScriptEngineCells( env ) {
	_.map( _.find( _.id( env.layoutTable.match( /layout_table\d+/ )[0] ), function( x ) {
		return x.tagName && x.tagName.toLowerCase() == "td";
	} ), function( td ) {
		var cellName = td.cellName;
		var cell = null;
		if ( cellName ) {
			cell = new env.scriptEngine.Types.Cell( cellName );
			cell.rt = {
				td: td,
				setDial: function( instance ) {
					instance.rt.td = this.td;
					// 这里的仪表板图表和动态图形片段因为需要在运行期提供宽高参数，特殊处理，向服务端再请求一次
					if ( instance instanceof env.scriptEngine.Types.Dial.Chart || instance.rt.dial.type == "piece_chart_dynamic" ) {
						if(this.td.clientWidth==0||this.td.clientHeight==0)
							return;
						_.post( {
							url: env.url,
							json: {
								pageId: env.pageId,
								servletType: env.servletType,
								command: "init",
								width: this.td.clientWidth - 2,
								height: this.td.clientHeight - 2,
								id: instance.rt.dial.id
							},
							callback: function( r ) {
								instance.rt.dial = r;
								setDial( env, instance.rt.td, r, instance );
							}
						} );
					} else {
						setDial( env, instance.rt.td, instance.rt.dial, instance );
					}
				}
			};
			env.scriptEngine.Runtime.getCurrentCells().push( cell );
		}
		if ( td.id ) {
			cellMap[ td.id.match( /dashboard_element_\d+_(.*)$/ )[1] ] = {
				cell: cell,
				td: td
			};
		}
	} );
}

function createScriptEngineDials( env ) {
	// 生成组件对象
	for( var i = 0; i < env.dials.length; i++ ) {
		var dial = env.dials[i];
		var cell = cellMap[ dial.id ];
		var instance = null;
		var controlGroup=new Array();
		if ( dial.name ) {
			//组合控件单独处理,后续有需要可以用||添加
			if(dial.type=="radiobox")
			{   
				instance=new Array();
				dial.data = eval( dial.data );
				for(y=0;y< dial.data.length; y++)
				{		
				var instance_temp=null;
				var parentNode = cell
					? ( cell.cell = cell.cell || env.scriptEngine.Runtime.getCurrentCells().getAnonymousCell( true ) )
					: env.scriptEngine.Runtime.getCurrentHiddenArea();
				var dialType = dial.type;
				// 此处并未区分静态片段和动态片段，
				/^piece_/.test( dialType ) && ( dialType = "piece" );
				instance_temp = env.scriptEngine.Runtime.evalDial( dialType, dial.name );
				instance_temp.rt = {
					td: cell ? cell.td : null,
					dial: dial,
					// 防止闭包引用失败，AJAX代码包装了一层因子函数
					ajax: ( function( dial, cell, instance_temp ) {
						return function( json ) {
							_.post( {
								url: env.url,
								async: false,
								json: _.extend( {
									pageId: env.pageId,
									id: dial.id,
									servletType: env.servletType
								}, json || {} ),
								callback: function( r ) {
									if ( instance_temp.rt.td ) {
										setDial( env, instance_temp.rt.td, r, instance_temp );
									}
								}
							} );
						}
					} )( dial, cell, instance_temp )
				};
				parentNode[ instance_temp.name ] = instance_temp;
				parentNode._instanceName = instance_temp.name;
				instance.push(instance_temp);
				}			
			}else
				{
				var parentNode = cell
					? ( cell.cell = cell.cell || env.scriptEngine.Runtime.getCurrentCells().getAnonymousCell( true ) )
					: env.scriptEngine.Runtime.getCurrentHiddenArea();
				var dialType = dial.type;
				// 此处并未区分静态片段和动态片段，后续有需要可以添加
				/^piece_/.test( dialType ) && ( dialType = "piece" );
				instance = env.scriptEngine.Runtime.evalDial( dialType, dial.name );
				instance.rt = {
					td: cell ? cell.td : null,
					dial: dial,
					// 防止闭包引用失败，AJAX代码包装了一层因子函数
					ajax: ( function( dial, cell, instance ) {
						return function( json ) {
							_.post( {
								url: env.url,
								async: false,
								json: _.extend( {
									pageId: env.pageId,
									id: dial.id,
									servletType: env.servletType
								}, json || {} ),
								callback: function( r ) {
									if ( instance.rt.td ) {
										setDial( env, instance.rt.td, r, instance );
									}
								}
							} );
						}
					} )( dial, cell, instance )
				};
				parentNode[ instance.name ] = instance;
				parentNode._instanceName = instance.name;
		}
		}
		if ( cell ) {
			(function( env, td, dial, instance ) {
				// 这里的仪表板图表和动态图形片段因为需要在运行期提供宽高参数，特殊处理，向服务端再请求一次
				if ( dial.type == "chart" || dial.type == "piece_chart_dynamic" ) {
					if(td.clientWidth==0||td.clientHeight==0)
						return;
					_.post( {
						url: env.url,
						json: {
							pageId: env.pageId,
							servletType: env.servletType,
							command: "init",
							width: td.clientWidth - 2,
							height: td.clientHeight - 2,

							id: dial.id
						},
						callback: function( r ) {
							instance && ( instance.rt.dial = r );
							setDial( env, td, r, instance );
						}
					} );
				} else {
					setDial( env, td, dial, instance );
				}
			})( env, cell.td, dial, instance );
		}
	}
}
