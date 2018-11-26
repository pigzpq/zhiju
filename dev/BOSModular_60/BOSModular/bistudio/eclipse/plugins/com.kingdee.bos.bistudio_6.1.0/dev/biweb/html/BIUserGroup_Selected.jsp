1293



<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>用户组选择</title>
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
_.bindEvent(window, "load",getUserGroupTree );
var tree;
var split1="/";
var split2="//";
function getUserGroupTree()
 {
        var btntd=_.id("btntd");
        bi.updateToPortalStyleButton(btntd);
        setSkin();
       _.post( {
            url:"/easWebClient/BIReport",
		    beforeStart: _.Z,
		    afterEnd: _.Z,
 			json: {
					type: "action",
                    servletType: "BIFirstPage",		
					action: "getUserGroupTree"
			},
			callback: function( r ) 
			{
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
								caption: "用户组",
								folder: true
										
		        }); 
			    tree.setRoot(rootNode);
			    if ( r != "empty" && r != "" ) 
			    {
				    var  a= r.split( split2 ),aa;//按"|"分解返回的字符串    
					var nodes = [];
					for( var i = 0, len = a.length; i < len; i++ ) 
					{		
						aa = a[i].split( split1);
						nodes.push( Node( {
								caption: aa[0],
								value: { id: aa[1] ,url:aa[2]},
								folder: aa[3] != "false",
								lazyload: aa[3] == "false"?null:userGroupLazyload,
								click: _.Z,
								check:false,
								dblclick:null
						} ) );
					
						
				}		
				rootNode.append( nodes );//将节点加到根节点中
			    }
			    rootNode.expand();
			}
		});
		
 }
 //加载子结点
 function userGroupLazyload(node, callback){
  _.post( {
            url:"/easWebClient/BIReport",
		    beforeStart: _.Z,
		    afterEnd: _.Z,
 			json: {
					type: "action",
                    servletType: "BIFirstPage",		
					action: "getUserGroupChildren",
					id:node.value.id
			},
			callback: function( r ) {
				if ( r != "empty" && r != "" ) {
					var nodes = [];
					var a = r.split( split2 ), aa, node;
					var Node = tree.getNodeConstructor();
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( split1);
						node = Node( {
								caption: aa[0],
								value: {
									id: aa[1],
									url: aa[2]
								},
								folder: aa[3] != "false",
								click: _.Z,
								check:false,
								lazyload: aa[3] == "false" ?null:userGroupLazyload
							} ) ;
						
						
						nodes.push( node );
					}
					callback( nodes );
				} else {
					callback( [] );
				}
			}
		});
 }
 function doAddUserGroup()
 {    
      var valadate=false;
      var nodeInfo="";
      //取所有子结点
      var selectedNodes=tree.root.getAllChildren(tree.root);
      for(var i=0;i<selectedNodes.length;i++){
        var selectedNode =selectedNodes[i];
         if(selectedNode!=null && selectedNode.check==true)
         {
           nodeInfo=nodeInfo+selectedNode.value.id+","+selectedNode.caption+"|";
	       valadate=true;
         }
      }
	  if(!valadate)
	  {
	      var div_info=document.getElementById("div_info");
	      bi.getMessageTable({type:"info",caption:"请选择用户组!"},div_info);
	      return;
	  }
	  
      var win = window.dialogArguments; 
      var dup=win.doSelectUserGroup(nodeInfo);
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
    
    <tr style="color:#5B5C5F;">
      <td height="20" colspan="2" valign="bottom">可选用户组：</td>
    </tr>
    <tr>
      <td height="245" colspan="2">
	    <div class="divcss" id="tree_container" style="width:100%; height:100%;overflow:auto" >  
       </div>
      </td>
    </tr>
    <tr>
      <td height="8" colspan="2"><hr class="divcss" /></td>
    </tr>
    <tr>
      <td  align="right" id="btntd" colspan="2">
      <button id="btnOK" class="portal_button" onclick="javascript:doAddUserGroup();">确定</button>&nbsp;
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

0

