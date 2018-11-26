15dc


<html>
	<head>
		<meta http-equiv="Pragma" content="no-cache"> 
		<meta http-equiv="Cache-Control" content="no-cache"> 
		<meta http-equiv="Expires" content="0">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<script>document.cookie='BI_COLOR_SCHEME_NAME=blue';</script>
		<script src="../js/sue-main.js"></script>
		<script src="../js/sue-config.js"></script>
		<script src="../js/bi.js"></script>
		<script>
			_.bindEvent( window, "load", function() {
				_.id( "navi_left_border" ).style.backgroundColor = Sue.config.cs[1];
				_.id( "navi_container" ).style.background = _.format( "url(../img/ui-web/navigator_bg_%s.gif) repeat-x", Sue.config.cs.name );
				_.id( "navi_right_border" ).style.background = _.format( "url(../img/ui-web/navigator_right_%s.gif) no-repeat", Sue.config.cs.name );
				var container = _.id( "navi_container" );
				var selected;
				var tables = _.map( [
					{
						caption: "BI中心",
						href: "../html/homepage.jsp"
					},
					{
						caption: "主题配置",
						href: "../html/themeConfig.htm"
					},
					{
						caption: "主题分析",
						href: "../html/themeAnalysis.htm"
					},
					{
						caption: "仪表板管理",
						href: "../html/dashboardManage.htm"
					},
					{
						caption: "仪表板",
						href: "../html/dashboardAnalysis.htm"
					}
				], function( navi ) {
					var table = _.table( _.format( "{[!width:19px;padding:0px][!padding:0px~%s][!width:19px;padding:0px]!height:16px;cursor:pointer}!font-size:12px;color:%s;display:inline;border-collapse:collapse;padding:0px", navi.caption, Sue.config.cs[17] ), container );
					_.bindEvent( table.table, "mouseover", function() {
						if ( selected != table ) {
							table.td( 0, 0 ).style.background = _.format( "url(../img/ui-web/navigator_mouseover_left_%s.gif) no-repeat", Sue.config.cs.name );
							table.td( 0, 1 ).style.backgroundColor = Sue.config.cs[13];
							table.td( 0, 2 ).style.background = _.format( "url(../img/ui-web/navigator_mouseover_right_%s.gif) no-repeat", Sue.config.cs.name );
						}
					} );
					_.bindEvent( table.table, "mouseout", function() {
						if ( selected != table ) {
							table.td( 0, 0 ).style.background = "";
							table.td( 0, 1 ).style.backgroundColor = "";
							table.td( 0, 2 ).style.background = "";
						}
					} );
					_.bindEvent( table.table, "click", function() {
						bi.tryResetBaseIFrameHeight( window.screen.availHeight - 240 );
						if ( selected != table ) {
							var URL = "/easWebClient/BIReport";
							if(navi.caption == "主题配置") {
								var canEdit = false;
								var canDel = false;
								_.post( {
									url: URL,
									async: false,
									json: {
										servletType: "getPermission",
										type: "themeAnalysisConfig"
									},
									callback: function(r) {
										if(r && r.canEdit)
											canEdit = r.canEdit;
										if(r && r.canDel)
											canDel = r.canDel;	
									}
								} );
								if(!(canEdit || canDel)) {
									bi.portalDialog("对不起，您没有主题配置的权限！");
									return;
								}
								document.cookie = "BI_THEME_CANEDIT=" + canEdit;
								document.cookie = "BI_THEME_CANDEL=" + canDel;
							}else if(navi.caption == "仪表板管理") {
								var canEdit = false;
								var canDel = false;
								var canSetHome = false;
								_.post( {
									url: URL,
									async: false,
									json: {
										servletType: "getPermission",
										type: "dashboardConfig"
									},
									callback: function(r) {
										if(r && r.canEdit)
											canEdit = r.canEdit;
										if(r && r.canDel)
											canDel = r.canDel;	
										if(r && r.canSetHome)
											canSetHome = r.canSetHome;	
									}
								} );
								if(!(canEdit || canDel || canSetHome)) {
									bi.portalDialog("对不起，您没有仪表板管理的权限！");
									return;
								}
								document.cookie = "BI_DASHBOARD_CANEDIT=" + canEdit;
								document.cookie = "BI_DASHBOARD_CANDEL=" + canDel;
								document.cookie = "BI_DASHBOARD_CANSETHOME=" + canSetHome;
							}
							
							var currentSelected = selected;
							selected = table;
							currentSelected && _.extractEvent( currentSelected.table, "mouseout" )();
							table.td( 0, 0 ).style.background = _.format( "url(../img/ui-web/navigator_mouseclick_left_%s.gif) no-repeat", Sue.config.cs.name );
							table.td( 0, 1 ).style.backgroundColor = Sue.config.cs[12];
							table.td( 0, 2 ).style.background = _.format( "url(../img/ui-web/navigator_mouseclick_right_%s.gif) no-repeat", Sue.config.cs.name );
							parent.document.getElementById( "content" ).contentWindow.location.replace( navi.href );
						}
					} );
					return table;
				} );
				tables[0].td( 0, 0 ).style.background = _.format( "url(../img/ui-web/navigator_mouseclick_left_%s.gif) no-repeat", Sue.config.cs.name );
				tables[0].td( 0, 1 ).style.backgroundColor = Sue.config.cs[12];
				tables[0].td( 0, 2 ).style.background = _.format( "url(../img/ui-web/navigator_mouseclick_right_%s.gif) no-repeat", Sue.config.cs.name );
				selected = tables[0];
			} );
		</script>
	</head>
	<body topmargin="0" leftmargin="2" bottommargin="0" rightmargin="0">
		<table cellspacing="0" cellspdding="0" border="0" style="width:100%">
			<tr style="height:21px">
				<td id="navi_left_border" style="width:1px;padding:0px"></td>
				<td id="navi_container" style="vertical-align:middle;padding:0px">
				</td>
				<td id="navi_right_border" style="width:9px;padding:0px"></td>
			</tr>
		</table>
	</body>
</html>
0

