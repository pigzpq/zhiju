1762



<html>
	<head>
		<meta http-equiv="Pragma" content="no-cache"> 
		<meta http-equiv="Cache-Control" content="no-cache"> 
		<meta http-equiv="Expires" content="0">
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	   	
	   	<link rel="stylesheet" type="text/css" href="../ext-2.0/resources/css/ext-all.css" />
	   	<link rel="stylesheet" type="text/css" href="../metric/look.css" />
	   	<link href="../css/worksheet.css" rel="stylesheet" type="text/css" ></link>
		<link href="../css/ui-components.css" type="text/css" rel="stylesheet"></link>
		
	
		<script src="../ext-2.0/adapter/ext/ext-base.js"></script>
		<script src="../ext-2.0/ext-all.js"></script>
		
		<script src="../js/sue-main.js"></script>
		<script src="../js/sue-ui.js"></script>
		<script src="../js/sue-config.js"></script>
		<script src="../js/bi.js"></script>
		<script src="../js/bi_tree.js"></script>
		<script src="../metric/component/tree.js"></script>
		<script src="../metric/dupont.js"></script>
		<script src="../js/uilayout.js"></script>
		<script>
			// 由于要改变xsl里面的色彩方案，所以这里把原本的静态CSS改为动态注册
			_.css( _.format( "th.column-heading-even, th.column-heading-odd, th.column-heading-span, th.corner-heading, th.row-heading-even, th.row-heading-odd, th.row-heading-span, th.column-heading-even-right, th.row-heading-even-right, th.column-heading-span-right, th.row-heading-span-right, th.row-heading-heading, th.column-heading-heading, th.rownum-heading, th.rownum {background-color:%s;border:solid 1px #fff;} td.cell-even, td.cell-odd {border:solid 1px %s} .slicer_field, .page_field, .strategy_title, .report_msgdiv {background-color:%s} .filter_panel_container hr {color:%s} .filter_panel_container a {color:%s}", Sue.config.cs[6], Sue.config.cs[6], Sue.config.cs[7], Sue.config.cs[10], Sue.config.cs[11] ) );
			// initialize the tabbed panel after window has been loaded
			_.bindEvent( window, "load", function() {
				//增加： 处理目录发布为Portlet后session的问题 2010-03-02 bruce_sha
				//debugger;
				var from = location.search.match( /(from\=)(.*?)$/ );
				if(from!=null&&from!='')
					from = from[2];
				bannerImage = null;
				tabbedpanel = Sue.ui.ext.tabbedPanel( {
					parent: document.body,
					max: 10,
					fontColor: Sue.config.cs[8],
					overflow: function() {
						bi.portalDialog( "您打开的页签数目过多，请先关闭一些页签。" );
					},
					init: function() {
						this.isTab = _.K( true );
						if ( bannerImage ) {
							_.gc( bannerImage );
							bannerImage = null;
						}
					},
					select: function( last ) {
						if ( !this.loaded ) {
							loadReport( this,from );
							this.loaded = true;
						} 
						else {
						//增加：每次都处理session 2010-03-03 bruce_sha
							_.post( {
								url: "/easWebClient/BIReport",
								json: {
									servletType: "getSession",
									actionName: "adjustThemeAnalysisLastTab",
									url: this.url,
									from:from
								}
							} );	
						}
						// hide the last tab's menubar
						last && last.menubar && ( last.menubar.ul.style.display = "none" );
						this.report && ( uilayout = this.report );
						if ( this.menubar ) {
							this.menubar.ul.style.display = "block";
						} else {
							tabbedpanel.remove( this.uuid );
						}
						// 解决显示过滤菜单时，再打开新报表引起的浮动菜单泄漏问题
						var pops = _.cache( "sue_popup_panels" );
						if ( pops && pops.length > 0 ) {
							for( var i = 0; i < pops.length; i++ ) {
								pops[i].hide();
							}
						}
						bi.tryResetBaseIFrameHeight();
					},
					destroy: function() {
						if ( this.menubar ) {
							_.gc( this.menubar.ul );
							delete this.menubar;
						}

						//关闭所有关联打开的新窗体
					 	unRegisterWnd(this.url);
						
						this.post && this.post( {
							json: {
								type: "close"
							}
						} );

						_.post( {
							url: "/easWebClient/BIReport",
							json: {
								servletType: "getSession",
								actionName: "removeThemeAnalysisSessionState",
								caption: this.caption,
								from: from,
								url: this.url.match( /^(.*)&caption/ )[1]
							}
						} );
						if ( tabbedpanel.tabs.length <= 1 ) {
							bannerImage = _.crt( "img", {
								src: "../img/ui-web/report_banner.gif"
							}, document.body );
						}
					}
				} );
				// 根据session状态恢复上次没有关闭的主题报表
				_.post( {
					url: "/easWebClient/BIReport",
					json: {
						servletType: "getSession",
						actionName: "getThemeAnalysisList"
					},
					callback: function( r ) {
					//	var lastTab = r.pop();
						var flag=false;
						//var v1 ;
						//var v2 ;
						//var v3 ;
						//var v4 ;
							
						_.map( r, function( tab ) {
							tab = eval( "(" + tab + ")" );
							// 修改：处理目录发布为Portlet后session的问题 2010-03-02 bruce_sha
							if(tab.from == from)
							{
								flag = true;
								if(!tab.selected)
								{
										tabbedpanel.append( {
										$uniqueValue: tab.url,
										caption: tab.caption,
										url: tab.url + "&caption=" + encodeURIComponent( tab.caption ),
										servletURL: "/easWebClient/BIReport",
										hideFilter: true
									}, true );
								}else
								{
										tabbedpanel.append( {
										$uniqueValue: tab.url,
										caption: tab.caption,
										url: tab.url + "&caption=" + encodeURIComponent( tab.caption ),
										servletURL: "/easWebClient/BIReport"
									} );
								
								}
							} 
							} );
							//flag 为false or r长度为0时候显示
							if (!flag || !r.length ) {
								bannerImage = _.crt( "img", {
									src: "../img/ui-web/report_banner.gif"
								}, document.body );
							}

					}

					
				} );
			} );
		</script>
	</head>
	<body id="body" topmargin="10" leftmargin="0" bottommargin="32" rightmargin="0" oncontextmenu="return false;">
	</body>
</html>
0

