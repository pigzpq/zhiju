<%@ page session="true" contentType="text/html; charset=UTF-8" 
import = "java.util.*,
com.kingdee.bos.ctrl.analysis.web.solution.BISystem,
com.kingdee.bos.ctrl.analysis.web.solution.tree.BITreeType,
com.kingdee.bos.ctrl.analysis.web.solution.tree.BITreeUtil,
com.kingdee.bos.ctrl.analysis.web.ajax.Constants,
com.kingdee.bos.ctrl.analysis.web.repository.Repository"
%>

<%
    response.setHeader("progma","no-cache");   
    response.setHeader("Cache-Control","no-cache");   
    response.setDateHeader("Expires",0);   
   
    String servletURL = request.getContextPath() + "/" + Constants.SERVLET_URL;
	int nTreeType = BITreeType.TREE_TYPE_BIREPORT;
	String treeType = "dashboardManager";
	if (treeType!=null)
	 	nTreeType = BITreeType.parseType(treeType);
	Repository rep = null;
	if(nTreeType != BITreeType.TREE_TYPE_BIREPORT)
	{//如果不是元数据树，才能必要访问存储库，否则，传null即可。
		rep = BISystem.getRepository(request);		
	}
	String treeRoot = "";
	String creator="";
	try {
	    creator=BISystem.getCurrentUserName(request);
		treeRoot = BITreeUtil.loadTree( nTreeType,"-1",rep,request,false,null);	
	}finally{
		if(rep!=null) rep.close();
	}
%>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>仪表板选择</title>
<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
<script src="../js/bi_skin.js"></script>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/bi_firstpage.js"></script>
<script src="../js/sue-ui.js"></script>
</head>
<script>
//加载已有视图
_.bindEvent(window, "load",getDashboardTree );
var tree;
function getDashboardTree()
 {
        var btntd=_.id("btntd");
        bi.updateToPortalStyleButton(btntd);
        setSkin();
		var r="<%= treeRoot %>";
		 //构造树
		tree = Sue.ui.tree( {
				parent: document.getElementById("tree_container"),
				caption: "",
				getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );
					}
			} );
			//构造根节点并将该根节点与树榜定
			var Node = tree.getNodeConstructor();		
		    var rootNode = Node({
							caption: "仪表板",
							folder: true	
									
	        }); 
		    tree.setRoot(rootNode);
		    //过滤掉没有权限的节点
		    _.post( {
		            url:"<%= servletURL %>",
				    beforeStart: _.Z,
				    afterEnd: _.Z,
		 			json: {
							type: "action",
		                    servletType: "BIFirstPage",		
							action: "filterDashboardTree",
							treeRoot:"<%= treeRoot %>"
			},
			callback: function( r ) 
			   {
			        
					if ( r != "empty" && r != "" ) 
					{
					    var  a= r.split( "|" ),aa;//按"|"分解返回的字符串    
						var nodes = [];
						for( var i = 0, len = a.length; i < len; i++ ) 
						{		
							aa = a[i].split( "," );
							if(aa[3] != "false"){
								nodes.push( Node( {
									caption: aa[0],
									value: { id: aa[1] ,url:aa[2]},
									folder: aa[3] != "false",
									lazyload: aa[3] == "false"?null:dashboardLazyload,
									click:  null,
									dblclick:null
								} ) );
							
							}else{
									nodes.push( Node( {
											caption: aa[0],
											value: { id: aa[1] ,url:aa[2]},
											folder: aa[3] != "false",
											lazyload: aa[3] == "false"?null:dashboardLazyload,
											click: null,
											check:false,
											dblclick:null
										} ) );
							}
						}		
					rootNode.append( nodes );//将节点加到根节点中
			        }
			    }
		  });		
		  rootNode.expand();
 }
 //加载子结点
 function dashboardLazyload(node, callback){
  _.post( {
            url:"<%= servletURL %>",
		    beforeStart: _.Z,
		    afterEnd: _.Z,
 			json: {
					type: "action",
                    servletType: "BIFirstPage",		
					action: "getDashboardChildren",
					id:node.value.id
			},
			callback: function( r ) {
				if ( r != "empty" && r != "") {
					var nodes = [];
					var a = r.split( "|" ), aa, node;
					var Node = tree.getNodeConstructor();
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						if(aa[3] != "false"){
							node = Node( {
								caption: aa[0],
								value: {
									id: aa[1],
									url: aa[2]
								},
								folder: aa[3] != "false",
								click: null,
								lazyload: aa[3] == "false" ?null:dashboardLazyload
							} ) ;
						}else{
						    node = Node( {
								caption: aa[0],
								value: {
									id: aa[1],
									url: aa[2]
								},
								folder: aa[3] != "false",
								click: null,
								check:false,
								lazyload: aa[3] == "false" ?null:dashboardLazyload
							} ) ;
						}
						nodes.push( node );
					}
					callback( nodes );
				} else {
					callback( [] );
				}
			}
		});
 }
 
 function doAddDashboard()
 {     //取所有子结点
      var selectedNodes=tree.root.getAllChildren(tree.root);
      var win = window.dialogArguments; 
      if(selectedNodes.length>0)
      {
       for(var i=0;i<selectedNodes.length;i++)
        {
	         var selectedNode =selectedNodes[i];
	         if(selectedNode!=null && selectedNode.check==true)
	         {
	           var dashboardPath=(decodeURIComponent(selectedNode.value.id)).split("/");
               var path=dashboardPath[dashboardPath.length-1]
               var dashboardCaption=selectedNode.caption;
               //将钩选的结点添加
	           win.doSelectDashboard(path,dashboardCaption,dashboardCaption,"<%=creator%>");
	           win.setDirty(true);
	         }
	    }
	      
      }else
      {
           var div_info=document.getElementById("div_info");
		   bi.getMessageTable({type:"info",caption:"请选择仪表板!"},div_info);
	       return;
      }
      window.close();
 }
</script>
<body>
<div style="width:250px;">
	<div id="div_info">
	</div>
</div>
<div class="topDivcss" style="width:250px;height:100%;">
  <table class="tablecss" width="100%" height="100%" border="0" >
    
    <tr>
      <td height="20" colspan="2" valign="bottom">可选仪表板：</td>
    </tr>
    <tr>
      <td height="70%" colspan="2">
	    <div class="divcss" id="tree_container" style="width:100%; height:100%;overflow:auto" >  
       </div>
      </td>
    </tr>
    <tr>
      <td height="8" colspan="2"><hr class="divcss" /></td>
    </tr>
    <tr>
      <td  align="right" id="btntd" colspan="2">
      <button id="btnOK" class="portal_button" onclick="javascript:doAddDashboard();">确定</button>&nbsp;
      <button id="btnCancel" class="portal_button" onclick="window.close();">关闭</button>
      </td>
    </tr>
    <tr>
      <td height="20" colspan="2"></td>
    </tr>
  </table>
</div>
</body>
</html>
