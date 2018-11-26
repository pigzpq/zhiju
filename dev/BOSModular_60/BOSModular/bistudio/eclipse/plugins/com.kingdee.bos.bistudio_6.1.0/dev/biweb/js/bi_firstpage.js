 //bi中心首页客户端代码文件
 //当前焦点所在行号
 var rowIndex;
 var dirty=false;
 var split2="/";
 var split3="//";
 //删除表格行（保留表头）
 function delTable(table)
 {
      var tb=document.getElementById(table);
	  var num=tb.rows.length;
	  for(var i=num-1;i>1;i--)
	  {
	    tb.deleteRow(i);
	 }
}
  //新增视图
 function addView(table)
 {
       document.getElementById("viewName").value="";
	   document.getElementById("viewName").focus();
	   delTable(table);
	   var views=document.getElementById("exist_view");
	   for(var i=0;i<views.options.length;i++)
	   {
	     if(views.options[i].selected)
	     {
		     views.value="";
		 }
	  }
}
	
 ////////////////////////////////////////////////////////////////////////////////////////////////
 //取视图仪表板
 function initDashBoard(r)
 {
     var tb=document.getElementById("dashoard_list");
	 delTable("dashoard_list");
	 var dashboards=r.split(split3);
	 for(var i=0;i<dashboards.length;i++)
			{  
			     if(dashboards[i]!="")
			        {
				          var dashboardPath=dashboards[i].split(split2)[0];
				          var dashboardCaption=dashboards[i].split(split2)[1];
				          var tabName=dashboards[i].split(split2)[2];
				          var creater=dashboards[i].split(split2)[3];
				          var newRow = tb.insertRow(); //创建新行
						  newRow.style.cursor="hand";
						  renderTable(tb);
						  (function(row) {
						  	  _.bindEvent(row, "onclick", function(){
								     renderTable(tb); 
								     row.className="focuscss";
								     rowIndex=row.rowIndex;
							 });
						  })(newRow);
						  
						  var newCell0 = newRow.insertCell(); //创建新单元格
						  var newCell1 = newRow.insertCell(); //创建新单元格
						  var newCell2 = newRow.insertCell(); //创建新单元格
						  //var newCell3 = newRow.insertCell(); //创建新单元格
						  newCell0.style.width="0px";
						  newCell1.style.height="19px"; //单元格内的内容
						  newCell1.style.width="50%";
						  newCell2.style.height="19px";
						  newCell2.style.width="50%";
						  //newCell3.style.height="19px";
						  //newCell3.style.width="2%";  
						      
						  newCell0.id=dashboardPath;
						  newCell1.innerText=dashboardCaption;
						  newCell2.innerText=tabName;
						 // newCell3.innerText=creater;
						  (function(cell2) {
						  	  _.bindEvent(cell2, "onclick", function(){
								    displayInput(cell2);//显示页签名称输入框
							 });
					       })(newCell2);
					}
			   }  
	
 }
 //新增仪表板
 function addDashboard(table)
 {
      var dialogWidth=258;
	  var dialogHeight=370;
	  var dialogTop=(screen.availHeight-dialogHeight)/2;
	  var dialogLeft=(screen.availWidth-dialogWidth)/2;
	  var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:yes;";
	  var sArg2 = "dialogTop:"+dialogTop+"px;dialogLeft:"+dialogLeft+"px;dialogWidth:"+dialogWidth+"px; dialogHeight:"+dialogHeight+"px;help:no;scroll:no;status:no";
	  var url="../html/BIDashboard_Selected.jsp";
	  var obj=document.getElementById("dashoard_list");
	  window.showModalDialog(url,window, sArg2);
    }
 //显示输入框
 function displayInput(cell)
 {
    _.unbindEvent(cell,"onclick");
	var objinput = document.createElement("input"); 
	objinput.type="text"; 
	objinput.value=cell.innerText; 
	cell.innerText="";
	objinput.name="temp"; 
	objinput.style.width=cell.clientWidth-3; 
	objinput.style.height=cell.clientHeight+2;
    cell.appendChild(objinput);	 
    objinput.onchange=function(){setDirty(true)};
    objinput.className="inputcss";
	objinput.focus(); 
	objinput.onblur=function()
	{
	  if(this.value.length>0)
	  {
	   cellOut(cell,this);
	  }else
	  {
	   var div_info=document.getElementById("div_info");
	   bi.getMessageTable({type:"info",caption:"页签名称不能为空!"},div_info);
	   this.focus(); 
	  }
	}

			
 }
 //失去焦点
 function cellOut(cell,objinput)
 {
    if(cell.childNodes.length>0)
    {
     cell.removeChild(cell.childNodes[0]); 
    }
    cell.innerText=objinput.value;
    _.bindEvent(cell, "onclick", function(){
         displayInput(cell);
       });
 }
 //渲染表格背景
 function renderTable(tb)
 {
      for(var i=1;i<tb.rows.length;i++)
      {
         if(i%2)
         {
          tb.rows[i].className="trcss_2";
         }else
         {
          tb.rows[i].className="trcss_1";
         }
      }
}  
 //删除选择的仪表板
 function delDashboard(table)
 {
  var tb=document.getElementById(table);
  if(rowIndex>0 && tb.rows.length>2 )
    {
     tb.deleteRow(rowIndex);
     setDirty(true);
    }else
    {
     var div_info=document.getElementById("div_info");
	 bi.getMessageTable({type:"info",caption:"请选择仪表板!"},div_info);
    }
  renderTable(tb);
  if(rowIndex>2){
  	rowIndex=rowIndex-1;
  	tb.rows[rowIndex].className="focuscss";
  }else if(rowIndex==2 && tb.rows.length>=3){
  	rowIndex=rowIndex;
  	tb.rows[rowIndex].className="focuscss";
  }

 }
 //上移 
 function moveUP(table)
 {
  var tb=document.getElementById(table);
  if(rowIndex>2)
  {
  	  if(tb.rows[rowIndex]!=null){
  	  	  setDirty(true);
		  var pre_id=tb.rows[rowIndex-1].cells[0].id;;
		  var pre_path=tb.rows[rowIndex-1].cells[1].innerText;
		  var pre_tab=tb.rows[rowIndex-1].cells[2].innerText;
		  //var pre_creator=tb.rows[rowIndex-1].cells[3].innerText;
		  var cur_id=tb.rows[rowIndex].cells[0].id;
		  var cur_path=tb.rows[rowIndex].cells[1].innerText;
		  var cur_tab=tb.rows[rowIndex].cells[2].innerText;
		  //var cur_creator=tb.rows[rowIndex].cells[3].innerText;
		  
		  tb.rows[rowIndex-1].cells[0].id=cur_id;
		  tb.rows[rowIndex-1].cells[1].innerText=cur_path;
		  tb.rows[rowIndex-1].cells[2].innerText=cur_tab;
		  //tb.rows[rowIndex-1].cells[3].innerText=cur_creator;
		  
		  tb.rows[rowIndex].cells[0].id=pre_id;
		  tb.rows[rowIndex].cells[1].innerText=pre_path;
		  tb.rows[rowIndex].cells[2].innerText=pre_tab;
		  //tb.rows[rowIndex].cells[3].innerText=pre_creator;
		  
		  rowIndex=rowIndex-1;
		  renderTable(tb);
		  tb.rows[rowIndex].className="focuscss";
	  }
  }
 }
 //下移
 function moveDown(table)
 {
   var tb=document.getElementById(table); 
  if(rowIndex<tb.rows.length-1 && rowIndex>0)
  {
  	  if(tb.rows[rowIndex]!=null){
  	  	  setDirty(true);
		  var next_id=tb.rows[rowIndex+1].cells[0].id;
		  var next_path=tb.rows[rowIndex+1].cells[1].innerText;
		  var next_tab=tb.rows[rowIndex+1].cells[2].innerText;
		  //var next_creator=tb.rows[rowIndex+1].cells[3].innerText;
		  
		  var cur_id=tb.rows[rowIndex].cells[0].id;
		  var cur_path=tb.rows[rowIndex].cells[1].innerText;
		  var cur_tab=tb.rows[rowIndex].cells[2].innerText;
		  //var cur_creator=tb.rows[rowIndex].cells[3].innerText;
		  
		  tb.rows[rowIndex+1].cells[0].id=cur_id;
		  tb.rows[rowIndex+1].cells[1].innerText=cur_path;
		  tb.rows[rowIndex+1].cells[2].innerText=cur_tab;
		  //tb.rows[rowIndex+1].cells[3].innerText=cur_creator;
		  
		  tb.rows[rowIndex].cells[0].id=next_id;
		  tb.rows[rowIndex].cells[1].innerText=next_path;
		  tb.rows[rowIndex].cells[2].innerText=next_tab;
		 // tb.rows[rowIndex].cells[3].innerText=next_creator;
		    
		  rowIndex=rowIndex+1;
		  renderTable(tb);
		  tb.rows[rowIndex].className="focuscss";
	  }
  }
 }
 //选择仪表板
function doSelectDashboard(dashboardPath,dashboardCaption,tabName,creator)
{
      var tb=document.getElementById("dashoard_list");
      //判断是否有重复
      for(var i=2;i<tb.rows.length;i++)
      {
        var id=tb.rows[i].cells[0].id;
        if(dashboardPath==id)
        {
          return "duple";
        }
      }
	  var newRow = tb.insertRow(); //创建新行
	  newRow.style.cursor="hand";
	  renderTable(tb);
	  _.bindEvent(newRow, "onclick", function(){
			     renderTable(tb); 
			     newRow.className="focuscss";
			     rowIndex=newRow.rowIndex;
			  }) 
	  var newCell0 = newRow.insertCell(); //创建新单元格
	  var newCell1 = newRow.insertCell(); //创建新单元格
	  var newCell2 = newRow.insertCell(); //创建新单元格
	  //var newCell3 = newRow.insertCell(); //创建新单元格
	  
	  newCell0.style.width="0px";
	  newCell1.style.height="19px"; //单元格内的内容
	  newCell1.style.width="50%";
	  newCell2.style.height="19px";
	  newCell2.style.width="50%";
	  newCell2.style.height="19px";
	
	  
	  newCell0.id=dashboardPath;
	  newCell1.innerText=dashboardCaption;
	  newCell2.innerText=tabName;
	  //newCell3.innerText=creator;
	   _.bindEvent(newCell2, "onclick", function(){
		    displayInput(newCell2);//显示页签名称输入框
	  });
}
//修改标志
function setDirty(isDirty){
    dirty=isDirty;	
}

 
 
 