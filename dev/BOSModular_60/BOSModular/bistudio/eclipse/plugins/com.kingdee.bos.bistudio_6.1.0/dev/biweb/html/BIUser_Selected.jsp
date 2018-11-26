1ffe


<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>选择用户</title>
<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
<script src="../js/bi_skin.js"></script>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/sue-ui.js"></script>
<script src="../js/bi_firstpage.js"></script>
<script>
var split1="/";
var split2="//";
_.bindEvent(window, "load",init );
function init(){
         var btnQuery=_.id("btnQuery");
         bi.updateToPortalStyleButton(btnQuery);
         var btnOK=_.id("btnOK");
         bi.updateToPortalStyleButton(btnOK);
         var btnClose=_.id("btnClose");
         bi.updateToPortalStyleButton(btnClose);
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
								value: { id:"root" ,url:"root"},
								folder: true,
								click:getUserByGroup
										
		        }); 
			    tree.setRoot(rootNode);
			    if ( r != "empty" && r != "" ) {
			    var  a= r.split( split2),aa;//按"|"分解返回的字符串    
				var nodes = [];
				for( var i = 0, len = a.length; i < len; i++ ) {		
					aa = a[i].split( split1 );
				    nodes.push( Node( {
							caption: aa[0],
							value: { id: aa[1] ,url:aa[2]},
							folder: aa[3] != "false",
							lazyload: aa[3] == "false"?null:userGroupLazyload,
							click: getUserByGroup,
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
						aa = a[i].split(split1);
						node = Node( {
								caption: aa[0],
								value: {
									id: aa[1],
									url: aa[2]
								},
								folder: aa[3] != "false",
								click: getUserByGroup,
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
function getUserByGroup(node){
    _.post( {
            url:"/easWebClient/BIReport",
		    beforeStart: _.Z,
		    afterEnd: _.Z,
 			json: {
					type: "action",
                    servletType: "BIFirstPage",		
					action: "getUserByGroup",
					id:node.value.id
			},
			callback: function( r ) 
			{
				//清空原有表格数据
			  delTable("users_table");
			  if(r.length>0)
			  {
			     var users=r.split(split2);
			     for(var i=0;i<users.length;i++)
			     {
			     
			         var user=users[i];
			         var fid=(user.split(split1))[0];
			         var fnumber=(user.split(split1))[1];
			         var fname_l2=(user.split(split1))[2];
			         var org_name=(user.split(split1))[3];
			         
			         var newRow = users_table.insertRow(); 
				     var newCell0 = newRow.insertCell(); 
				     newCell0.style.height="19px"; 
				     newCell0.innerHTML="<input id=\""+fid+"\" type=\"checkbox\" checked=\"true\" name=\"user_name\" value=\"checkbox\">";
				    
				     var newCell1 = newRow.insertCell(); 
				     newCell1.style.height="19px"; 
				     newCell1.innerText=fnumber; 
				     
				     var newCell2 = newRow.insertCell(); 
				     newCell2.style.height="19px"; 
				     newCell2.innerText=fname_l2; 
				     
				     var newCell3 = newRow.insertCell(); 
				     newCell3.style.height="19px"; 
				     newCell3.innerText=org_name; 
				     
				     renderTable(users_table);
			     }
			  }
			}
		});
}
function user_query()
{   
    var users_table=document.getElementById("users_table");
    var user_input=document.getElementById("user_input");
    var query_type=document.getElementById("query_type");
    var blur_query=document.getElementById("blur_query");
    var blur="0";
    if(blur_query.checked==true){
      blur="1";
    }
    if((_.trim(user_input.value)).length==0){
           var div_info=document.getElementById("div_info");
	      bi.getMessageTable({type:"info",caption:"用户姓名或帐号不能为空!"},div_info);
	      return;
    }
    _.post( {
            url:"/easWebClient/BIReport",
		    beforeStart: _.Z,
		    afterEnd: _.Z,
 			json: {
					type: "action",
                    servletType: "BIFirstPage",		
					action: "queryUser",
					query_type:query_type.value,
					blur:blur,
					user_input:user_input.value
			},
			callback: function( r ) 
			{
			  //清空原有表格数据
			  delTable("users_table");
			  if(r.length>0)
			  {
			     var users=r.split(split2);
			     for(var i=0;i<users.length;i++)
			     {
			         var user=users[i];
			         var fid=(user.split(split1))[0];
			         var fnumber=(user.split(split1))[1];
			         var fname_l2=(user.split(split1))[2];
			         var org_name=(user.split(split1))[3];
			         
			         var newRow = users_table.insertRow(); 
				     var newCell0 = newRow.insertCell(); 
				     newCell0.style.height="19px"; 
				     newCell0.innerHTML="<input id=\""+fid+"\" type=\"checkbox\" checked=\"true\" name=\"user_name\" value=\"checkbox\">";
				    
				     var newCell1 = newRow.insertCell(); 
				     newCell1.style.height="19px"; 
				     newCell1.innerText=fnumber; 
				     
				     var newCell2 = newRow.insertCell(); 
				     newCell2.style.height="19px"; 
				     newCell2.innerText=fname_l2; 
				     
				     var newCell3 = newRow.insertCell(); 
				     newCell3.style.height="19px"; 
				     newCell3.innerText=org_name; 
				     
				     renderTable(users_table);
			     }
			  }
			}
	});
}
 function checkAllUser(obj){
     var userg_name=document.getElementsByName("user_name");
    if(obj.checked)
    {
      for(var i=userg_name.length-1;i>=0;i--)
      {
        userg_name[i].checked=true;
      }
    }else{
      for(var i=userg_name.length-1;i>=0;i--)
      {
        userg_name[i].checked=false;
      }
    }
 }
 function doSelectUser(){
   var users_table=document.getElementById("users_table");
   var user_name=document.getElementsByName("user_name");
   var nodeInfo="";
   for(var i=0;i<user_name.length;i++){
      if(user_name[i].checked==true){
	       var fid=user_name[i].id;
	       var fnumber=users_table.rows[i+1].cells[1].innerText;
	       var fname_l2=users_table.rows[i+1].cells[2].innerText;
	       var org_name=users_table.rows[i+1].cells[3].innerText;
	       nodeInfo=nodeInfo+fid+","+fnumber+","+fname_l2+","+org_name+"|";
       }
   }
   var win = window.dialogArguments; 
   var dup=win.doSelectUser(nodeInfo);
   window.close();   
}
</script>
</head>
<body>
<div style="width:550px;">
	<div id="div_info">
	</div>
</div>
<div class="topDivcss" style="width:100%; height:100%">
  <table class="tablecss" width="100%" height="100%" border="0" cellspacing="0">
    <tr height="50px" style="color:#5B5C5F;">
      <td  rowspan="10" width="2%" ></td>
      <td  colspan="4" height="40" align="left" valign="bottom">
        <select name="select" class="inputcss" style="width:150px" id="query_type">
          <option value="0">姓名</option>
          <opt
80c
ion value="1">帐号</option>
        </select>
        <input name="textfield" type="text" id="user_input" class="inputcss">&nbsp;
        <button id="btnQuery" class="portal_button" onclick="javascript:user_query();">查询</button>&nbsp;
        <input name="checkbox" type="checkbox" checked="true" class="inputcss" id="blur_query" value="checkbox">模糊查询
       </td>
      <td width="1%">&nbsp;</td>
    </tr>
    <tr> 
        <td width="34%">用户组:</td>
       <td colspan="4">用户:
       </td>
    </tr>
    <tr>
      <td>
	  <div class="divcss" style="height:250px;overflow:auto" id="tree_container">
	  </div>
	  </td>
      <td height="27" colspan="3" align="left" valign="bottom">
	  <div class="divcss" style="height:250px;overflow:auto">
        <table style="word-wrap:break-word;word-break:break-all;" width="100%" border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"    class="tablecss" class="tablecss" id="users_table" >
          <tr align="center" style="color:#5B5C5F;">
            <td width="9%" background="../img/ui-web/userview_tableheader.gif">
              <input type="checkbox" name="checkbox2" value="checkbox" checked="true" onclick="javascript:checkAllUser(this);">            </td>
            <td width="70" background="../img/ui-web/userview_tableheader.gif">帐号</td>
            <td width="70" background="../img/ui-web/userview_tableheader.gif">姓名</td>
            <td width="150" background="../img/ui-web/userview_tableheader.gif">行政组织</td>
          </tr>
          
        </table>
      </div>
     </td>
    </tr>
	<tr>
	  <td colspan="5"  height="20"><hr class="divcss"></td>
    </tr>
	<tr>
	<td  height="40" colspan="4" align="right" valign="middle">
	   <button id="btnOK" class="portal_button" onclick="javascript:doSelectUser();">确定</button>&nbsp;
	   <button id="btnClose" class="portal_button" onclick="window.close();">关闭</button>
	</td>
	<td  height="40"></td>
	</tr>
	<tr >
	  <td colspan="6" height="30"></td>
	</tr>
  </table>
</div>
</body>
</html>

0

