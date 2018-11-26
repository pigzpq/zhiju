52a


 <head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title></title>
    <link rel="stylesheet" type="text/css" href="../ext-2.0/resources/css/ext-all.css" />
    <script type="text/javascript" src="../ext-2.0/adapter/ext/ext-base.js"></script>
    <script type="text/javascript" src="../ext-2.0/ext-all.js"></script>	
  </head>
<body>
  <div id="bi_porlet_tabs" style="height:100%;padding-top:10px;text-align=center;" ></div>
  <script> 
        
	Ext.util.CSS.swapStyleSheet('theme', "");
    var include="null";
	var re = /@temp/g;
    var temp = "&";
    var url = include.replace(re,temp);

	//处理tab
	var tabName="null";
	var tab_include = new Ext.TabPanel({
	renderTo:'bi_porlet_tabs',
	resizeTabs:true,
	resizingminTabWidth: 115,
	tabWidth:100,
	autoHeight: true,
	autoWidth: true,
	enableTabScroll:true,
	defaults: {autoScroll:false}
	});
	tab_include.add({
	title:tabName,			    	
	html:'<iframe style=\"text-align:center\" id=\"tab_include\" frameborder=\"no\" border=\"no\" src=\"'+url+'\" width=\"100%\" height=\"1200\" />'
	});
	tab_include.setActiveTab(0);
	var tabHeight=tab_include.el.dom.scrollHeight;
	document.frames.frameElement.style.height=(tabHeight+50)+"px";
	document.getElementById("tab_include").style.height=(tabHeight+50)+"px";
	
  </script>
</body>
</html>

0

