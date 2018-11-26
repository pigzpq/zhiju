<%@ page session="true" contentType="text/html; charset=UTF-8" 
import = "java.util.*,
com.kingdee.bos.ctrl.analysis.web.solution.BISystem,
com.kingdee.bos.ctrl.analysis.web.solution.BISolution,
com.kingdee.bos.ctrl.analysis.web.solution.tree.BITreeType,
com.kingdee.bos.ctrl.analysis.web.solution.tree.BITreeUtil,
com.kingdee.bos.ctrl.analysis.web.ajax.Constants,
com.kingdee.bos.ctrl.analysis.web.homepage.HomePage,
java.io.StringWriter,
javax.swing.tree.TreeModel,
org.w3c.dom.Document,
org.w3c.dom.Element,
com.kingdee.bos.ctrl.analysis.util.XmlUtil,
com.kingdee.bos.ctrl.analysis.web.repository.Repository,
com.kingdee.eas.cp.common.web.util.WebContextUtil"
%>

<%
	int nTreeType = BITreeType.TREE_TYPE_BIREPORT;
	String loadTreeURL = request.getContextPath() + "/" + Constants.SERVLET_URL;
	String servletType = Constants.SERVLET_TYPE_WEBUTIL;
	String treeType = request.getParameter(Constants.REQUEST_TREE_TYPE);
	if (treeType!=null)
	 	nTreeType = BITreeType.parseType(treeType);
	else
	    treeType = "report";
	    
	boolean onlyFolder = (nTreeType==BITreeType.TREE_TYPE_REPORT_MANAGER 
		||nTreeType==BITreeType.TREE_TYPE_DASHBOARD_MANAGER);
	Repository rep = null;
	if(nTreeType != BITreeType.TREE_TYPE_BIREPORT)
	{//如果不是元数据树，才能必要访问存储库，否则，传null即可。
		rep = BISystem.getRepository(request);		
	}
	String treeRoot = "";
	try {
		treeRoot = BITreeUtil.loadTree( nTreeType,"-1",rep,request,onlyFolder,null);
	}finally{
		if(rep!=null) rep.close();
	}
	String treeCaption = BITreeType.TREE_TYPE_NAME[nTreeType];
	String userId = BISystem.getCurrentUser(request);
	String orgId = BISystem.getCurrentOrgUnitID(request);
	String homepageid=new HomePage().getDashBoardHomePageByUserAndOrg(rep,userId,orgId);
	
	String colorSchemeName = "blue";
	if ( BISystem.isEAS() ) {
		// 读取portal的颜色方案，放到cookie里面
		// portal提供的方法只能获取到portal组的皮肤路径，我们需要一个适配器来转换为我们需要的色彩别名
		Map map = new HashMap();
		map.put( "01", "blue" );
		map.put( "02", "orange" );
		map.put( "03", "green" );
		map.put( "04", "red" );
		map.put( "01_simple", "blue" );
		map.put( "style1", "blue" );
		String path = WebContextUtil.getUserSkinPath( request );
		colorSchemeName = (String) map.get( path.substring( path.lastIndexOf( "/" ) + 1 ) );
	}		
%>

<html>
<head>
<link href="../css/ui-components.css" type="text/css" rel="stylesheet" />
<link href="../css/tree.css" type="text/css" rel="stylesheet" />
<%= "<script>document.cookie='BI_COLOR_SCHEME_NAME=" + colorSchemeName + "';</script>" %>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-ui.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/bi_tree.js"></script>
<style type="text/css">
	html, body {
		height:100%;
	}
</style>
</head>
<body topmargin="10" leftmargin="2" bottommargin="10" rightmargin="0" style="overflow-x:hidden">
<script>
	_.bindEvent( window, "load", function() {
		// 下面的这个表格应该设置为和本页面相同大小。现在本页面所处的框架宽度为250px，表格中的单元格已经被*手动*地设置为248px（减页面的left-margin）
		// 若未来框架的宽度改变了，此处也应该被同步地改变。因为ie无法自动调整表格的大小导致必须手动设置固定的数值。
		var table = _.table( _.format( "{[!background:url(../img/ui-web/tree_container_head_%s.gif) repeat-x;width:240px;text-align:center;font-size:12px;color:#FFF~<%= treeCaption %>][!width:10px;background:url(../img/ui-web/tree_container_head_right_%s.gif) no-repeat right center]!height:22px}{[,2!border:solid 1px %s;vertical-align:top]}!width:248px;height:100%", Sue.config.cs.name, Sue.config.cs.name, Sue.config.cs[2] ), document.body );
		table.table.cellPadding = table.table.cellSpacing = 0;
		// 同样的道理，为了使div能顺利出现滚动条，必须设置为表格宽度减2（每个边框宽度是1）
		var div = _.div( {
			parent: table.td( 1, 0 ),
			id: "tree_container",
			cssText: _.format( "background-color:%s;padding:10px;font-size:12px;overflow-x:auto;width:246px;height:100%;overflow-y:auto", Sue.config.cs[20] )
		} );
		// 此树的相关方法被本框架集的其它框架调用，故不使用var声明
		biTree = new bi_tree("<%= treeType %>","<%= treeCaption %>",
			"<%= loadTreeURL %>","<%= treeRoot %>");
		biTree.show("<%= homepageid %>");
	} );
</script>
</body>
</html>