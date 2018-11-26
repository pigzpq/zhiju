1ffe


<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>系统视图管理</title>
<link href="../css/bi_skin.css" rel="stylesheet" id="bi_skin" type="text/css"></link>
<script src="../js/bi_skin.js"></script>
<script src="../js/sue-main.js"></script>
<script src="../js/sue-config.js"></script>
<script src="../js/bi.js"></script>
<script src="../js/sue-ui.js"></script>
<script src="../js/bi_firstpage.js"></script>
<script>
//加载已有视图
var selectIndex="";
_.bindEvent(window, "load",getSystemView );
 function getSystemView()
 {         
         var btnclose=_.id("btnclose");
         bi.updateToPortalStyleButton(btnclose);
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
					    if(r.length>0){
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
					  }					
			 });
 }
 //删除视图
 function delView(table)
 {
	  var views=document.getElementById("exist_view");
	  var select_value=views.value;
	  var canDel=false;
	  if(select_value!="")
	  {
		   for(var i=0;i<views.options.length;i++)
		   {
			     if(views.options[i].selected)
			     {
				        var isDefault=(select_value.split("#"))[1];
				        if(isDefault!='1')
				        {
					        document.getElementById("viewName").value="";
					        views.options.remove(i);
					        delTable(table);
					        canDel=true;
					        break;
				        }else
				        {
				        	var div_info=document.getElementById("div_info");
				            bi.getMessageTable({type:"info",caption:"缺省视图不能被删除!"},div_info);
				            return;
				        }
			     }
	       }
	  }else
	  {
	      var div_info=document.getElementById("div_info");
		  bi.getMessageTable({type:"info",caption:"请选择要删除的视图!"},div_info);
		  return;
	  }
   if(canDel)
   {
    var  viewId=(select_value.split("#"))[0];
     _.post({
			url:"/easWebClient/BIReport",
			beforeStart: _.Z,
		    afterEnd: _.Z,
			json:{	    
				type: "action",
                servletType: "BIFirstPage",		
			    action: "delView",
			    viewID:viewId
				},
			callback: function( r ) 
				{
                 if(r=="ok"){
                    var div_info=document.getElementById("div_info");
				     bi.getMessageTable({type:"info",caption:"删除视图成功!"},div_info);
                 }else{
                    var div_info=document.getElementById("div_info");
				     bi.getMessageTable({type:"info",caption:r},div_info);
                 }           
				}					
		  });
     } 
  }
 //保存
 function saveSystemView(){
       var dashoards=document.getElementById("dashoard_list");
       var viewName=document.getElementById("viewName");
       var views=document.getElementById("exist_view");
       if(viewName.value.length<=0){
         var div_info=document.getElementById("div_info");
		 bi.getMessageTable({type:"info",caption:"视图名称不能为空!"},div_info);
         return;
       }
       
       //判断是否同名
       for(var i=0;i<views.options.length;i++){
            var name=views.options[i].innerText;
            if(name==viewName.value && !views.options[i].selected){
              var div_info=document.getElementById("div_info");
			  bi.getMessageTable({type:"info",caption:"相同视图名称已存在!"},div_info);
              viewName.focus();
              return;
            }
       } 
	   var viewId=(views.value.split("#"))[0];
	   var info="";
	   for(var i=2;i<dashoards.rows.length;i++){
	      var dashboardPath=dashoards.rows[i].cells[0].id;
	      var tabName=dashoards.rows[i].cells[2].innerText;
	      var creator="null";//dashoards.rows[i].cells[3].innerText;
	      info=info+dashboardPath+split2+tabName+split2+creator+split3
	   }
	   
	   if(info.length>0){
	     info=info.substr(0,info.length-2);
	   }
       _.post({
			url:"/easWebClient/BIReport",
			beforeStart: _.Z,
			afterEnd: _.Z,
			json:{	    
				 type: "action",
	             servletType: "BIFirstPage",		
				 action: "saveSystemView",
			     viewID:viewId,
			     viewName:viewName.value,
			     info:info
				 },
			callback: function( r ) 
				 {
	                if(r!="error"){
	                 setDirty(false);
	                 var div_info=document.getElementById("div_info");
				     bi.getMessageTable({type:"info",caption:"保存成功!"},div_info);
	                 //如果新增，则添加到已有视图
	                 if(views.selectedIndex==-1){
	                     var id=r;
	                     var text=viewName.value;
	                     select.add(new Option(text,id)); 
	                     select.options[select.options.length-1].selected="selected";
	                 }else{
	                     select.options[views.selectedIndex].innerText=viewName.value;
	                 }
	                }else{
	                 var div_info=document.getElementById("div_info");
				     bi.getMessageTable({type:"info",caption:r},div_info);
	                }       
				 }					
		});
	
 }
 //选择不同的视图显示不同仪表板
 function viewChange(object){
    setDirty(false);
    var viewID=object.value.split("#")[0];
    selectIndex=object.selectedIndex;
    document.getElementById("viewName").value=object.options[selectIndex].innerText;
     _.post({
			url:"/easWebClient/BIReport",
			beforeStart: _.Z,
		    afterEnd: _.Z,
			json:{	    
				type: "action",
                servletType: "BIFirstPage",		
			    action: "viewChange" ,
			    viewID:viewID
				},
			callback: function( r ) 
				{
				    initDashBoard(r);
				}					
			 });
 }
 function assignView(){
      if(dirty)
      {
       alert("当前内容已被修改,请先保存!");
       return;
      }else
      {
      var dialogWidth=560;
	  var dialogHeight=485;
	  var dialogTop=(screen.availHeight-dialogHeight)/2+20;
	  var dialogLeft=(screen.availWidth-dialogWidth)/2+40;
	  var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:yes;";
	  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
	  var url="../html/BIAssign_view.jsp";
	  window.showModalDialog(url,window, sArg2);
	  }
 }
 function window.onbeforeunload()
		{
		    if(dirty){
			   return "[请注意:当前内容的改动未保存。]";
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
    <tr>
      <td  rowspan="10" width="12" ></td>
      <td width="14%" height="40" valign="bottom">已有视图： </td>
      <td width="23%" align="right" valign="bottom">
      <a href="#" title="新增视图" onclick="javascript:addView('dashoard_list');"><img border="0" src="../dashboard/images/tbtn_new.gif" /></a>
      <a href="#" title="删除视图" onclick="javascript:delView('dashoard_list');"><img border="0" src="../dashboard/images/tbtn_delete.gif" /></a>
      <a href="#" title="保存" onclick="javascript:saveSystemView();"><img border="0" src="../dashboard/images/tbtn_save.gif" /></a>      </td>
      <td width="12" rowspan="3">&nbsp;</td>
      <td width="53%">&nb
9ae
sp;</td>
      <td width="3%">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" rowspan="2">
	    <div class="divcss">
	      <select name="select" id="exist_view" size="20" onchange="javascript:viewChange(this);" style="width:99%" >
          </select>
        </div></td>
      <td align="left" valign="bottom">视图名称：
      <input type="text" class="inputcss" onchange="javascript:setDirty(true);" id="viewName" maxlength="100" value="">      </td>
      <td align="center" valign="bottom"></td>
    </tr>
   
    <tr>
      <td  height="100%">
   
	  <div class="divcss" style="height:300px;overflow:auto"> 
	  <table style="word-wrap:break-word;word-break:break-all;" width="100%" id="dashoard_list"  border="1" cellpadding="0" cellspacing="0" bordercolor="#BFBFBF"    class="tablecss" >
        <tr style="color:#5B5C5F;">
          <td height="19" colspan="3" class="headercss">
		   <a href="#" title="新增仪表板" onclick="javascript:addDashboard('dashoard_list');"><img border="0" src="../dashboard/images/tbtn_new.gif" /></a>
        <a href="#" title="删除仪表板" onclick="javascript:delDashboard('dashoard_list');"><img border="0" src="../dashboard/images/tbtn_delete.gif" /></a>
        <a href="#" title="上移" onclick="javascript:moveUP('dashoard_list');"><img border="0" src="../img/ui-web/tbtn_pre.gif" /></a> 
        <a href="#" title="下移" onclick="javascript:moveDown('dashoard_list');"><img border="0" src="../img/ui-web/tbtn_next.gif" /></a>		  </td>
          </tr>
        <tr style="color:#5B5C5F;">
          <td width="0"></td>
          <td height="19" width="300" align="center" background="../img/ui-web/userview_tableheader.gif">仪表板</td>
          <td align="center" width="260" background="../img/ui-web/userview_tableheader.gif">页签名称</td>
          <!--<td align="center" width="20%" background="../img/ui-web/userview_tableheader.gif">创建人</td> -->
        </tr>
      </table>
	  </div>	  </td>
      <td width="12">&nbsp;</td>
    </tr>
	<tr>
	  <td colspan="5"  height="20">&nbsp;</td>
    </tr>
	<tr>
	<td id="btnclose" height="40" colspan="4" align="right" valign="middle">
	  <button id="btnCancel" class="portal_button" onclick="javascript:assignView();">视图分配</button>  
	  <button id="btnCancel" class="portal_button" onclick="window.close();">关闭</button>	</td>
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

