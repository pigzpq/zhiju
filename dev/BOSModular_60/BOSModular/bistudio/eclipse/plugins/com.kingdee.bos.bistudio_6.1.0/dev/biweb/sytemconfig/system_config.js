 
 var old_node=null;
 var dirty=false;
 var colorSelector=null;
 var split2 = "#";
 var split2 = "@/";
 var split3 = "@//";
 //颜色选择窗口
 function selectColor(id){	
 	    var obj=document.getElementById(id);
    	if(colorSelector!=null){
    		 colorSelector.destroy();
    	}   	
        colorSelector = new Ext.Window({                                         
       	title : '请选择颜色',                                         
       	id :'win',                                         
       	width : 380,                                         
       	height : 280,                                         
       	autoDestroy :true,                                         
       	items: [
         new Ext.menu.ColorItem({
             selectHandler: function(colorpicker, color){
             	  obj.style.backgroundColor=color;
             	  setDirty(true);
                  colorSelector.destroy();
                 }
             })
          ]

         })
        colorSelector.show(); 
	 }
 //内容改动后将改动标识置为true
 function setDirty(isDirty){
	    dirty=isDirty;
	 }
 Ext.onReady(function()
	{
	  Ext.util.CSS.swapStyleSheet('theme',cssName);   
	  //菜单根结点	
	  var root = new Ext.tree.TreeNode({
		id : 'root',
		text : ''
		});
	  //KPI菜单子结点	
	  var node_kpi_color = new Ext.tree.TreeNode({
		id : 'kpi_color',
		text : 'KPI仪表盘颜色设置',
		leaf : true
		});
	  
		
    //将子结点添加到跟结点中
	root.appendChild(node_kpi_color);
	
   
	//菜单面板
	var menuTree = new Ext.tree.TreePanel
	    ( {
			   border : false,
			   rootVisible : false,
			   root :root
		   });
	 //底层布局面板
	 new Ext.Viewport
		({				
		enableTabScroll:true,		
		layout:"border",   	
		items:[
					    
				{
					title:"系统配置",			    
					region:"west",			    
					width:150,
					collapsible:true, 		
					layout:"accordion",
			        margins:'12 0 50 12',
			        cmargins:'12 12 50 12',
			        lines:false,
			        autoScroll:true, 	    
					items:
						[
							{
							  title:"系统配置类型",
							  items:[menuTree]
							}	    	   
						]			    
				},	
						    
				{			    
					xtype:"panel",			   			    
					region:"center",
					layout:"fit",	
			        margins:'12 12 12 5',//top,right,buttom,left
			        cmargins:'12 12 12 12',
			        buttons:[{
			          text:"保存",
			          handler:function(){ doSave();}
			         },
			         {
			          text:"关闭",
			          handler:function(){ window.close();}
			        }],
					items:
						[
							{
							  title:"配置信息",
							  collapsible:false,
							  titleCollapse  :false, 
							  bodyBorder :false,
							  border:false,
							  autoScroll:true, 
							  html:'<div id="center_div"></div>'
							}		    	   
						]
				}
	         ]
    	});	
     
	 //判断当前节点是否改变
	 function checkNodeChange(node){
		 if(old_node==null || (old_node!=null && old_node.id!=node.id)){
		    return true;
		 }else{
		    return false
		 }
	  }	

	 //绑定节点单击事件
	 menuTree.on('click', function(node) 
	 {    
	       if(checkNodeChange(node) && dirty!=true)//菜单变动并且内容未被修改
			{   
				 doMenuChange(node);
			
			}else if(checkNodeChange(node) && dirty==true)
			{
			    Ext.Msg.confirm("系统提示","当前内容已被改动,确定切换菜单项？",function(btn)
			    {
		    	   if(btn == 'yes'){
		    		doMenuChange();
		    	   }    	
		         });  
			}

	  });
	  
	 //执行菜单选择事件（在该方法中添加自己的HTML）
     function doMenuChange(node)
     {
	   if (node.id=="kpi_color" ) 
		{
		    //加载html
			document.getElementById("center_div").innerHTML=_.loadUIT( "bi_dialog_systemconfig_kpicolor" );
			setKPIColor();	
		}
		old_node=node;
		setDirty(false);//更改菜单项后将已改动标识置为false
	   }
	  
});
    //设置kpi初始颜色
    function setKPIColor(){
      
       _.post({
				url:servletURL,
				beforeStart: _.Z,
		        afterEnd: _.Z,
				json:{	    
					  type: "action",
                      servletType: "SystemConfigure",		
					  action: "getKPIColor"
					  },
				callback: function( r ) 
					  {
					  	var kpi_good_color=r.split(split3)[0];
					  	var kpi_warning_color=r.split(split3)[1];
					  	var kpi_danger_color=r.split(split3)[2];
					  	document.getElementById("kpi_good_color").style.backgroundColor=kpi_good_color;
					  	document.getElementById("kpi_warning_color").style.backgroundColor=kpi_warning_color;
					  	document.getElementById("kpi_danger_color").style.backgroundColor=kpi_danger_color;	  	
					  }					
			 }); 
    	
    }
    //保存操作（在该方法中添加自己的保存操作判断）
	function doSave()
	{
		if(dirty)
		{
		  if(old_node.id=="kpi_color")
		  {
		    doKPIColorSave();
		  }
		}
		setDirty(false);
	}
	//保存KPI设置
	function doKPIColorSave(){
		  var kpi_danger_color=document.getElementById("kpi_danger_color").style.backgroundColor;
		  var kpi_warning_color=document.getElementById("kpi_warning_color").style.backgroundColor;
		  var kpi_good_color=document.getElementById("kpi_good_color").style.backgroundColor;
		  var paramValue=kpi_good_color+split3+kpi_warning_color+split3+kpi_danger_color;
		  _.post({
				url:servletURL,
				beforeStart: _.Z,
		        afterEnd: _.Z,
				json:{	    
					  type: "action",
                      servletType: "SystemConfigure",		
					  action: "saveKPIColor",
					  paramValue:paramValue
					  },
				callback: function( r ) 
					  {
					  	if(r=="ok"){
					  	   Ext.Msg.alert("系统提示"," 保存已成功！");	
					  	}else{
					  	   Ext.Msg.error("系统提示","保存失败！["+r+"]");	
					  	}
					  }					
			 }); 
	}
