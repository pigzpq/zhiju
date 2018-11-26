1ffe


<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>视图分配</title>
<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
<script src="../js/bi_skin.js"></script>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/sue-ui.js"></script>
<script src="../js/bi_firstpage.js"></script>
<script>
_.bindEvent(window, "load",getSystemView );
 function getSystemView()
 {         
         var btnclose=_.id("btnclose");
         bi.updateToPortalStyleButton(btnclose);
         var btnadd=_.id("btnadd");
         bi.updateToPortalStyleButton(btnadd);
         var btndel=_.id("btndel");
         bi.updateToPortalStyleButton(btndel);
         setSkin();
         _.post({
				url:"/easWebClient/BIReport",
				beforeStart: _.Z,
		        afterEnd: _.Z,
				json:{	    
					  type: "action",
                      servletType: "BIFirstPage",		
					  action: "getSystemView" 
					  },
				callback: function( r ) 
					  {
					      var select=document.getElementById("exist_view");	
	                      var views=r.split(split3);
					      //删除旧的视图
					      for(var i=select.options.length-1;i>=0;i--){
					        select.options.remove(i);
					      }
	                      //重新加载视图项
	                      for(var i=0;i<views.length;i++)
	                      {   
	                          var view=views[i].split(split2);
	                          var id=view[0];
	                          var text=view[1];
	                          select.options.add(new Option(text,id)); 
	                      }
	                               
					  }					
			 });
 }
 function addView()
 {
     var views=document.getElementById("exist_view");
     var views_table=document.getElementById("views_table");
     for(var i=0;i<views.options.length;i++)
     {
        if(views.options[i].selected)
        {
          var viewId=(views.options[i].value.split("#"))[0];
          var viewText=views.options[i].innerText;
          var newRow = views_table.insertRow(); //创建新行
          var newCell0 = newRow.insertCell(); //创建新单元格
          newCell0.style.height="19px"; //单元格内的内容
          newCell0.innerHTML="<input id=\""+viewId+"\" type=\"checkbox\" checked=\"true\" name=\"views_name\" value=\"checkbox\">";
          var newCell1 = newRow.insertCell(); //创建新单元格
          newCell1.style.height="19px"; //单元格内的内容
          newCell1.innerText=viewText;
          views.remove(i);
          i=i-1;
        }
     }
     renderTable(views_table);
      
 }
 function delView()
 {
  var views_table=document.getElementById("views_table");
  var views_name=document.getElementsByName("views_name");
  var views=document.getElementById("exist_view");
     for(var i=0;i<views_name.length;i++)
     {
        if(views_name[i].checked==true)
        {
          var viewId=views_name[i].id;
          var viewName=views_table.rows[i+1].cells[1].innerText;
          views_table.deleteRow(i+1);
          views.options.add(new Option(viewName,viewId)); 
          i=i-1;
        }
     }
 }
 function checkAllView(obj)
 {
    var views_name=document.getElementsByName("views_name");
    if(obj.checked)
    {
      for(var i=views_name.length-1;i>=0;i--)
      {
        views_name[i].checked=true;
      }
    }else{
      for(var i=views_name.length-1;i>=0;i--)
      {
        views_name[i].checked=false;
      }
    }
 }
 
 //弹出新增用户组窗口
 function  addUserGroup()
 {
      var dialogWidth=258;
	  var dialogHeight=370;
	  var dialogTop=(screen.availHeight-dialogHeight)/2;
	  var dialogLeft=(screen.availWidth-dialogWidth)/2;
	  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
	  var url="BIUserGroup_Selected.jsp";
	  window.showModalDialog(url,window, sArg2);
    }
 //选择用户组
 function doSelectUserGroup(nodeInfo)
 {
     if(nodeInfo.length>0){
       nodeInfo=nodeInfo.substr(0,nodeInfo.length-1);
     }
     var usergroup_table=document.getElementById("usergroup_table");
     var usergroup_name=document.getElementsByName("usergroup_name");
     var nodes=nodeInfo.split("|");
     for(var i=0;i<nodes.length;i++){
      	 var id=nodes[i].split(",")[0];
      	 var caption =nodes[i].split(",")[1];
      	 var exist=false;
      	for(var y=0;y<usergroup_name.length;y++)
      	{
	        if(usergroup_name[y].id==id)
	        {
	          exist=true;
	          break;
	        }
         } 
       if(!exist)//如果不存在则新增
	    {
		     var newRow = usergroup_table.insertRow(); //创建新行
		     var newCell0 = newRow.insertCell(); //创建新单元格
		     newCell0.style.height="19px"; //单元格内的内容
		     newCell0.innerHTML="<input id=\""+id+"\" type=\"checkbox\" checked=\"true\" name=\"usergroup_name\" value=\"checkbox\">";
		     var newCell1 = newRow.insertCell(); //创建新单元格
		     newCell1.style.height="19px"; //单元格内的内容
		     newCell1.innerText=caption; 
		     renderTable(usergroup_table);
	      
	    }
    
      }
     
 }
 //选择用户
 function doSelectUser(nodeInfo)
 {
    
     if(nodeInfo.length>0)
     {
         nodeInfo=nodeInfo.substr(0,nodeInfo.length-1);
     
	     var user_table=document.getElementById("user_table");
	     var user_name=document.getElementsByName("user_name");
	     var nodes=nodeInfo.split("|");
	     for(var i=0;i<nodes.length;i++){
	      	 var id=nodes[i].split(",")[0];
	      	 var fnumber =nodes[i].split(",")[1];
	      	 var fname_l2=nodes[i].split(",")[2];
	      	 var org_name=nodes[i].split(",")[3];
	      	 var exist=false;
	      	for(var y=0;y<user_name.length;y++)
	      	{
		        if(user_name[y].id==id)
		        {
		          exist=true;
		          break;
		        }
	         } 
	       if(!exist)//如果不存在则新增
		    {
			     var newRow = user_table.insertRow(); //创建新行
			     var newCell0 = newRow.insertCell(); //创建新单元格
			     newCell0.style.height="19px"; //单元格内的内容
			     newCell0.innerHTML="<input id=\""+id+"\" type=\"checkbox\" checked=\"true\" name=\"user_name\" value=\"checkbox\">";
			     
			     var newCell1 = newRow.insertCell(); //创建新单元格
			     newCell1.style.height="19px"; //单元格内的内容
			     newCell1.innerText=fnumber; 
			     
			     var newCell2 = newRow.insertCell(); //创建新单元格
			     newCell2.style.height="19px"; //单元格内的内容
			     newCell2.innerText=fname_l2; 
			     
			     var newCell3 = newRow.insertCell(); //创建新单元格
			     newCell3.style.height="19px"; //单元格内的内容
			     newCell3.innerText=org_name; 
			     
			     renderTable(user_table);
		      
		    }
	    
	      }
     }
 }
  //删除用户
 function delUser()
 {
    var user_table=document.getElementById("user_table");
    var user_name=document.getElementsByName("user_name");
    for(var i=user_name.length-1;i>=0;i--)
    {
       if(user_name[i].checked==true)
        {
          user_table.deleteRow(i+1);
        }
    }
 }
 function checkAllUser(obj){
     var user_name=document.getElementsByName("user_name");
    if(obj.checked)
    {
      for(var i=user_name.length-1;i>=0;i--)
      {
        user_name[i].checked=true;
      }
    }else{
      for(var i=user_name.length-1;i>=0;i--)
      {
        user_name[i].checked=false;
      }
    }
 }
 //删除用户组
 function delUserGroup()
 {
    var usergroup_table=document.getElementById("usergroup_table");
    var usergroup_name=document.getElementsByName("usergroup_name");
    for(var i=usergroup_name.length-1;i>=0;i--)
    {
       if(usergroup_name[i].checked==true)
        {
          usergroup_table.deleteRow(i+1);
        }
    }
 }
 function checkAllUserGroup(obj){
     var usergroup_name=document.getElementsByName("usergroup_name");
    if(obj.checked)
    {
      for(var i=usergroup_name.length-1;i>=0;i--)
      {
        usergroup_name[i].che
1ffe
cked=true;
      }
    }else{
      for(var i=usergroup_name.length-1;i>=0;i--)
      {
        usergroup_name[i].checked=false;
      }
    }
 }
 //视图分配
 function doAssign()
 {
    var assign_type=document.getElementsByName("assign_type");
    
    var views_table=document.getElementById("views_table");
    var views_name=document.getElementsByName("views_name");
    
    var usergroup_table=document.getElementById("usergroup_table");
    var usergroup_name=document.getElementsByName("usergroup_name");
     
    var user_table=document.getElementById("user_table");
    var user_name=document.getElementsByName("user_name");
    
    if(views_table.rows.length<=1 ){
        var div_info=document.getElementById("div_info");
		bi.getMessageTable({type:"info",caption:"待用视图不能为空!"},div_info);
		return;
    }
    if(usergroup_table.rows.length<=1 &&  user_table.rows.length<=1)
    {
	    var div_info=document.getElementById("div_info");
		bi.getMessageTable({type:"info",caption:"至少需要选择一个用户组或用户!"},div_info);
		return;
    }else
    {   
        var systemview_info="";
        var usergroup_info="";
        var user_info="";
        //覆盖或者增量 
        for(var i=0;i<assign_type.length;i++){
          if(assign_type[i].checked==true){
            assign_type=assign_type[i].value;
          }
        }
        //取得使用的系统视图
        for(var i=0;i<views_name.length;i++){
           if(views_name[i].checked){
             systemview_info=systemview_info+views_name[i].id+",";
           }
        }
        if(systemview_info.length>0){
           systemview_info=systemview_info.substr(0,systemview_info.length-1);
        }
       //用户组
        for(var i=0;i<usergroup_name.length;i++){
           if(usergroup_name[i].checked){
             usergroup_info=usergroup_info+usergroup_name[i].id+",";
           }
        }
        if(usergroup_info.length>0){
             usergroup_info=usergroup_info.substr(0,usergroup_info.length-1);
        }
       //用户
        for(var i=0;i<user_name.length;i++){
           if(user_name[i].checked){
             user_info=user_info+user_name[i].id+",";
           }
        }
        if(user_info.length>0){
           user_info=user_info.substr(0,user_info.length-1);
        }
        
        _.post({
				url:"/easWebClient/BIReport",
				beforeStart: _.Z,
		        afterEnd: _.Z,
				json:{	    
					  type: "action",
                      servletType: "BIFirstPage",		
					  action: "doAssign",
					  assign_type:assign_type,
					  systemview_info:systemview_info,
					  usergroup_info:usergroup_info,
					  user_info:user_info
					  },
				callback: function( r ) 
					  {
					       if(r=="ok"){
						        var div_info=document.getElementById("div_info");
								bi.getMessageTable({type:"info",caption:"分配用户成功!"},div_info);
								return; 
					       }else{
					            var div_info=document.getElementById("div_info");
								bi.getMessageTable({type:"info",caption:r},div_info);
								return;
					       }
					             
					  }					
			 });
    }
    
 }
 //查询用户
 function query_view(){
      var dialogWidth=560;
	  var dialogHeight=440;
	  var dialogTop=(screen.availHeight-dialogHeight)/2+40;
	  var dialogLeft=(screen.availWidth-dialogWidth)/2+80;
	  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
	  var url="BIView_Query.jsp";
	  window.showModalDialog(url,window, sArg2);
 }
 function addUser()
 {
      var dialogWidth=560;
	  var dialogHeight=440;
	  var dialogTop=(screen.availHeight-dialogHeight)/2+40;
	  var dialogLeft=(screen.availWidth-dialogWidth)/2+80;
	  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
	  var url="BIUser_Selected.jsp";
	  window.showModalDialog(url,window, sArg2);
 }
 </script>
</head>
<body>
<div style="width:550px;">
	<div id="div_info">
	</div>
</div>
<div class="topDivcss" style="width:100%; height:100%">
  <table class="tablecss" width="100%" height="100%" border="0" cellspacing="0" >
    <tr>
      <td  rowspan="10" width="12" ></td>
      <td width="35%" height="24" valign="bottom">系统视图列表： </td>
      <td width="8%">&nbsp;</td>
      <td width="26%" align="left" valign="bottom">待用视图： 
        <label></label>
        <label></label></td>
        <td width="27%" align="right" valign="bottom">
        <input type="radio" title="将覆盖已有数据" name="assign_type" value="0" >
                 覆盖
        <input type="radio" title="只添加未存在的数据" name="assign_type" value="1" checked=true>
                增量
      </td>
      <td width="12">&nbsp;</td>
    </tr>
    <tr>
      <td  rowspan="8">
	    <div class="divcss">
	      <select name="select" multiple="true" id="exist_view" size="22" style="width:99%" >
          </select>
        </div></td>
      <td height="27" align="left" valign="bottom">&nbsp;</td>
      <td colspan="2" rowspan="4" align="center" valign="bottom">
	  <div class="divcss" style="height:100px;overflow:auto">
	    <table  id="views_table" style="word-wrap:break-word;word-break:break-all;" width="99%" border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF" class="tablecss">
          <tr  align="center" style="color:#5B5C5F;">
            <td height="19"  width="10%" align="center" valign="middle" background="../img/ui-web/userview_tableheader.gif">
              <input type="checkbox" checked="true" onclick="javascript:checkAllView(this);" name="checkbox3" value="checkbox">
            </td>
            <td height="19"  width="200" background="../img/ui-web/userview_tableheader.gif">视图名称</td>
          </tr>    
        </table>
	  </div>	  </td>
    </tr>
    <tr>
      <td id="btnadd" height="21" align="center" valign="middle">
         <button  class="portal_button" onclick="javascript:addView();">&gt;&gt;</button>
      </td>
    </tr>
    <tr>
      <td id="btndel" height="23" align="center" valign="middle">
           <button  class="portal_button" onclick="javascript:delView();">&lt;&lt;</button>
      </td>
    </tr>
    <tr>
      <td align="left" valign="bottom">&nbsp;</td>
    </tr>
    <tr>
      <td align="right" valign="bottom">&nbsp;</td>
      <td align="left" valign="bottom">待分配或清除用户组：</td>
      <td align="right" valign="bottom">
      <a href="#" title="新增用户组" onclick="javascript:addUserGroup();"><img border="0" src="../dashboard/images/tbtn_new.gif" /></a>
      <a href="#" title="删除用户组" onclick="javascript:delUserGroup();"><img border="0" src="../dashboard/images/tbtn_delete.gif" /></a>
      </td>
    </tr>
    <tr>
      <td ></td>
      <td height="100%" colspan="2">
	  <div class="divcss" style="height:100px;overflow:auto" >
        <table id="usergroup_table" style="word-wrap:break-word;word-break:break-all;" width="99%" border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"  class="tablecss">
          <tr align="center" style="color:#5B5C5F;">
            <td height="19"  width="10%" background="../img/ui-web/userview_tableheader.gif">
            <input type="checkbox" name="checkbox32" checked="true" onclick="kavascript:checkAllUserGroup(this);" value="checkbox"></td>
            <td height="19" width="200" background="../img/ui-web/userview_tableheader.gif">用户组名称</td>
          </tr>
          
        </table>
      </div>	  </td>
    </tr>
    <tr>
      <td ></td>
      <td height="100%">待分配或清除用户：</td>
      <td height="100%" align="right">
      <a href="#" title="新增用户" onclick="javascript:addUser();" ><img border="0" src="../dashboard/images/tbtn_new.gif" /></a>
      <a href="#" title="删除用户" onclick="javascript:delUser();"><img border="0" src="../dashboard/images/tbtn_delete.gif" /></a>
      <a href="#" title="查看已分配" onclick="javascript:query_view();"><img border="0" src="../dashboard/images/toolbar_preview.gif" 
5bf
/></a>
      </td>
    </tr>
    <tr>
      <td ></td>
      <td height="100%" colspan="2"  >
	  <div class="divcss" style="height:100px;overflow:auto">
        <table id="user_table" style="word-wrap:break-word;word-break:break-all;" width="99%" border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"  class="tablecss">
          <tr align="center" style="color:#5B5C5F;">
            <td height="19px" width="10%" background="../img/ui-web/userview_tableheader.gif">
            <input type="checkbox" name="checkbox322" checked="true" value="checkbox" onclick="javascript:checkAllUser(this);">
            </td>
            <td height="19" width="65" background="../img/ui-web/userview_tableheader.gif">帐号</td>
            <td height="19" width="65" background="../img/ui-web/userview_tableheader.gif">姓名</td>
            <td height="19" width="95" background="../img/ui-web/userview_tableheader.gif">行政组织</td>
          </tr>
          
        </table>
      </div>	  </td>
    </tr>
    
	<tr>
	  <td colspan="5"  height="10">&nbsp;</td>
	</tr>
	<tr>
	<td id="btnclose" height="40" colspan="5" align="right" valign="middle">
	   <button id="btnOK" class="portal_button" onclick="javascript:doAssign();">分配</button>&nbsp;
	   <button id="btnCancel" class="portal_button" onclick="window.close();">关闭</button>
	</td>
	<td  height="40"></td>
	</tr>
	<tr >
	  <td colspan="5" height="20"></td>
	</tr>
  </table>
</div>
</body>
</html>

0

