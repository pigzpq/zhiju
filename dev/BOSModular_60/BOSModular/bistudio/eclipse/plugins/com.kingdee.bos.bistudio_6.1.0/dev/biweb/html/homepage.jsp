<%@ page session="true" contentType="text/html; charset=UTF-8"
import="com.kingdee.bos.ctrl.analysis.web.ajax.Constants,
com.kingdee.bos.ctrl.analysis.web.solution.BISystem,
com.kingdee.eas.cp.common.web.util.WebContextUtil,
java.util.*"
%>

<%
    String servletURL = request.getContextPath() + "/" + Constants.SERVLET_URL;
	String str = System.getProperty("isBIbench");
	String includePath = "../";
	String dashboard_jpg = "../img/ui-web/dashboard_banner.gif";
	boolean isBIbench = false;
	if(str != null && str.equalsIgnoreCase("true"))
	{
		isBIbench = true;
	}
	String colorSchemeName = "blue";
	// 读取portal的颜色方案，放到cookie里面
	// portal提供的方法只能获取到portal组的皮肤路径，我们需要一个适配器来转换为我们需要的色彩别名
	Map map = new HashMap();
	map.put( "01", "blue" );
	map.put( "02", "orange" );
	map.put( "03", "green" );
	map.put( "04", "red" );
	map.put( "01_simple", "blue" );
	map.put( "style1", "blue" );
	if ( BISystem.isEAS() ) {
		String path = WebContextUtil.getUserSkinPath( request );
		colorSchemeName = (String) map.get( path.substring( path.lastIndexOf( "/" ) + 1 ) );
	} else {
		colorSchemeName = "blue";
	}
	
	//菜单换肤
	String menuColor="";
	String menuBGColor="";
	String mouseoverBackgroundColor="";
	String imgPreName="img_pre_blue.gif";
	String imgNextName="img_next_blue.gif";
	String lableMenuButton="label_menubutton_blue.gif";
	String cssName="";
	if(colorSchemeName.equalsIgnoreCase("blue"))
	{
		menuColor="#015ea2";
		menuBGColor="#e7f3f8";
		mouseoverBackgroundColor="#b4dcfa";
		imgPreName="img_pre_blue.gif";
		imgNextName="img_next_blue.gif";
		lableMenuButton="label_menubutton_blue.gif";
	}else if(colorSchemeName.equalsIgnoreCase("orange"))
	{
		menuColor="#9d3207";
		menuBGColor="#fdf9f4";
		mouseoverBackgroundColor="#f8e7d1";
		imgPreName="img_pre_orange.gif";
		imgNextName="img_next_orange.gif";
		lableMenuButton="label_menubutton_orange.gif";
		cssName="../ext-2.0/resources/css/xtheme-orange.css";
	}if(colorSchemeName.equalsIgnoreCase("green"))
	{
		menuColor="#015513";
		menuBGColor="#effeea";
		mouseoverBackgroundColor="#cce9c2";
		imgPreName="img_pre_green.gif";
		imgNextName="img_next_green.gif";
		lableMenuButton="label_menubutton_green.gif";
		cssName="../ext-2.0/resources/css/xtheme-green.css";
	}if(colorSchemeName.equalsIgnoreCase("red"))
	{
		menuColor="#993434";
		menuBGColor="#fff3ed";
		mouseoverBackgroundColor="#fed5c6";
		imgPreName="img_pre_red.gif";
		imgNextName="img_next_red.gif";
		lableMenuButton="label_menubutton_red.gif";
		cssName="../ext-2.0/resources/css/xtheme-red.css";
	}
	
%>

<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
		<title>EAS BI中心</title>
		<%= "<script>document.cookie='BI_COLOR_SCHEME_NAME=" + colorSchemeName + "';</script>" %>	
		<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
		<link rel="stylesheet" type="text/css" href="../ext-2.0/resources/css/ext-all.css" />
		<link href="../css/worksheet.css" rel="stylesheet" type="text/css"></link>
	   	<link href="../css/ui-components.css" rel="stylesheet" type="text/css"></link>
	   	
		<script src="../js/bi_skin.js"></script>
		<script src="../dashboard/FusionCharts/js/FusionCharts.js"></script>
		<script src="../js/sue-main.js"></script>
		<script src="../js/sue-config.js"></script>
		<script src="../js/bi.js"></script>
		<script src="../js/sue-ui.js"></script>
		<script src="../js/bi_firstpage.js"></script>	   
        <script type="text/javascript" src="../ext-2.0/adapter/ext/ext-base.js"></script>
        <script type="text/javascript" src="../ext-2.0/ext-all.js"></script>
        
        <script src="../dashboard/script_engine.js"></script>
		<script src="../js/dashboard.js"></script>
 
	</head>
	 <body>
	  <div id="tool_div" style="height:20px;" style="margin-top:2px;"></div>
	  <div id="tabs" style="height:500px"></div>
	  <script>
	  // 由于要改变xsl里面的色彩方案，所以这里把原本的静态CSS改为动态注册
			_.css( _.format( "th.column-heading-even, th.column-heading-odd, th.column-heading-span, th.corner-heading, th.row-heading-even, th.row-heading-odd, th.row-heading-span, th.column-heading-even-right, th.row-heading-even-right, th.column-heading-span-right, th.row-heading-span-right, th.row-heading-heading, th.column-heading-heading, th.rownum-heading, th.rownum {background-color:%s;border:solid 1px #fff;}", Sue.config.cs[6] ) );
			_.css( _.format( "td.cell-even, td.cell-odd {border:solid 1px %s}", Sue.config.cs[6] ) );
			_.css( _.format( ".slicer_field, .page_field, .strategy_title, .report_msgdiv {background-color:%s} .filter_panel_container hr {color:%s} .filter_panel_container a {color:%s}", Sue.config.cs[7], Sue.config.cs[10], Sue.config.cs[11] ) );
		
			//ext换肤
			Ext.util.CSS.swapStyleSheet('theme','<%=cssName %>');		
			Sue.config.bi_progress_picture_path = "../img/ui-web/progress.gif";
			Sue.config.bi_message_box_path = "../js/msgbox.htm";
			var URL = "<%= request.getContextPath() + "/" + Constants.SERVLET_URL %>";
			var strUrl="";
			var strUrl2 = "";
			
			<%  /**如果从门户进入 */
				if(BISystem.isEAS()){
			%>	
			strUrl="../dashboard/show_dashboard.htm?requestType=get&url=/easportal/BIReport?servletType=BIDashBoard&dashboard_path=/";
			strUrl2 = "/easportal/BIReport?servletType=BIDashBoard&dashboard_path=/";
			/**con */
			<%}else{%>
			strUrl="../dashboard/show_dashboard.htm?requestType=get&url=/biportal/BIReport?servletType=BIDashBoard&dashboard_path=/";
			strUrl2 = "/biportal/BIReport?servletType=BIDashBoard&dashboard_path=/";
			<%}%>
			<%if(BISystem.isEAS() && BISystem.getCurrentUserNumber(request).equalsIgnoreCase("administrator"))
			{%>
			  document.getElementById("tabs").innerHTML= '<div style="height:700px;text-align=center;padding-top:100px;"><img border=0 src="<%=dashboard_jpg%>"/> </div>';
			  document.frames.frameElement.style.height=800+"px";
			<%}else{%>
			var itemViews=[];
			var itemManages=[];
			var menuView;
			var menuManage;
			var selectView;
			var valueCaption="";
			var systemViewManageDisable=true;
			var dashboardManageDisable=true;
			var themeAnalysisManageDisable=true;
			var biSystemConfigDisable=true;
			var menuSpan="";
            var viewid="";
            var tabs;
            var timer;		
			_.bindEvent( window, "onload", loadHomePage);
			//加载仪表板
	        function loadHomePage(){
	           setSkin();    
	           popedomValidate();  
			   //构造下拉菜单
			   menuSpan=_.crt( "span", null, document.getElementById("tool_div"), "font-size:12px;position:absolute;right:20px;border:none;width:180px;background:none;padding:0px 0px 20px 0px" );	 
			   //视图菜单项  
			  _.post({
		  			url:"<%= servletURL %>",
					beforeStart: _.Z,
			        afterEnd: _.Z,
					json:{	    
						  type: "action",
	                      servletType: "BIFirstPage",		
						  action: "getUserView" 
						  },
					callback: function( r ) 
						  {   
						      var viewid="";
							  var views=r.split(split3);
							  for(var i = 0; i < views.length; i++)
							  {
							      var view=views[i].split(split2);
							      value=view[0];
							      caption=view[1];
							      if(i==0){//缺省视图
							         viewid=(value.split("#"))[0];
							         valueCaption=caption;
							      }
							      itemViews.push( {
							            value:value,
										caption: caption,
										selected: false,
										disable: false,
										click: onViewClick
									} );
							   }
							  menuView = Sue.ui.menu( {items:itemViews,single: true,asynchronism:true,backgroundColor:"<%=menuBGColor %>",mouseoverBackgroundColor:"<%=mouseoverBackgroundColor %>",menuColor:"<%=menuColor %>"} );
							  //视图选择框
						      selectView=Sue.ui.ext.selectableLabel({
								    parent:menuSpan,
								    caption:"方案：",
								    valueCaption:valueCaption,
								    panel:menuView.root,
								    color:"<%=menuColor%>",
								    bgcolor:"#ffffff",
								    click:function (){
								       menuView.root.root.style.visibility="hidden";
								       menuView.clearItems();
								       reloadItemViews()
								    }
							    });
							    openDashboardByView(viewid);  			  
				                   //管理菜单项
				                   itemManages.push( {
										caption: "视图管理",
										selected: false,
										disable: false,
										click: function(){
										  manageClick("ViewManage");
										}
									} );
								   //如果有权限则加载该菜单
								   if(!systemViewManageDisable){
									   itemManages.push( {
													caption: "系统视图管理",
													selected: false,
													disable: systemViewManageDisable,
													click: function(){
													  manageClick("SystemViewManage");
													}
												} );
									}
								 
								 //如果有权限则加载该菜单
								  if(!dashboardManageDisable){
								   itemManages.push( {
												caption: "仪表板管理",
												selected: false,
												disable: dashboardManageDisable,
												click: function(){
												  manageClick("DashboardManage");
												}
											} );
									}
								  //如果有权限则加载该菜单
								  if(!themeAnalysisManageDisable){
								   itemManages.push( {
												caption: "主题管理",
												selected: false,
												disable: themeAnalysisManageDisable,
												click: function(){
												  manageClick("ThemeManage");
												}
											} );
									}
									  //如果有权限则加载该菜单
								  if(!biSystemConfigDisable){
								   itemManages.push( {
												caption: "系统配置",
												selected: false,
												disable: biSystemConfigDisable,
												click: function(){
												  manageClick("BIConfigure");
												}
											} );
									}
									menuManage = Sue.ui.menu( {items:itemManages,noSelectFlag:true,backgroundColor:"<%=menuBGColor %>",mouseoverBackgroundColor:"<%=mouseoverBackgroundColor %>",menuColor:"<%=menuColor %>"} );
							        //管理选择框
								     selectManage=Sue.ui.ext.selectableLabel({
									    parent:menuSpan,
									    caption:"管理：",
									    valueCaption:"请选择",
									    panel:menuManage.root,
									    color:"<%=menuColor%>",
									    bgcolor:"#ffffff",
									    click:function (){
									       menuManage.root.show();
									    }
								    }); 
						 }					
			    });

			      
	    //重新加载菜单项
		function reloadItemViews(){
		_.post({
		  			url:"<%= servletURL %>",
					beforeStart: _.Z,
			        afterEnd: _.Z,
					json:{	    
						  type: "action",
	                      servletType: "BIFirstPage",		
						  action: "getViewByUser" 
						  },
					callback: function( r ) 
						  {   
						      var viewid="";
							  var views=r.split(split3);
							  for(var i = 0; i < views.length; i++)
							  {   
							      var view=views[i].split(split2);
							      value=view[0];
							      caption=view[1];
							      if(i==0)
							      {//缺省视图
							         viewid=(value.split("#"))[0];
							         valueCaption=caption;
							      }
							      itemViews.push( {
							            value:value,
										caption: caption,
										selected: false,
										disable: false,
										click: onViewClick
									} );
							   }
							   menuView.reloadItems(itemViews);
							   menuView.root.root.style.visibility="visible";
						 }					
			    });
		}
		//权限校验
		function popedomValidate(){
		   var canManageView=false;
		   var canEditTheme=false;
		   var canDelTheme=false;
		   var canEditDashboard=false;
		   var canDelDashboard=false;
		   var canSetHome=false;
		   var canManageBISystemConfig=false;
		   var canImportDashboard=false;
		   var canExportDashboard=false;
		   //修改： 要赋初始值，否则默认为"undefined" if(can=="false")反而为false了 ！brcue_sha 2009-12-22
		   var canAnalysisPortlet=false;
		   var canDashboardPortlet=false;
		   //系统配置
		   _.post( {
					url: URL,
					async: false,
					json: {
						servletType: "getPermission",
						type: "biSystemConfig,systemViewConfig,dashboardConfig,biDashboardImportExport,themeAnalysisConfig"
						},
					callback: function(r) 
					{ 
						if(r && r.canManageBISystemConfig)
							canManageBISystemConfig = r.canManageBISystemConfig;
						if(r && r.canManageView)
							canManageView = r.canManageView;
						if(r && r.canEditDashboard)
							canEditDashboard = r.canEditDashboard;
						if(r && r.canDelDashboard)
							canDelDashboard = r.canDelDashboard;	
						if(r && r.canSetHome)
							canSetHome = r.canSetHome;	
						if(r && r.canEditTheme)
					     	canEditTheme = r.canEditTheme;
						if(r && r.canDelTheme)
					     	canDelTheme = r.canDelTheme;
					     if(r && r.canImportDashboard)
					     	canImportDashboard = r.canImportDashboard;
					     if(r && r.canExportDashboard)
					     	canExportDashboard = r.canExportDashboard;
					     if(r && r.canAnalysisPortlet)
					        canAnalysisPortlet = r.canAnalysisPortlet;
					     if(r && r.canDashboardPortlet)
					        canDashboardPortlet = r.canDashboardPortlet;
					}
				} );
			if(canManageBISystemConfig) 
			{
				biSystemConfigDisable=false;
			}
			if(canManageView) 
			{
				systemViewManageDisable=false;
			}
			if(canEditDashboard || canDelDashboard || canSetHome || canDashboardPortlet) 
			{
				dashboardManageDisable=false;
			}
			//修改：这里有错，应该是|| 不应该是&&  brcue_sha 2009-12-22
			//if(canEditTheme && canDelTheme) {
			if(canEditTheme || canDelTheme || canAnalysisPortlet) {
				themeAnalysisManageDisable=false;
			}
			
			document.cookie = "BI_THEME_CANEDIT=" + canEditTheme;
			document.cookie = "BI_THEME_CANDEL=" + canDelTheme;
			document.cookie = "BI_DASHBOARD_CANEDIT=" + canEditDashboard;
			document.cookie = "BI_DASHBOARD_CANDEL=" + canDelDashboard;
			document.cookie = "BI_DASHBOARD_CANSETHOME=" + canSetHome;
			document.cookie = "BI_DASHBOARD_CANEXPORT=" + canExportDashboard;
			document.cookie = "BI_DASHBOARD_CANIMPORT=" + canImportDashboard;
	        document.cookie = "BI_THEME_CANPORTLET=" + canAnalysisPortlet;
			document.cookie = "BI_DASHBOARD_CANPORTLET=" + canDashboardPortlet;
		}
		//打开视图下所有仪表板
		function onViewClick(){	
		   for(var i=0;i<menuView.items.length;i++){
		     if(menuView.items[i].selected==true){
		       selectView.valueText.innerText=menuView.items[i].caption;
		       viewid=(menuView.items[i].value.split("#"))[0];
		     }
		   }
		   openDashboardByView(viewid);
		}
		
		//取得视图的仪表板信息
		function openDashboardByView(viewid){
		    _.post({
		  			url:"<%= servletURL %>",
					beforeStart: _.Z,
			        afterEnd: _.Z,
					json:{	    
						  type: "action",
	                      servletType: "BIFirstPage",		
						  action: "getViewPermissionDashboard",
						  viewID: viewid
						  },
					callback: function( r ) 
						 {
						 if(tabs){
						   tabs.destroy();
						 }
						 tabs = new Ext.TabPanel({
					        renderTo:'tabs',
					        resizeTabs:true, // turn on tab resizing
					        minTabWidth: 115,
					        tabWidth:135,
					        height:500,
					        autoHeight　: true,
					        enableTabScroll:true,
					        defaults: {autoScroll:false}
					         });
						   for(var i=tabs.items.length-1;i>=0;i--){
						            tabs.remove(i);
						         }
						   if(r.length>0)
						   {     
						        var dashboards=r.split(split3);
							    for(var i=0;i<dashboards.length;i++)
							    {
							       var path=(dashboards[i].split(split2))[0];
								   var tabName=(dashboards[i].split(split2))[2];
						           var f = activateFun(path);
						           tabs.add({    
										title: '<div title="'+tabName+'">'+tabName+'</div>',
										listeners:
										{
										  activate:f
                                        }
									});
			                     }
			                  tabs.setActiveTab(0);
			                }else{
			                			var f = activateFun();
			                           tabs.add({    
												title: "仪表板",
												listeners:{
												  activate:f
                                                  }
											    });
										tabs.setActiveTab(0);
			                }
			                //绑定事件
			                tabs.on('beforeremove', function(tab, item) {
			                   if(tabs.items.length>1){
						            var a = window.confirm('是否关闭此页签？');
						            if (a === false) {
						                return false;
						            }
					            }else{
					               alert("至少要保留一个页签!"); 
					               return false;
					            }
					        });

						 }
				});
		        }
		}

		function activateFun(p)
		{
            var path = p;
      
	        return function(tab)
	        {
	          loadContent(tab,path);
	          
	        };
		}
	
		function loadContent(tab,path)
		{
		 
			/**
			if(tab.el.dom.loaded)
			{
				tab.doLayout();
				resetIFrame(tab);
				return;
			}
			*/
			if(!path) //没有仪表板
			{
				tab.el.dom.innerHTML = '<div style="height:700px;text-align=center;padding-top:100px;"><img border=0 src="<%=dashboard_jpg%>"/></div>';
				document.frames.frameElement.style.height=800+"px";
				tab.el.loaded = true;
				return;
			}
			tab.el.dom.innerHTML = '<div style="height:500"/>';
			var env;
			_.get({
		  			url:strUrl2 + path,
		  			servletType:"BIDashBoard",
					//async: false,
					nocache: true,
					callback: function( r ) {
						try {
							env = eval( "(" + r + ")" );
							
							
							
						} catch ( e ) {
							bi.portalDialog( r );
							return;
						}
						
						if ( !env ) return;
			if ( "error" in env ) {
					bi.portalDialog( env.error.message );
					return;
			}
			
			var bg = env.background;
			tab.el.dom.innerHTML = env.layoutTable;
			var st = tab.el.dom.style;
			st.width = "100%";
			st.overflowX = "scroll";
			bg.color && ( st.backgroundColor = bg.color );
			bg.url && ( st.backgroundImage = "url(" + bi.getRepositoryPicture( tab.servletURL, bg.url ) + ")" );
			if ( bg.scale == "center" ) {
				st.backgroundRepeat = "no-repeat";
				st.backgroundPosition = "center center";
			}
							
				createScriptEngine( env );
				createScriptEngineDatasources( env );
				createScriptEngineCells( env );
				createScriptEngineDials( env );				
				runAllScript( env.scriptEngine );
				
				tab.el.dom.loaded = true;
			}
			
			
			});
			
		}

	    function resetIFrame(tab){
		         var tabHeight=tab.el.dom.scrollHeight;
		         document.frames.frameElement.style.height=(tabHeight+100)+"px";
		       
	     }
		
		
		
		//打开仪表板弹出菜单
		function showDashboardMenu(){
		   var menuDashboard;
		   var items=new Array(); 
		   if(viewid==""){
		      viewid=(menuView.items[0].value.split("#"))[0];
		   }
		    _.post({
		  			url:"<%= servletURL %>",
					beforeStart: _.Z,
			        afterEnd: _.Z,
					json:{	    
						  type: "action",
	                      servletType: "BIFirstPage",		
						  action: "getViewPermissionDashboard",
						  viewID: viewid
						  },
					callback: function( r ) 
						  {
						  var innerHtml=""
						  var tb=_.id("dashboardtable");
						  var dashboard_div=_.id("popupMenu");
				          if(r.length>0)
					             { 
					                for(var i=tb.rows.length-1;i>=0;i--)
									  {
									    tb.deleteRow(i);
									 }  
									//如果视图有仪表板
								    var dashboards=r.split(split3);
								    for(var i=0;i<dashboards.length;i++)
								     {
									       var path=(dashboards[i].split(split2))[0];
										   var caption=(dashboards[i].split(split2))[1];
										   var newRow = tb.insertRow(); //创建新行
										   newRow.style.cursor="hand";
										   (function(row) {
										  	  _.bindEvent(row, "onmouseover", function(){
												      row.style.backgroundColor="<%=mouseoverBackgroundColor%>";
											     });
										     })(newRow);
										   (function(row) {
										  	  _.bindEvent(row, "onmouseout", function(){
												      row.style.backgroundColor="<%=menuBGColor%>";
											     });
										    })(newRow);
										   (function(row) {
										  	  _.bindEvent(row, "onclick", function(){
												      dashboard_div.style.visibility="hidden";
											     });
										     })(newRow);
						                   var newCell0 = newRow.insertCell(); //创建新单元格
						                   newCell0.id=path;
						                   newCell0.title=caption;
						                   newCell0.innerText=caption;
									 }
								  dashboard_div.style.right=lableMenuButton.offsetWidth;
								  dashboard_div.style.visibility="visible";
								}	
				          }
		   });
		}
		//打开新仪表板
		function openNewDashboard(type)
		{
		  
		}
		//打开管理界面
		function manageClick(action)
		{ 
		  var dialogWidth=560;
		  var dialogHeight=480;
		  
		  var dialogWidth2=700;
		  var dialogHeight2=600;
		  
		  var dialogTop=(screen.availHeight-dialogHeight)/2;
		  var dialogLeft=(screen.availWidth-dialogWidth)/2;
		  
		  var dialogTop2=(screen.availHeight-dialogHeight2)/2;
		  var dialogLeft2=(screen.availWidth-dialogHeight2)/2;
		  
		  var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:yes;status:no";
		  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
		  var sArg3 = "dialogTop:"+dialogTop2+"px;dialogLeft:"+dialogLeft2+"px;dialogWidth:"+dialogWidth2+"px; dialogHeight:"+dialogHeight2+"px;help:no;scroll:no;status:no";
		  //视图管理
		  if(action=="ViewManage")
		  {     
		        var url="<%= includePath %>html/BIUser_View.jsp";
				window.showModalDialog(url, null, sArg2);
		  //系统视图管理	  
		  }else if(action=="SystemViewManage")
		  {    
		        var url="<%= includePath %>html/BISystem_View.jsp";
				window.showModalDialog(url, null, sArg2);
		  //仪表板管理
		  }else if(action=="DashboardManage")
		  {     
		        var url="<%= includePath %>html/dashboardManage.htm"
		   		window.showModalDialog(url, null, sArg);
		 　//主题配置
		  }else if(action=="ThemeManage")
		  {
		       var  url="<%= includePath %>html/themeConfig.htm";
		   	   window.showModalDialog(url, null, sArg);
		  }else if(action=="BIConfigure"){
		       var  url="<%= includePath %>sytemconfig/system_configure.jsp";
		   	   window.showModalDialog(url, null, sArg3);
		  }
		} 
		<%}%>
		</script >
	</body>
</html>