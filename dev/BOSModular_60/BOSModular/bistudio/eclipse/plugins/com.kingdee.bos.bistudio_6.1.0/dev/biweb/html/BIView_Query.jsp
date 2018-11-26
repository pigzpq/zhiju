2000


<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>查看已分配</title>
<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
<script src="../js/bi_skin.js"></script>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/sue-ui.js"></script>
<script src="../js/bi_firstpage.js"></script>
<script>
_.bindEvent(window, "load",init);
function init(){
    var btnclose=_.id("btnclose");
    bi.updateToPortalStyleButton(btnclose);
    var btnQuery=_.id("btnQuery");
    bi.updateToPortalStyleButton(btnQuery);
    
    var btndel=_.id("btndel");
    bi.updateToPortalStyleButton(btndel);
    
    setSkin();
    var win = window.dialogArguments; 
    var users_table=document.getElementById("users_table");
    var user_table=win.document.getElementById("user_table");
    var user_name=win.document.getElementsByName("user_name");
    for(var i=0;i<user_name.length;i++)
    {
        if(user_name[i].checked==true)
        {          
                 var id=user_name[i].id;
                 var fnumber =user_table.rows[i+1].cells[1].innerText;
	      	     var fname_l2=user_table.rows[i+1].cells[2].innerText;
	      	     var org_name=user_table.rows[i+1].cells[3].innerText;
                 
                 var newRow = users_table.insertRow(); //创建新行
                  (function(row) {
						  	  _.bindEvent(row, "onclick", function(){
								  onUserClick(row);
							 });
						  })(newRow);
			     var newCell0 = newRow.insertCell(); //创建新单元格
			     newCell0.id=id;
			     
			     var newCell1 = newRow.insertCell(); //创建新单元格
			     newCell1.style.height="19px"; //单元格内的内容
			     newCell1.innerText=fnumber; 
			     
			     var newCell2 = newRow.insertCell(); //创建新单元格
			     newCell2.style.height="19px"; //单元格内的内容
			     newCell2.innerText=fname_l2; 
			     
			     var newCell3 = newRow.insertCell(); //创建新单元格
			     newCell3.style.height="19px"; //单元格内的内容
			     newCell3.innerText=org_name; 
			     
			     renderTable(users_table);
        }
    }
}
function user_query(){
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
			     var users=r.split(split3);
			     for(var i=0;i<users.length;i++)
			     {
			         var user=users[i];
			         var fid=(user.split(split2))[0];
			         var fnumber=(user.split(split2))[1];
			         var fname_l2=(user.split(split2))[2];
			         var org_name=(user.split(split2))[3];
			         
			         var newRow = users_table.insertRow(); 
			          (function(row) {
						  	  _.bindEvent(row, "onclick", function(){
								     onUserClick(row);
							 });
						  })(newRow);
				     var newCell0 = newRow.insertCell(); 
				     newCell0.id=fid;
				    
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
var user_id="";
function onUserClick(newRow){
         var users_table=document.getElementById("users_table");
         var dashboards_table=document.getElementById("dashboards_table");
	     renderTable(users_table); 
		 newRow.className="focuscss";
		 id=newRow.cells[0].id;
		 user_id=id;
		_.post({
				url:"/easWebClient/BIReport",
				beforeStart: _.Z,
				afterEnd: _.Z,
				json:{	    
						type: "action",
				        servletType: "BIFirstPage",		
						action: "getDefaultViewByUser",
						id:id 
					 },
				callback: function( r ) 
					 {
					   //清空原有表格数据
			           delTable("dashboards_table");
					   if(r.length>0){
					    var dashboards=r.split(split3); 
					    for(var i=0;i<dashboards.length;i++){
					        var dashboradpath = (dashboards[i].split(split2))[0]; 
					        var caption = (dashboards[i].split(split2))[1];
					        var tabName = (dashboards[i].split(split2))[2];
					        var newRow = dashboards_table.insertRow(); 
						    var newCell0 = newRow.insertCell(); 
						    newCell0.innerHTML="<input id=\""+dashboradpath+"\" type=\"checkbox\"  name=\"dashboradcheck_name\" >";
						  
						    
						    var newCell1 = newRow.insertCell(); 
						    newCell1.innerText=caption;
						    
						    var newCell2 = newRow.insertCell(); 
						    newCell2.style.height="19px"; 
						    newCell2.innerText=tabName;    
						        
						    renderTable(dashboards_table);
						}
					   }    
					 }
			});
}
function checkAllDashboard(obj){
    var dashboradcheck_name=document.getElementsByName("dashboradcheck_name");
    if(obj.checked)
    {
      for(var i=dashboradcheck_name.length-1;i>=0;i--)
      {
        dashboradcheck_name[i].checked=true;
      }
    }else{
      for(var i=dashboradcheck_name.length-1;i>=0;i--)
      {
        dashboradcheck_name[i].checked=false;
      }
    }
 }
function ondelete(){
      var dashboardPaths="";
      var dashboradcheck_name=document.getElementsByName("dashboradcheck_name");
      for(var i=0;i<dashboradcheck_name.length;i++){
         if(dashboradcheck_name[i].checked==true){
          dashboardPaths=dashboardPaths+dashboradcheck_name[i].id+"','";
         }
      }
      if(dashboardPaths!="")
      {
      dashboardPaths=dashboardPaths.substr(0,dashboardPaths.length-"','".length);
       _.post({
				url:"/easWebClient/BIReport",
				beforeStart: _.Z,
				afterEnd: _.Z,
				json:{	    
						type: "action",
				        servletType: "BIFirstPage",		
						action: "delDefaultDashboradByManager",
						userid: user_id,
						dashboardpaths:dashboardPaths
					 },
				callback: function( r ) 
					 {		
					  var dashboards_table=	document.getElementById("dashboards_table");
                      if(r=="ok"){
                         for(var i=dashboradcheck_name.length;i>0;i--){
					         if(dashboradcheck_name[i-1].checked==true){
					           dashboards_table.deleteRow(i);
					         }
					      }
                      }
					 }
			});
		}
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
    <tr height="50px" style="color:#5B5C5F;">
      <td  rowspan="10" width="2%" ></td>
      <td width="39%" colspan="5 height="41" align="left" valign="bottom">
        <select id="query_type" name="select" class="inputcss" style="width:150px;">
          <option value="0">姓名</option>
          <option value="1">帐号</option>
        </select>
        <input id="user_input" name="textfield" type="text" class="inputcss">&nbsp;
        <button id="btnQuery" class="portal_button"  onclick="javascript:user_query();">查询</button>
        <input id="blur_query" name="checkbox" checked="true" type="checkbox" class="inputcss" value="checkbox">模
91a
糊查询
       </td>
      <td width="1%">&nbsp;</td>
    </tr>
    <tr>
	   <tr>
	   <td width="45%" height="24" align="left" valign="bottom">搜索到的用户：</td>
       <td width="1%" height="24" align="left" valign="bottom">&nbsp;</td>
	   <td colspan="2" align="left" valign="bottom">该用户的缺省视图仪表板：</td>
	   <td align="right" valign="bottom">
	   <button id="btndel" class="portal_button" onclick="ondelete();">删除</button>
	   </td>
	   </tr>
      <tr>
    <td>
	  <div class="divcss" style="height:250px;overflow:auto">	 
	  <table id="users_table" style="word-wrap:break-word;word-break:break-all;" width="100%"  border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"    class="tablecss" >
        <tr style="color:#5B5C5F;">
          <td></td>
          <td align="center" width="70" background="../img/ui-web/userview_tableheader.gif">帐号</td>
          <td align="center" width="70" background="../img/ui-web/userview_tableheader.gif">姓名</td>
          <td align="center" width="120" background="../img/ui-web/userview_tableheader.gif">行政组织</td>
          </tr>
        
      </table>
	   </div></td>
      <td height="27" align="left" valign="bottom"></td>
	  <td  colspan="3">
	   <div class="divcss" style="height:250px;overflow:auto">
        <table id="dashboards_table" style="word-wrap:break-word;word-break:break-all;" width="100%" border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"    class="tablecss" >
          <tr align="center" style="color:#5B5C5F;">
            <td width="20" background="../img/ui-web/userview_tableheader.gif">
			<input type="checkbox" onclick="javascript:checkAllDashboard(this);" ></td>
            <td width="110" background="../img/ui-web/userview_tableheader.gif">仪表板</td>
            <td width="130" background="../img/ui-web/userview_tableheader.gif">页签名</td>
          </tr>  
        </table>
      </div>
	  </td>
    </tr>
    
    
	<tr>
	  <td colspan="6"  height="20"><hr class="divcss"></td>
    </tr>
	<tr>
	<td  height="40" colspan="5" align="right" valign="middle">
	   <button id="btnClose" class="portal_button" onclick="window.close();">关闭</button>
	</td>
	<td  height="40"></td>
	</tr>
	<tr >
	  <td colspan="6" height="23"></td>
	</tr>
  </table>
</div>
</body>
</html>

0

