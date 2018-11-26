69c



<html>
	<head>
		<head>
		<meta http-equiv="Pragma" content="no-cache"> 
		<meta http-equiv="Cache-Control" content="no-cache"> 
		<meta http-equiv="Expires" content="0">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link href="../css/worksheet.css" rel="stylesheet" type="text/css" ></link>
		<link href="../css/ui-components.css" type="text/css" rel="stylesheet"></link>
		<script src="../js/sue-main.js"></script>
		<script src="../js/sue-ui.js"></script>
		<script src="../js/sue-config.js"></script>
		<script src="../js/bi.js"></script>
		<script src="../js/bi_tree.js"></script>
		<script src="../metric/component/tree.js"></script>
		<script src="../js/ext_report.js"></script>
		<script type="text/javascript">
		function getReportData()
		{
			var servletURL = "/easportal/BIReport";
			var loadURL = "/easportal/BIReport?servletType=extReport&from=portlet&"+
			"ExtRptsReportName=reportlist&ExtRptsSystemID=com.kingdee.eas.rpts.rpts"+
			"&showMenu=no&ExtRptsOrgID=qUvvbL4yQsyQYFIDSlvngID2%2BFI%3D&"+
			"token=16720325117522824613246119254709279216184192&";
			var obj = {
				isTab: _.K( false ),
				body: document.getElementById('content'),
				servletURL: servletURL,
				url: loadURL
			};
			loadReport( obj );
		};
		</script>
	</head>
	<body id="body" topmargin="10" leftmargin="0" bottommargin="32" rightmargin="0" oncontextmenu="return false;">
		<div id="operater"><input type="button"  value="获得报表数据" onclick="getReportData();"/>
		</div>
		<div id="content" style="border-style: solid; border-width: 2px thin; border-color: blue; display: block;border-collapse:collapse;">
		      填充我吧！
		</div>
	</body>
</html>


0

