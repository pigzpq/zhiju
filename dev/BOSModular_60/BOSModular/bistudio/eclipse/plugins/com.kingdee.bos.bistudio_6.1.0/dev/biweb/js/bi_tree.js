function bi_tree(sTreeType,sTreeCaption,sLoadTreeURL,sTreeRoot)
{
	this.treeType = sTreeType;
	this.treeCaption = sTreeCaption;
	this.treeRoot = sTreeRoot;
	this.tree = Sue.ui.tree( {
			parent: _.id( "tree_container" ),
			caption: "",//this.treeCaption,
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| ( node.reportType && node.reportType == "ext" && f( "extReport" ) )
					|| ( node.reportType && node.reportType == "dupont" && f( "dupontReport" ) )
					|| f( "report" );
			}
		} );
	this.Node = this.tree.getNodeConstructor();
	this.tree.vm.treeType = this.treeType;
	this.tree.vm.Node = this.Node;
	this.tree.vm.bi_tree = this;
	bi_tree_util.BIWebUtilServlet = sLoadTreeURL;
	bi_tree.servletURL = sLoadTreeURL;
}
var homepageid,firstNode;
bi_tree.click = function(_this) {
	switch(_this.vm.treeType) {
		case "report":				//报表
		case "configReport":		//主题
			if(!_this.folder)
				parent.document.getElementById( "bireport" ).contentWindow.tabbedpanel.append( {
					$uniqueValue: _this.value.url,
					caption: _this.caption,
					url: _this.value.url + "&caption=" + encodeURIComponent( _this.caption ),
					servletURL: bi_tree.servletURL
				} );
			break;		
		case "reportManager":		//主题管理
		case "dashboardManager":	//仪表板管理
			parent.document.getElementById( "bireport" ).contentWindow.robot.show( {
			    servletType: bi_tree_util.ServletType_BIWebUtil,
				treeType: _this.vm.treeType,
				parentPath: _this.value.url,
				servletURL: bi_tree.servletURL
			},_this.vm.bi_tree );
			parent.document.getElementById( "bireport" ).contentWindow.robot.refresh();
			break;
		case "dashboard":			//仪表板
			var rightFrame = parent.document.getElementById( "bireport" ).contentWindow;
			var tabbedpanel = rightFrame.tabbedpanel;
			if( !_this.folder ) {
				typeof firstNode == "undefined" || rightFrame.setDashBoardCurrentNode(firstNode);
				tabbedpanel.append( {
					$uniqueValue: _this.value.url,
					node: _this,
					caption: _this.caption,
					url: _this.value.url + "&caption=" + encodeURIComponent( _this.caption ),
					servletURL: bi_tree.servletURL,
					servletType: "BIDashBoard"
				} );
			}
			break;
		default:
			//do nothing;
			break;	
	}
};

bi_tree.lazyload = function(_this, callback) {
	_.post( {
		url: bi_tree.servletURL,
		// 鉴于左边树的容器太小，放不下portal规定的滚动条，这里把它屏蔽掉
		beforeStart: _.Z,
		afterEnd: _.Z,
		json: {	servletType: bi_tree_util.ServletType_BIWebUtil, id: _this.value.id ,treeType: _this.vm.treeType},
		callback: function( r ) {
			var nodes = [];
			if ( r != "empty" ) {
				var a = r.split( "|" ), node, aa;
				for( var i = 0, len = a.length; i < len; i++ ) {
					aa = a[i].split( "," );
					node = _this.vm.Node( {
						caption: aa[0],
						value: {
							id: aa[1],
							url: aa[2]
						},
						click: bi_tree.click,
						dblclick: _this.vm.treeType == "configReport"
							? function() {
								if ( this.folder ) {
									if ( !this.expanded ) {
										this.expand();
									} else {
										this.collapse();
									}
								} else {
									this.click( this );
								}
							}
							: null
					} );
					aa[3] != "false" && _.extend( node, { lazyload: bi_tree.lazyload, folder: true } );					
					
					if(_this.vm.treeType=="dashboard" && aa[1]==homepageid)
					{
						var rightFrame = parent.document.getElementById( "bireport" ).contentWindow;
						var tabbedpanel = rightFrame.tabbedpanel;
						var hashHomePage=rightFrame.getHashHomePage();
						if(hashHomePage!=true){
						node.captionCSSText = "color:red";
						firstNode=node;
						}
			   		}
			   		if( _this.vm.treeType == "configReport" ) {
				   		node.reportType = aa[4];
			   		}
					nodes.push( node );
				}
			}
			
			callback( nodes );
		}
		
	} );
	
};

bi_tree.prototype.expandToNode = function(nodeName) {
	var treeSelectedNode = this.tree.getSelectedNode();
	if(!treeSelectedNode) return;
	
	if (treeSelectedNode.lazyload) {
		treeSelectedNode.vm.lazyload(treeSelectedNode,lazyCallback);
	}else {
		if(!treeSelectedNode.expanded) 
			treeSelectedNode.expand();
		lazyCallback();
	}
	
	function lazyCallback() {
		var len = treeSelectedNode.children.length;
		for(var index=0;index<len;index++) {
			var node = treeSelectedNode.children[index];
			if(node.caption == nodeName) {
				node_click(node);
				return;
			}
		}
	}
	
	function node_click(node) {
		node.vm.selectedNode && ( node.vm.selectedNode.div.lastChild.style.backgroundColor = "" );
		node.vm.selectedNode = node;
		node.div.lastChild.style.backgroundColor = "#CCC";
		node.click && node.click( node );
	}
	
}


bi_tree.prototype.show = function(homepage) {
    homepageid=homepage;
	var nodes = [];
	var rootNode = this.Node( {
		caption:this.treeCaption, 
		value: {
			id: -1,
			url:""
		},
		click:bi_tree.click, 
		folder:true,
		dblclick: this.treeType == "configReport"
			? function() {
				if ( this.folder ) {
					if ( !this.expanded ) {
						this.expand();
					} else {
						this.collapse();
					}
				} else {
					this.click( this );
				}
			}
			: null
	} );
	this.tree.setRoot(rootNode);
	if ( this.treeRoot != "empty" ) {
		var a = this.treeRoot.split( "|" ), node, aa;
		for( var i = 0, len = a.length; i < len; i++ ) {
			aa = a[i].split( "," );
			node = this.Node( {
				caption: aa[0],
				value: {
					id: aa[1],
					url: aa[2]
				},
				click: bi_tree.click,
				dblclick: this.treeType == "configReport"
					? function() {
						if ( this.folder ) {
							if ( !this.expanded ) {
								this.expand();
							} else {
								this.collapse();
							}
						} else {
							this.click( this );
						}
					}
					: null
			} );
			aa[3] != "false" && _.extend( node, { lazyload: bi_tree.lazyload, folder: true } );

			if(this.treeType=="dashboard" && homepageid==aa[1]){
				node.captionCSSText = "color:red";
				firstNode=node;
		    }
	   		if( this.treeType == "configReport" ) {
		   		node.reportType = aa[4];
	   		}
			nodes.push( node );
		}
	}
	rootNode.append(nodes);
	
	// 应需求，显示树的时候自动点击根节点
	// 为模拟真实点击效果，直接操作了树节点的DOM对象
	_.extractEvent( rootNode.div.lastChild, "mouseup" )( rootNode );
};

/*
 * 将当前选中的仪表板设为首页
 */
bi_tree.prototype.setHomePage = function( doc ) {
	
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	if( view.selectedCount() == 0 || view.getSelectedItem().$info.isFolder) {
		view.setMessages( {
			type: "warning",
			caption: "请选择需要设首页的仪表板"
		} );
		return;
	}
	var parentPath = this.getSelectedFolderPath();	
	var path = view.getSelectedItem().$info.path;
	var dashboardName = view.getSelectedItem()[0];
	var _this = this;
	_.post( {
		url: bi_tree.servletURL,
		beforeStart: function( cfg ) {
			cfg.bar = bi.progressBar( doc );
			doc.body.style.cursor = "wait";
		},
		afterEnd: function( cfg ) {
			cfg.bar && cfg.bar.remove();
			delete cfg.bar;
			doc.body.style.cursor = "auto";
		},
		json: {	
				servletType: bi_tree_util.ServletType_BIWebUtil,		
				//action: "setHomePage",  
				action: "initHomePage",  //初始化首页配置界面
				path: path//仪表板path
			  },
		callback: function( r ) {
			    initHomePage(doc, path,r);//显示主页配置界面
			
			/*view.setMessages( {
				type: "info",
				caption: "首页设置成功"
			} );
			*/
		}
	} );
}

function initHomePage(doc,path,r){
	    //var  org=a[2].split( "|" );
		var sel_user="<option value=\"\">请选择....</option>";
		var sel_org="<option value=\"\">请选择....</option>";
		var sel_role="<option value=\"\">请选择....</option>";
		
	    //var r="1,u1|2,u2||1,r1|2,r2";
	    if(r.length>0){
			var  a= r.split( "||" );//根据符号"||"分解出用户、组织、角色
			if(a[0]!=""){
				var  user=a[0].split( "|" )
				//构造用户选择下拉框
				for(var i=0;i<user.length;i++){
					var u=user[i].split( "," );
					sel_user=sel_user+"<option value=\""+u[0]+"\">"+u[1]+"</option>";
				}
			};//根据符号"|"分解用户
			if(a[1]!=""){
				var  role=a[1].split( "|" );//根据符号"|"分解角色
				 //构造角色选择下拉框
				for(var i=0;i<role.length;i++){
					var r=role[i].split( "," );
					sel_role=sel_role+"<option value=\""+r[0]+"\">"+r[1]+"</option>";
				}
		    }
	    }
		/*	
        //构造组织选择下拉框
		for(var i=0;i<org.length;i++){
			var o=org[i].split( "," );
			sel_org=sel_org+"<option value=\""+o[0]+"\">"+o[1]+"</option>";
		}
		*/
		//开始构造初始界面
		//总的div
		var div = doc.createElement( "div" );
		    div.id="div_homepage";
		    div.style.padding = "10px";	  
		    //div.style.height=330;
		    div.style.width=400;    
		  
		//用户所属div
		var div2 = doc.createElement( "div" );
		    //div2.style.height=50;
		    div2.style.width=400;
		    div2.innerHTML="<div id=\"div_info\"></div><table width=\"380\" height=\"40\"  border=\"0\" style=\"border: solid 1px #718BB7\;font-size:11px\"><tr><td>"+
            "<input type=\"radio\" checked=\"checked\" name=\"group1\" id=\"user_id\" value=\"radiobutton\"  />用户 </td><td>"+
            "<input type=\"radio\" name=\"group1\"  id=\"role_id\"  value=\"radiobutton\"  />角色 </td><td>"+
            "<a href=\"#\" id=\"view_id\" name=\"view_a\">查看</a></td></tr></table><br/>";
         

        //对象选择div    
        var div3 = doc.createElement( "div" );
		    //div3.style.height=100;
		    div3.style.width=400;
		    div3.innerHTML=" <table width=\"380\"  border=\"0\" style=\"border: solid 1px #718BB7; font-size:11px\" ; bgcolor=\"#DBDBDB\"><tr>" +
		    		"<td width=\"187\">对象选择：</td><td width=\"192\">&nbsp;</td></tr><tr><td> <u>用户选择：<select style=\"width:120;font-size:12px\" id=\"select_user\" name=\"select_user\">" +sel_user+
		    		"</select></u></td><td><u>角色选择：<select style=\"width:120;font-size:12px\" id=\"select_role\" name=\"select_role\"  disabled=\"disabled\">"+sel_role+"</select></u> </td></tr><tr>" +
		    		"<td><u>组织选择：<select style=\"width:120;font-size:12px\" id=\"select_org\" name=\"select_org\"> "+sel_org+"</select></u></td><td></td></tr></table><br/>";
		
		 //已分配内容div    
        var div4 = doc.createElement( "div" );
		    //div4.style.height=120;
		    div4.style.width=400;
		    div4.innerHTML="<table width=\"380\" id=\"tbl_page\" height=\"85\" cellspacing=\"0\" border=\"1\" style=\"border: solid 1px #718BB7;font-size:11px \" bgcolor=\"#DBDBDB\"><tr>"
                    +"<td height=\"31\" colspan=\"3\">已分配内容：</td></tr><tr>"
                    +"<td height=\"25\"><div align=\"center\" >仪表板名称</div></td>"
                    +"<td height=\"25\"><div align=\"center\" >分配者</div></td>"
                    +"<td height=\"25\"><div align=\"center\" >分配时间</div></td>"
	                +"</tr><tr><td height=\"23\" bgcolor=\"#FFFFFF\"></td> <td bgcolor=\"#FFFFFF\" height=\"23\"></td> <td bgcolor=\"#FFFFFF\" height=\"23\"></td> " +
	                "</tr> <tr> <td height=\"31\"  align=\"right\" colspan=\"3\">"
                    +"BI主页已分配的仪表板</td></tr></table>";
		
		//将各个div的内容添加到总的div中
        div.innerHTML=div2.innerHTML+div3.innerHTML+div4.innerHTML;
		var dialog=Sue.ui.ext.dialog
	        (
	              {
	              document:doc,
		          caption: "BI主页分配设置",
		          width: 400,
		          height:300,
		          coveredDocuments: bi.getAllFramesDocuments(),
		          closeAction: "close"
		          }
		    );

		    //删除主页配置
		    dialog.addButton("删除", function() {
				   _.post( {
				        	url: bi_tree.servletURL,
				   	        beforeStart: _.Z,
		                    afterEnd: _.Z,
					    	json: {	
                                       	servletType: bi_tree_util.ServletType_BIWebUtil,		
										action: "delHomePage",  //删除仪表板配置
										user:doc.getElementById("select_user").value,//用户
										org:doc.getElementById("select_org").value,//组织
										role:doc.getElementById("select_role").value//角色
									   },
						    callback: function( r ) {    
						    	        var div_info=doc.getElementById("div_info");
						    	        bi.getMessageTable({type:"info",caption:"删除设置成功"},div_info);
							            var tbl=doc.getElementById("tbl_page");//清空已分配列表
							            tbl.rows(2).cells(0).innerText="";
										tbl.rows(2).cells(1).innerText="";
										tbl.rows(2).cells(2).innerText="";
										dialog.setButtonDisable("删除",true);
										;
						             }	
				            } 
					       );
			    });
		    //保存主页配置
		    dialog.addButton("保存", function() {
				   _.post( {
				    	url: bi_tree.servletURL,
				     	beforeStart: _.Z,
	                	afterEnd: _.Z,
				    	json: {	
								type: "action",
								servletType: bi_tree_util.ServletType_BIWebUtil,			
								action: "saveHomePage",  //保存仪表板配置
								user:doc.getElementById("select_user").value,//用户
								org:doc.getElementById("select_org").value,//组织
								role:doc.getElementById("select_role").value,//角色
								path: path//仪表板path
			          },
				        callback: function( r ) {     
				        	     var div_info=doc.getElementById("div_info");     
				        	           if(r=="2"){
				        	           	 bi.getMessageTable({type:"error",caption:"对象选择信息不全，无法保存"},div_info);
				        	           }else{				        	           	    
				        	           	     bi.getMessageTable({type:"info",caption:"保存设置成功"},div_info);
				        	           	     var  a= r.split( "," );//根据符号"|"进行分解
											 var  piecenName=a[0];//仪表板名称
											 var  creator=a[1];//创建人
											 var  createTime=a[2];//创建时间
					        	           	 var tbl=doc.getElementById("tbl_page");//已分配内容
						        	         tbl.rows(2).cells(0).innerText=piecenName;
											 tbl.rows(2).cells(1).innerText=creator;
											 tbl.rows(2).cells(2).innerText=createTime;
											 dialog.setButtonDisable("删除",false);
							                 
							            
				        	           }
				             }
		          } 
				);
				
		    });
		
	     //将div加入弹出面板
         dialog.setContent(div);
         dialog.setButtonDisable("删除",true);
         
         var user_id=doc.getElementById("user_id");//用户单选
         var role_id=doc.getElementById("role_id");//角色单选
         var view_a=doc.getElementById("view_id");//查看链接
         var tbl=doc.getElementById("tbl_page");//已分配内容
         
         var select_user=doc.getElementById("select_user");//用户下拉
	     var select_role=doc.getElementById("select_role"); //角色下拉
	     var select_org=doc.getElementById("select_org");//组织下拉
	    
	   
          //绑定用户单选按钮 
         _.bindEvent( user_id, "click", function() {   	
				select_user.disabled=false;
				select_org.disabled=false;
				select_role.value="";
				select_role.disabled=true;
				tbl.rows(2).cells(0).innerText="";
				tbl.rows(2).cells(1).innerText="";
				tbl.rows(2).cells(2).innerText="";
				dialog.setButtonDisable("删除",true);//删除按钮置灰
		});	
		  //绑定角色单选按钮      
         _.bindEvent( role_id, "click", function() {
         	    select_user.value="";
         	    select_org.value="";
				select_user.disabled=true;
				select_org.disabled=true;
				select_role.disabled=false;
				tbl.rows(2).cells(0).innerText="";
				tbl.rows(2).cells(1).innerText="";
				tbl.rows(2).cells(2).innerText="";
				dialog.setButtonDisable("删除",true);//删除按钮置灰
				
		});	
         //绑定查看链接   
         _.bindEvent( view_a, "click", function() {
				viewHomePage(doc,path, dialog);
		});
		
	    
		 //绑定用户下拉框       
         _.bindEvent( select_user, "change", function() {
		           tbl.rows(2).cells(0).innerText="";
				   tbl.rows(2).cells(1).innerText="";
				   tbl.rows(2).cells(2).innerText="";
         	    if(select_user.value.length>0){
         	    	 select_user.disabled=true;
         	    	 getOrgByUser(doc,dialog,tbl,select_user,path);
         	    }else{
	         	    for(var i=select_org.length;i>=0;i--){	         	    	   
		                     select_org.remove(i);               
		                   } 
		           select_org.options.add(new  Option("请选择....","")); 

         	    }
		  });
		
		 //绑定组织下拉框      
         _.bindEvent( select_org, "change", function() {   	
				getHomePageBySelectChange(dialog,tbl,select_user,select_org,select_role);	
		  });
		
		 //绑定角色下拉框
         _.bindEvent( select_role, "change", function() {
                 getHomePageBySelectChange(dialog,tbl,select_user,select_org,select_role);	
		});
		
		
}

//根据用户和path查询组织
function getOrgByUser(doc,dialog,tbl,user,path){
	if(user.value.length>0){
		 _.post( {
				    	url: bi_tree.servletURL,
				    	beforeStart: _.Z,
		                afterEnd: _.Z,
				    	json: {	
				    		    type: "action",
								servletType: bi_tree_util.ServletType_BIWebUtil,		
								action: "getOrgByUser",  
								path:path,
								user:user.value //用户ID	
			              },
				        callback: function( r ) {
				        	
				        	var obj=doc.getElementById("select_org");
				        	//先清空上次的结果
				          	for(var i=obj.length;i>0;i--){	         	    	   
		                    	 obj.remove(i);               
		                  	 }  
				        	//如果存在记录
				        	if(r.length>0){				        		
						        	var  a= r.split( "|" );//根据符号"|"进行分解
						        	for(var i=0;i<a.length;i++){
						        		var  aa= a[i].split( "," );
						        		obj.options.add(new  Option(aa[1],aa[0]));   
						        	}	
						     	      
				             }
				         user.disabled=false;
				         
				        }
		          } 
				);
			
		
	}
}

//根据下拉框的选项查询对应的主页配置
function getHomePageBySelectChange(dialog,tbl,user,org,role){
	
	if((user.value.length>0 && org.value.length>0)||(role.value.length>0)){
		 _.post( {
				    	url: bi_tree.servletURL,
				    	beforeStart: _.Z,
		                afterEnd: _.Z,
				    	json: {	
				    		    type: "action",
								servletType: bi_tree_util.ServletType_BIWebUtil,		
								action: "getHomePageBySelectChange",  
								org:org.value,//组织ID
								user:user.value, 	//用户ID		
								role:role.value //角色ID	
			              },
				        callback: function( r ) {
				        	//如果存在记录
				        	if(r.length>0){
				        		
						        	var  a= r.split( "," );//根据符号"|"进行分解
									var  piecenName=a[0];//仪表板名称
									var  creator=a[1];//创建人
									var  createTime=a[2];//创建时间
									
							        tbl.rows(2).cells(0).innerText=piecenName;
									tbl.rows(2).cells(1).innerText=creator;
									tbl.rows(2).cells(2).innerText=createTime;
									dialog.setButtonDisable("删除",false);//删除按钮可用
				             }else{
				             	tbl.rows(2).cells(0).innerText="";
								tbl.rows(2).cells(1).innerText="";
								tbl.rows(2).cells(2).innerText="";
								dialog.setButtonDisable("删除",true);//删除按钮置灰
				             }
				        }
		          } 
				);
			
		
	}else {
		tbl.rows(2).cells(0).innerText="";
		tbl.rows(2).cells(1).innerText="";
		tbl.rows(2).cells(2).innerText="";
		dialog.setButtonDisable("删除",true);//删除按钮置灰
	}	
	
	 
}
//查看主页配置信息
function viewHomePage(doc,path, parentDialog){  
	    var user= doc.getElementById("user_id");
	    var role= doc.getElementById("role_id");
	    parentDialog.hide();
	    var caption="";
	    var html="";
	    var div1 = doc.createElement( "div" );
	    div1.style.border="solid 1px #718BB7";
	    div1.style.position="absolute";
	    div1.style.height=330;
		div1.style.width=340;	
		//查询服务端数据
	    if(user.checked){
	    	_.post( {
	    		url: bi_tree.servletURL,
	    		beforeStart: _.Z,
		        afterEnd: _.Z,
				json: {
						type: "action",
						action:"viewHomePage",
						servletType:bi_tree_util.ServletType_BIWebUtil,
						path:path,
						actionType:"user_viewHomePage"
					  },
				callback: function( r )
				    {
					 //var r="user1,org1|user2,org2|user3,org3|user1,org1|user2,org2" 
	                     if(r.length>0)
	                     { 
			                     var a=r.split( "|" );
								 var userOrg="";
								 for(var i=0;i<a.length;i++)
								     {
							             var aa=a[i].split( "," );
							             userOrg=userOrg+"<tr><td bgcolor=\"#FFFFFF\" height=\"17\">"+aa[0]+"</td><td bgcolor=\"#FFFFFF\" >"+aa[1]+"</td></tr>";
				                     }
								 caption="该仪表板已分配的用户与组织";
					    	     div1.innerHTML="<table width=\"340\"  style=\"border: solid 1px #718BB7\;font-size:13px\"  bgcolor=\"#DBDBDB\" border=\"1\" cellspacing=\"0\"><tr> <td colspan=\"2\" height=\"31\">用户分配信息：</td> " +
					    			                "</tr><tr><td height=\"17\"><div align=\"center\" >用户</div></td><td><div align=\"center\" >组织<div></td> </tr>"+userOrg+"</table>";
						
                         }else
                         {
		                         caption="该仪表板已分配的用户与组织";
				    	         div1.innerHTML="<table width=\"340\"  style=\"border: solid 1px #718BB7\;font-size:13px\"  bgcolor=\"#DBDBDB\" border=\"1\" cellspacing=\"0\"><tr> <td colspan=\"2\" height=\"31\">用户分配信息：</td> " +
				    			                "</tr><tr><td height=\"17\"><div align=\"center\" >用户</div></td><td><div align=\"center\" >组织<div></td> </tr><tr><td bgcolor=\"#FFFFFF\" height=\"17\"></td><td bgcolor=\"#FFFFFF\" ></td></tr></table>";
                         
                          }
				   
				        bi_tree.displayHomePage(div1,doc,caption,parentDialog);
				   }
				} 
			);
	    	
	    }else if(role.checked){ 	
	    	_.post( {
	    		url: bi_tree.servletURL,
	    		beforeStart: _.Z,
		        afterEnd: _.Z,
				json: {
						type: "action",
						action:"viewHomePage",
						servletType:bi_tree_util.ServletType_BIWebUtil,
						path:path,
						actionType:"role_viewHomePage"
					  },
				callback: function( r ) 
				      {
				      	
					   //var r="role1|role2|role3" 
					   if(r.length>0)
					       {	
								 var a=r.split( "," );
								 var role="";
								 for(var i=0;i<a.length;i++)
								     {
						            	 role=role+"<tr><td bgcolor=\"#FFFFFF\" height=\"17\">"+a[i]+"</td></tr>";
				                     }
					    	     caption="该仪表板已分配的角色";
					    	     div1.innerHTML="<table width=\"340\" style=\"border: solid 1px #718BB7\;font-size:13px\" bgcolor=\"#DBDBDB\" border=\"1\" cellspacing=\"0\"><tr> <td height=\"31\">角色分配信息：</td> " +
				    			        " </tr><tr><td height=\"17\"><div align=\"center\" >角色</div></td></tr>"+role+"</table>"
						   }else
						   {
							     caption="该仪表板已分配的角色";
			    	             div1.innerHTML="<table width=\"340\" style=\"border: solid 1px #718BB7\;font-size:13px\" bgcolor=\"#DBDBDB\" border=\"1\" cellspacing=\"0\"><tr> <td height=\"31\">角色分配信息：</td> " +
			    			        " </tr><tr><td height=\"17\"><div align=\"center\" >角色</div></td></tr><tr><td bgcolor=\"#FFFFFF\" height=\"17\"></td></tr></table>"
						  
						   }
						  bi_tree.displayHomePage(div1,doc,caption,parentDialog);
						}
				} 
			);
	    	
	    }

     }
 //查看主页配置的div    
bi_tree.displayHomePage=function(div1,doc,caption,parentDialog){
		var div = doc.createElement( "div" );
		    div.style.padding = "10px";	  
		    div.style.height=330;
		    div.style.width=380;
		    div.style.overflow="auto";
		    div.innerHTML=div1.innerHTML;
		    
		var dialog=Sue.ui.ext.dialog
	        (
	              {
	              document:doc,
	              caption: caption,
		          width: 400,
		          height:400,
		          coveredDocuments: bi.getAllFramesDocuments(),
		          destroyHook: function(){    	
		          	parentDialog.show();
		          },
		          closeAction: "close"
		          }
		    );
		   
          dialog.setContent(div);	
}
/*
 * 编辑仪表板
 */
bi_tree.prototype.editDashboad = function() {
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	if( view.selectedCount() == 0 || view.getSelectedItem().$info.isFolder) {
		view.setMessages( {
			type: "warning",
			caption: "请选择需要编辑的仪表板"
		} );
		return;
	}
	var parentPath = this.getSelectedFolderPath();	
	var path = view.getSelectedItem().$info.path;
	var dashboardName = view.getSelectedItem()[0];
	var _this = this;
	_.post( {
		url: bi_tree.servletURL,
		beforeStart: _.Z,
		afterEnd: _.Z,
		json: {	
				servletType: bi_tree_util.ServletType_BIWebUtil,		
				action: "getDashboardXML",
				path: path
		},
		callback: function( ret ) {
			var dashboardXml = ret;
			var dashboard = new bi_dashboard_design(dashboardName,parentPath,_this.tree,view,bi_tree.servletURL,dashboardXml)
			var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:no;"; 
			var bReturn = showModalDialog("../dashboard/designer.jsp", dashboard,sArg);
		}
	} );
}

/*
 * 新建仪表板
 */
bi_tree.prototype.newDashboad = function( doc ) {
	var _this = this;
	bi.input( {
		document: doc,
		caption: "新建仪表板",
		text: "请输入仪表板名称：",
		verify: function(dashboardName) {
			var str = dashboardName.replace(/(^\s*)|(\s*$)/g,"");
			if(str=="") {
				return {
					type: "warning",
					caption: "请输入仪表板名称"
				};
			}
			if (str.length >= 80) {
				return {
					type: "warning",
					caption: "仪表板名称不允许超出80个字符"
				};
			}
			return true;
		},
		ok: function( dashboardName ) {
			dashboardName = dashboardName.replace(/(^\s*)|(\s*$)/g,"");
			var parentPath = _this.getSelectedFolderPath();
			var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
			var dashboard = new bi_dashboard_design(dashboardName,parentPath,_this.tree,view,bi_tree.servletURL)
			var sArg = "dialogTop:0px;dialogLeft:0px;dialogWidth: " + screen.availWidth + "px; dialogHeight:" + screen.availHeight +"px;help:no; scroll:no;"; 
			var bReturn = showModalDialog("../dashboard/designer.jsp", dashboard,sArg);
		}
	} );
	
}

bi_tree.prototype.getSelectedFolderPath = function() {

	var node = this.tree.getSelectedNode();
	var folderPath = "";
	if(!node) {
	}
	else if (node.folder)
		folderPath = node.value.url;
	else {
		if(node.value.url.lastIndexOf("/")!=-1)
			folderPath = node.value.url.match(/(.*)\/.*$/)[1];
		node = node.parent;
	}
	return folderPath;	
}

/*
 * 删除当前选中的目录或结点
 */
bi_tree.prototype.delNode = function( doc ) {
	
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	
	var nodeTypename;
	var nodePath;
	var nodeCaption;
	var operateLeft = true;
	var operateFolder = false;
	var treeSelectedNode;
	if (this.treeType == "reportManager")
		nodeTypename = "主题";
	else if (this.treeType == "dashboardManager")
		nodeTypename = "仪表板";

	treeSelectedNode = this.tree.getSelectedNode();
	if(view.selectedCount() == 0) {
		//视图中没有选中任何条目，则针对左侧目录树操作。
		if (treeSelectedNode == null) return;
		if (treeSelectedNode.folder) 
			operateFolder = true;
		nodePath = treeSelectedNode.value.url;
		nodeCaption = treeSelectedNode.caption;
	} else {
		operateLeft = false;
		if (view.getSelectedItem().$info.isFolder) 
			operateFolder = true;
		nodePath = view.getSelectedItem().$info.path;
		nodeCaption = view.getSelectedItem()[0];
	}

	if(operateFolder)
		nodeTypename += "目录";
	
	if(nodePath=="") {
		view.setMessages( {
			type: "warning",
			caption: "不允许删除根目录"
		} );
		return;
	}
	var _this = this;
	bi.confirm( {
		document: doc,
		caption: "删除",
		text: "您确认要删除" + nodeTypename + "\"" + nodeCaption + "\"吗？",
		no: _.Z,
		yes: function() {
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: function( cfg ) {
					cfg.bar = bi.progressBar( doc );
					doc.body.style.cursor = "wait";
				},
				afterEnd: function( cfg ) {
					cfg.bar && cfg.bar.remove();
					delete cfg.bar;
					doc.body.style.cursor = "auto";
				},
				json: {	
						servletType: bi_tree_util.ServletType_BIWebUtil,			
						action: "repDel",
						treeType: _this.treeType,
						path: nodePath,
						caption: nodeCaption
					  },
				callback: function( ret ) {
					view.setMessages( {
						type: "info",
						caption: "删除成功"
					} );
					if(operateLeft) {
						var parentNode = treeSelectedNode.parent;
						parentNode.remove(treeSelectedNode);
						node_click(parentNode);
					}else {
						if(operateFolder && treeSelectedNode.children) {
							var childrenLen = treeSelectedNode.children.length;
							for(var index=0; index < childrenLen; index++) {
								if(treeSelectedNode.children[index].caption == nodeCaption) {
									treeSelectedNode.remove(treeSelectedNode.children[index]);
									break;
								}
							}
						}
						view.refresh();
					}
				}
			} );
		}
	} );
	
	function node_click(node) {
		node.vm.selectedNode && ( node.vm.selectedNode.div.lastChild.style.backgroundColor = "" );
		node.vm.selectedNode = node;
		node.div.lastChild.style.backgroundColor = "#CCC";
		node.click && node.click( node );
	}
};

/*
 * 新建目录
 */	
bi_tree.prototype.newDirectory = function( doc ) {
	var _this = this;
	var robot = parent.document.getElementById( "bireport" ).contentWindow.robot;
	bi.input( {
		document: doc,
		caption: "新建目录",
		text: "请输入目录名称：",
		verify: function( dirName ) {
			// 若目录名不为空校验通过
			if ( /^\s*$/.test( dirName ) ) 
				return {
					type: "warning",
					caption: "请输入目录名称"
				};
			if (dirName.length >= 80)
				return {
					type: "warning",
					caption: "目录名不允许超出80个字符"
				};
			return true;
		},
		ok: function( dirName ) {
			var node = _this.tree.getSelectedNode();
			var parentPath = "";
			if(!node) {
				node = _this.tree.root;
			}
			else if (node.folder)
				parentPath = node.value.url;
			else {
				if(node.value.url.lastIndexOf("/")!=-1)
					parentPath = node.value.url.match(/(.*)\/.*$/)[1];
				node = node.parent;
			}
		
			dirName = dirName.replace(/(^\s*)|(\s*$)/g,"");
			
			//提交请求，新生成目录。
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: function( cfg ) {
					cfg.bar = bi.progressBar( doc );
					doc.body.style.cursor = "wait";
				},
				afterEnd: function( cfg ) {
					cfg.bar && cfg.bar.remove();
					delete cfg.bar;
					doc.body.style.cursor = "auto";
				},
				onServerException: function( error ) {
					robot.setMessages( {
						type: "error",
						caption: "新建目录失败",
						messages: error.message
					} );
				},
				json: {	
						servletType: bi_tree_util.ServletType_BIWebUtil,			
						action: "repNewDir",
						path: parentPath,
						caption: dirName,
						treeType: _this.treeType
				},
				callback: function( ret ) {
					var a = ret.split(",");
					//为了保证树结点的状态正确,如果父结点未展开,强制展开一次.否则,直接添加结点即可.
					node.lazyload
					? node.vm.lazyload( node )
					: node.append( _this.Node( {
						caption: a[0],
						value: { id: a[1] ,url:a[2]},
						lazyload: a[3] == "false"?null:bi_tree.lazyload,
						folder: a[3],
						click: bi_tree.click
					} ) );
					robot.refresh( {
						selectedCaption: dirName
					} );
					robot.setMessages( {
						type: "info",
						caption: "新建目录成功！"
					} );
				}
			} );
		}
	} );
};

bi_tree.prototype.renameDirectory = function( doc, oldName ) {
	var _this = this;
	var robot = parent.document.getElementById( "bireport" ).contentWindow.robot;
	bi.input( {
		document: doc,
		caption: "重命名目录",
		text: "请输入新的目录名称：",
		verify: function( dirName ) {
			if ( /^\s*$/.test( dirName ) ) {
				return {
					type: "warning",
					caption: "请输入目录名称"
				};
			} else if ( bi_tree_util.checkExistViewItem( robot, dirName, true ) ) {
				return {
					type: "warning",
					caption: "重命名失败",
					messages: "您输入的目录名已经存在，请更换一个名称"
				};
			} else if (dirName.length >= 80)
				return {
					type: "warning",
					caption: "目录名不允许超出80个字符"
				};
			return true;
		},
		ok: function( dirName ) {
			dirName = dirName.replace(/(^\s*)|(\s*$)/g,"");
			var node = _this.tree.getSelectedNode();
			var parentPath = "";
			if (!node) {
				node = _this.tree.root;
			} else if (node.folder) {
				parentPath = node.value.url;
			} else {
				if ( node.value.url.lastIndexOf("/") != -1 ) {
					parentPath = node.value.url.match(/(.*)\/.*$/)[1];
				}
				node = node.parent;
			}
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: function( cfg ) {
					cfg.bar = bi.progressBar( doc );
					doc.body.style.cursor = "wait";
				},
				afterEnd: function( cfg ) {
					cfg.bar && cfg.bar.remove();
					delete cfg.bar;
					doc.body.style.cursor = "auto";
				},
				onServerException: function( error ) {
					robot.setMessages( {
						type: "error",
						caption: error.message
					} );
				},
				json: {	
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "repRenameDir",
					path: parentPath,
					oldName: oldName,
					newName: dirName,
					treeType: _this.treeType
				},
				callback: function( ret ) {
					// TODO: 有问题这里
					_.hash( node.children, "caption", _.I )[ oldName ].setCaption( dirName );
					robot.refresh( {
						selectedCaption: dirName
					} );
					robot.setMessages( {
						type: "info",
						caption: "目录重命名成功！"
					} );
				}
			} );
		}
	} );
}

var importDialog;
bi_tree.prototype.importDashboard = function( doc )
{
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	var node = this.tree.getSelectedNode();
	var parentPath = "";
	if(node) {
		parentPath = node.value.url;
	}

	if(!importDialog)
	{
		var dialog = new Sue.ui.ext.dialog({
			width: 500,
			caption: "导入仪表板",
			document: doc
		});
		dialog.content.innerHTML = _.loadUIT( "bi_dialog_dashboard_import");
		var msgDiv = bi_tree_util.f( dialog,"msgDiv" );

		var uploadBtn = bi_tree_util.f(dialog,'btnUpload');
		var uploadFilePath = bi_tree_util.f(dialog,'uploadFilePath');
		var form = bi_tree_util.f(dialog,"form");
		var btnField = bi_tree_util.f(dialog,"btnField");
		form.action = bi_tree.servletURL;
	
		_.bindEvent( uploadBtn, "click", function() {
			if (uploadFilePath.value == "") {
				bi.getMessageTable( {
					type: "warning",
					caption: "请先选择要导入的文件"
			}, msgDiv );
			return ;
		}
		if ( !/\.(zip)$/i.test(uploadFilePath.value.toLowerCase()) )
		{
			bi.getMessageTable( {
				type: "warning",
				caption: "导入文件扩展名必须是zip"
			}, msgDiv );
			return ;
		}
		
		var overwrite = bi_tree_util.f( dialog,"overwrite" );
		var overwriteHidden = bi_tree_util.f( dialog,"overwriteHidden" );
		overwriteHidden.value = overwrite.checked;

		bi.getMessageTable( {
					type: "info",
					caption: "",
					messages: "正在导入，请稍候..."
				}, msgDiv );
				
		var uploader = bi_tree_util.f( dialog,'uploader' ); 
		_.unbindEvent( uploader ); 
		_.bindEvent( uploader, 'load', function() {
			var info = eval( '(' + uploader.contentWindow.document.body.innerHTML + ')' ); 
			if ( 'error' in info )
				bi.getMessageTable( {
					type: "error",
					caption: "导入失败",
					messages: info.error.message
				}, msgDiv );
			else {
				var message = info.result;
				var message2;
				while(message2!=message)
				{
					message2 = message;
					message = message.replace('\|\|\|\|','<br/>');
				}
			
				view.refresh();
				bi.getMessageTable( {
					type: "info",
					caption: "",
					messages: message
				}, msgDiv );
//				bi.confirm({
//					caption:"导入结果",
//					text: message,
//					document: doc,
//					cancel: function(){}
//				});
			}
			});
		form.submit();
		
		});
		
		importDialog = dialog;
		
	}
	var savePath = bi_tree_util.f( importDialog,"savePath" );
	savePath.value = parentPath;
	var msgDiv = bi_tree_util.f( importDialog,"msgDiv" );
	msgDiv.innerHTML = "";
	bi.updateToPortalStyleButton( importDialog.root );
	importDialog.show();
}


bi_tree.prototype.exportDashboard = function( doc )
{
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	var rows = view.getSelectedRows();
	var rowDatas = view.getSelectedRowDatas();
	
	if( rows.length == 0) {
		view.setMessages( {
			type: "warning",
			caption: "未选中仪表板和目录"
		} );
		return;
	}
	var names = "";
	for(var i=0;i<rows.length;i++)
	{
		if(i>0)
			names = names + "<br/>";
		names = names + rowDatas[i][0];
	}
	bi.confirm({
		caption:"确认导出",
		text: "确认导出以下仪表板文件和目录？<br/>" + names,
		document: doc,
		no: function(){},
		yes: function()
		{
			var paths = "";
			for(var i=0;i<rowDatas.length;i++)
			{
				if(i>0)
					paths += "|";
				paths += rowDatas[i].$info.path;	 
			}
			
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: function( cfg ) {
					cfg.bar = bi.progressBar( doc );
					doc.body.style.cursor = "wait";
				},
				afterEnd: function( cfg ) {
					cfg.bar && cfg.bar.remove();
					delete cfg.bar;
					doc.body.style.cursor = "auto";
				},
				json: {	
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "repExportDashboard",
					paths: paths
				},
				callback: function( ret ) {
					_.crt("iframe", {
							src: ret
						}, doc.body, "display:none;height:0px;width:0px;position:absolute" );
				}
			} );
		}
	});
}		
	

/**
 * 发布到portlet brcue_sha 2010-02-25
 */
var portletDialog=null;
bi_tree.prototype.publishPortlet = function( doc )
{
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;//右表
	//if( view.selectedCount() == 0 || view.getSelectedItem().$info.isFolder) {
	//支持文件夹的整体发布为portlet 2010-02-25 bruce_sha
	if( view.selectedCount() == 0 && !view.getSelectedItem().$info.isFolder) {
		view.setMessages( {
			type: "warning",
			caption: "未选中记录"
		} );
		return;
	}
	if(portletDialog==""||portletDialog==null){
	 portletDialog = new Sue.ui.ext.dialog({
		width: 400,
		caption: "发布到Portlet",
		document: doc
	});
	}

	portletDialog.content.innerHTML = _.loadUIT( "bi_dialog_publish_portlet");
	
	//设置“是否页签显示”是否隐藏
	var treeType=this.treeType;
	if(treeType!=="dashboardManager"){
		doc.getElementById('portletIsTabDiv').style.display="none";
	}
	
	var parentPath = this.getSelectedFolderPath();	
	
	var name = view.getSelectedItem()[0];//名称
	var path = view.getSelectedItem().$info.path;//路径
	var isFolder = view.getSelectedItem().$info.isFolder;//是否文件夹
	var type = view.getSelectedItem().$info.themeReportType;//类型
	
	var _this = this;
	var robot = view; //右表

	var msgDiv = bi_tree_util.f( portletDialog,"msgDiv" );//信息提示
	var btnconfirm =  doc.getElementById('btnconfirm');//按钮
	var portletNumber = doc.getElementById('portletNumber');//编码-必填
	var portletName = doc.getElementById('portletName');//名称-必填
	var portletDescription = doc.getElementById('portletDescription');//描述
	var portletIsTab = doc.getElementById('portletIsTab');//描述
	
	portletName.value=name;//名称默认值为报表名
	
	_.bindEvent( btnconfirm, "click", function() {
	
		//编码校验
		if (portletNumber.value == "") {
			bi.getMessageTable( {
				type: "warning",
				caption: "请输入编码"
			}, msgDiv );
			return ;
		}
		//名称校验
		if (portletName.value == "") {
			bi.getMessageTable( {
				type: "warning",
				caption: "请输入名称"
			}, msgDiv );
			return ;
		}
		_.post( {
			url: bi_tree.servletURL, // 提交到的servlet地址：实际上是BIReport
			beforeStart: _.Z,  //_.z表示去状态条
			afterEnd: _.Z,
			json: {	
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "publishPortlet",
					path: path,
					type: type,
					portletNumber: portletNumber.value ,
					portletName: portletName.value,
					portletDescription: portletDescription.value,
					portletIsTab: portletIsTab.checked
			},
			callback: function( ret ) {
					robot.refresh();//重新刷新
					robot.setMessages( {
						type: "info",
						caption: "发布到Portlet成功！"
					} );
					portletDialog.destroy();
					portletDialog=null;
			}
		} );
		
	});
	
	bi.updateToPortalStyleButton( portletDialog.root );//按钮风格
	portletDialog.show();//最后才显示
}



bi_tree.prototype.renameDashboard = function( doc, oldName ) {
	var view = parent.document.getElementById( "bireport" ).contentWindow.robot;
	if( view.selectedCount() == 0 || view.getSelectedItem().$info.isFolder) {
		view.setMessages( {
			type: "warning",
			caption: "未选中仪表板"
		} );
		return;
	}
	var parentPath = this.getSelectedFolderPath();	
	var path = view.getSelectedItem().$info.path;
	var dashboardName = view.getSelectedItem()[0];
	
	var _this = this;
	var robot = view; 
	bi.input( {
		document: doc,
		caption: "重命名",
		text: "请输入新名称：",
		verify: function( newName ) {
			if ( /^\s*$/.test( newName ) ) {
				return {
					type: "warning",
					caption: "请输入名称"
				};
			} else if ( bi_tree_util.checkExistViewItem( robot, newName,false ) ) {
				return {
					type: "warning",
					caption: "重命名失败",
					messages: "您输入的文件名已经存在."
				};
			} else if (newName.length >= 80)
				return {
					type: "warning",
					caption: "文件名不允许超出80个字符"
				};
			return true;
		},
		ok: function( newName ) {
			
			newName = newName.replace(/(^\s*)|(\s*$)/g,"");
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: function( cfg ) {
					cfg.bar = bi.progressBar( doc );
					doc.body.style.cursor = "wait";
				},
				afterEnd: function( cfg ) {
					cfg.bar && cfg.bar.remove();
					delete cfg.bar;
					doc.body.style.cursor = "auto";
				},
				onServerException: function( error ) {
					robot.setMessages( {
						type: "error",
						caption: error.message
					} );
				},
				json: {	
					servletType: bi_tree_util.ServletType_BIWebUtil,
					action: "repRenameDashboard",
					path: path,
					newName: newName,
					treeType: _this.treeType
				},
				callback: function( ret ) {
					// TODO: 有问题这里
					//var node = _this.tree.getSelectedNode();
					//node.setCaption( newName );
					robot.refresh( {
						selectedCaption: newName
					} );
					robot.setMessages( {
						type: "info",
						caption: "重命名成功！"
					} );
				}
			} );
		}
	} );
}


/*
 * 初始化主题配置对话框。该函数只执行一次
 */
bi_tree.themeDialogInitializer = function( doc, afterInitHook ) {
	bi_tree.themeDialog = Sue.ui.ext.dialog( {
		document: doc,
		caption: "新建",
		width: 350,
		height: 360,
		coveredDocuments: bi.getAllFramesDocuments()
	} );
	bi_tree.themeDialog.setContent( _.loadUIT( "bi_dialog_report_config" ) );
	bi_tree.themeDialog.addButton( "保存", save );
	bi_tree.themeDialog.show = _.link( function() {
		msgDiv.innerHTML = "";
	}, _.bind( bi_tree.themeDialog.show, bi_tree.themeDialog ) );
	var divName = _.select(bi_tree.themeDialog.content,"sue",1,"subName");
	var name_input = _.find( divName, function( e ) {
		return e.tagName && e.tagName.toLowerCase() == "input";
	}, 1 )[0];
	try{
		name_input.focus();
    }catch(e){}
    // 支持回车保存
    _.bindEvent(name_input, "keypress", function( e ) {
    	if ( e.keyCode == 13 ) {
    		save();
    	}
    });
	var divTreeParent = _.select(bi_tree.themeDialog.content,"sue",1,"themeTree");
	var msgDiv = _.select(bi_tree.themeDialog.content,"sue",1,"msgDiv");
	var cbDataCenter = _.select(bi_tree.themeDialog.content,"sue",1,"cbdatacenter");
	var dataCenterList = _.select(bi_tree.themeDialog.content,"sue",1,"datacenterlist");
	
	dataCenterList.disabled = true;
	_.bindEvent(cbDataCenter, "click", function( e ) {
   		dataCenterList.disabled = !cbDataCenter.checked;
   		if(cbDataCenter.checked&&!cbDataCenter.inited)
   		{
   			initDataCenter();
   		}
    });
	function initDataCenter(defaultDataCenter)
	{
		if(!cbDataCenter.inited)
		{
			_.post( {
				url: bi_tree.servletURL,
				json: {
					servletType: "getDataCenterList",
					async: false
				},
				callback: function( r ) 
				{
					var dcs = eval(r);
					if(!dcs)
						dcs = [];
					if(!(dcs instanceof Array))
						dcs = [dcs];
					for(i=0;i<dcs.length;i++)
					{
						var opt  =new Option(dcs[i],dcs[i]);
						if(dcs[i]==defaultDataCenter)
							opt.selected = true;
						dataCenterList.options[i] = opt;
					}
				}
			});
			cbDataCenter.inited = true;
		}
	}
	
	var _this = this;
	bi.updateToPortalStyleTextField( bi_tree.themeDialog.content, {
		backgroundColor: Sue.config.cs[14]
	} );
	var oldCaption = "";
	var robot = parent.document.getElementById( "bireport" ).contentWindow.robot;
	bi_tree.themeDialog.show();
	var reportTree = init(divTreeParent,reportTreeLazyload);
	
	
	
	function reportTreeClick(_node) {
		if (!_node.folder) {
			name_input.value = _node.caption;
		}
	}
	function reportTreeLazyload(_node, callback )
	{
		_.post( {
			url: bi_tree.servletURL,
			beforeStart: function( cfg ) {
				cfg.bar = bi.progressBar( doc );
				doc.body.style.cursor = "wait";
			},
			afterEnd: function( cfg ) {
				cfg.bar && cfg.bar.remove();
				delete cfg.bar;
				doc.body.style.cursor = "auto";
			},
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,			
				id: _node.value.id ,
				treeType: "report"
			},
			callback: function( r ) 
			{
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), node, aa;
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						var Node = reportTree.getNodeConstructor();							
						node = Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: reportTreeClick,
							dblclick: function() {
								if ( this.folder ) {
									if ( !this.expanded ) {
										this.expand();
									} else {
										this.collapse();
									}
								} else {
									this.click( this );
								}
							}
						} );
						if(aa[3]!="false")
							_.extend( node, { lazyload: reportTreeLazyload, folder: true } );
						else
							_.extend( node, { folder: false } );
						nodes.push( node );
					}
				}
				callback( nodes );
			}
		} );
	}
	
	function init(divTreeParent,lazyload)
	{
		divTreeParent.innerHTML = "";
		var divContainer = _.div( {
			parent: divTreeParent,
			cssText: "width:1000px"
		} );
		var reportTree = Sue.ui.tree( {
			parent: divContainer,
			caption: "报表",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );
			}
		} );
		_.post( {
			url: bi_tree.servletURL,
			beforeStart: function( cfg ) {
				cfg.bar = bi.progressBar( doc );
				doc.body.style.cursor = "wait";
			},
			afterEnd: function( cfg ) {
				cfg.bar && cfg.bar.remove();
				delete cfg.bar;
				doc.body.style.cursor = "auto";
			},
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,			
				id: "-1",
				treeType: "report"
			},
			callback: function( r ) {
				if ( r != "empty" ) {
					var a = r.split( "|" ), aa;
					var nodes = [];
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );	
						var Node = reportTree.getNodeConstructor();
						nodes.push( Node( {
							caption: aa[0],
							value: { id: aa[1] ,url:aa[2]},
							lazyload: aa[3] == "false"?null:reportTreeLazyload,
							folder: aa[3] == "true",
							click: reportTreeClick,
							dblclick: function() {
								if ( this.folder ) {
									if ( !this.expanded ) {
										this.expand();
									} else {
										this.collapse();
									}
								} else {
									this.click( this );
								}
							}
						} ) );
					}
					reportTree.setRoot( nodes );
					// 触发初始化后的操作
					afterInitHook && afterInitHook();
				}
			}
		} );
		return reportTree;
	}
	function save()
	{
		var node = _this.tree.getSelectedNode();
		var parentPath = "";
		if(!node) {
			node = tree.root;
		}
		else if (node.folder)
			parentPath = node.value.url;
		else {
			if(node.value.url.lastIndexOf("/")!=-1)
				parentPath = node.value.url.match(/(.*)\/.*$/)[1];
			node = node.parent;
		}

		var nodeSelect = reportTree.getSelectedNode();
		var msgs = {
			type: "warning",
			caption: "您填写的内容不完整",
			messages: []
		};
		if(!nodeSelect || nodeSelect.folder) {
			msgs.messages.push( "未选择主题分析报表" );
		}
		
		var caption = name_input.value.replace(/(^\s*)|(\s*$)/g,"");
		// HTML转义
		caption = _.escapeHTML( caption );
		if(!caption) {
			msgs.messages.push( "未填写名称" );
		}
		if(caption.length>=80) {
			msgs.messages.push( "名称不允许超出80个字符" );
		}
		var useDataCenter = cbDataCenter.checked;
		var datacenter = "";
		if(useDataCenter)
		{
			datacenter = dataCenterList.value;
			if(!datacenter||datacenter=="")
			{
				msgs.messages.push("未选择数据中心");
			}
		}
		if ( msgs.messages.length > 0 ) {
			bi.getMessageTable( msgs, msgDiv );
			return;
		}
		var reportURL = nodeSelect.value.url;
		
		//检查同目录下是否有重名
		var overwriteFlag;
		if (!oldCaption && bi_tree_util.checkExistViewItem(robot,caption,false)) {
			bi.confirm( {
				document: doc,
				parentDialog: bi_tree.themeDialog,
				caption: "保存主题",
				text: "已存在同名主题，是否覆盖？",
				yes: function() {
					overwriteFlag = true;
					post();
				},
				no: _.Z
			} );
		} else {
			post();
		}
		function post() {
			_.post( {
				url: bi_tree.servletURL,
				beforeStart: _.Z,
				afterEnd: _.Z,
				json: {	
					servletType: bi_tree_util.ServletType_BIWebUtil,			
					action: "saveThemeReport",
					parentPath: parentPath,
					caption: caption,
					oldCaption: oldCaption,
					reportURL: reportURL,
					captionPath: _.map( nodeSelect.getAncestors( true ).reverse().slice( 1 ), "caption" ).join( "\3" ),
					datacenter:datacenter
				},
				onServerException: function( error ) {
					bi.getMessageTable( {
						type: "error",
						caption: "保存主题失败",
						messages: error.message
					}, msgDiv );
				},
				callback: function( ret ) {
					robot.setMessages( {
						type: "info",
						caption: "保存主题成功！"
					} );
					bi_tree.themeDialog.hide();
					robot.refresh( {
						selectedCaption: caption
					} );
				}
			} );
		}
	}
	// 该初始化函数只执行一次。这里将其重定义为一些操作
	bi_tree.themeDialogInitializer = {
		cleanCaption: function() {
			name_input.value = "";
			oldCaption = "";
			return this;
		},
		show: function() {
			bi_tree.themeDialog.show();
			return this;
		},
		setTitle: function(title) //窗口Title
		{
			bi_tree.themeDialog.setCaption(title);
			return this;
		},
		clearDataCenter:function()
		{
			cbDataCenter.checked = false;
			dataCenterList.disabled = true;
			return this;
		}
		,
		setDataCenter:function(datacenter)
		{
			if(!datacenter||datacenter=="")
			{
				cbDataCenter.checked = false;
				dataCenterList.disabled = true;
			}
			else
			{
				if(!cbDataCenter.inited)
				{
					initDataCenter(datacenter);
				}
				cbDataCenter.checked = true;
				dataCenterList.disabled = false;
				dataCenterList.value = datacenter;
				dataCenterList.title = datacenter;
				dataCenterList.text = datacenter;
			}
			return this;
		},
		setCaption: function( caption ) {
			name_input.value = _.unescapeHTML( caption );
			oldCaption = caption;
			return this;
		},
		//lzx,需考虑path不存在(被删除)的情况
		selectNode: function( path ) {
			if ( !path ) return this;
			// \x03是路径分隔符，由于主题meta标题可以设置为正斜杠，所以这里用不可见的字符\x03分隔，某些老主题已经保存为正斜杠分隔了，这里仍然兼容
			if ( path.indexOf("\3") != -1 ) {
				a = path.split("\3");
			} else {
				a = path.split( "/" );
			}
			var node = reportTree.root;
			var _this = this;
			( function f() {
				if(!node)
					return;
				
				var caption = a.shift();
				if ( !caption ) {
					_.extractEvent( node.div.lastChild, "mouseup" )( node );
					_this.gotoSelectedNodeAnchor();
					return;
				}
				if ( node&&node.lazyload ) {
					// 惰性加载的情况
					reportTree.vm.lazyload( node, function() {
						node = node.children[ _.indexOf( node.children, function( rt ) {
							return rt.caption == caption;
						} ) ];
						f();
					} )
				} else if (node&& node.children && node.children.length ) {
					// 非惰性加载的情况
					node = node.children[ _.indexOf( node.children, function( rt ) {
						return rt.caption == caption;
					} ) ];
					node&&node.parent.expand();
					f();
				} else {
					// 叶子节点
					f();
				}
			} )();
			return this;
		},
		clearSelectedNode: function() {
			reportTree.clearSelectedNode();
			return this;
		},
		collapseAll: function() {
			// 这儿采取BFS先折叠层次低的节点
			var nodes = reportTree.root.getAllChildren( "bfs" );
			_.map( nodes, function( node ) { node.collapse(); } );
			divTreeParent.scrollTop = 0;
			return this;
		},
		gotoSelectedNodeAnchor: function() {
			// 定位锚点
			var node = reportTree.getSelectedNode();
			if ( !node ) return this;
			var dy = _.xy( node.div, divTreeParent ).y;
			divTreeParent.scrollTop = dy;
			return this;
		}
	};
}
	
/*
 * 新建主题
 */	
bi_tree.prototype.newTheme = function( doc ) {
	typeof bi_tree.themeDialogInitializer == "function" && _.bind( bi_tree.themeDialogInitializer, this, doc )();
	var dialogUtil = bi_tree.themeDialogInitializer;
	dialogUtil.cleanCaption().clearSelectedNode().collapseAll().clearDataCenter().setTitle("新建").show();
};

/*
 * 编辑主题
 */
bi_tree.prototype.editTheme = function( doc, oldCaption, captionPath,datacenter ) {
	if ( typeof bi_tree.themeDialogInitializer == "function" ) {
		_.bind( bi_tree.themeDialogInitializer, this, doc, function() {
			disp();
		} )();
	} else {
		disp();
	}
	function disp() {
		bi_tree.themeDialogInitializer
		.setTitle("编辑")
		.selectNode( captionPath )
		.setCaption( oldCaption )
		.setDataCenter(datacenter)
		.show()
		;
	}
}


///////////////////////////////////////////////////////////////////////////////////////////////////
/*
 * 仪表板设计器的调用方法：
 * var dbDesign = new bi_dashboard_design(name,path,tree,view,xml);	//xml参数不传表示新建，否则为编辑
 * var sArg = "dialogWidth: 800; dialogHeight:600; help:no; scroll:no; status:no";
 * var bReturn = showModalDialog("biweb/dashboard/designer.jsp", dbDesign,sArg);
 * 
 * 设计器中调用保存：
 * dbDesign.xml = newXML;		//保存新的仪表板内容。
 * dbDesign.save();
 */
function bi_dashboard_design(dashboardName,repPath,tree,view,servletURL,xml)
{
	this.name = dashboardName;
	this.path = repPath;
	this.view = view;
	this.xml = xml;
	this.servletURL = servletURL;
	this.tree = tree;
}

bi_dashboard_design.prototype.save = function(xml, callback) {
	this.xml = xml;
	var tree = this.tree;
	var view = this.view;
	var _this = this;
	var node = tree.getSelectedNode();
	if(!node) {
		node = tree.root;
	}
	else if (!node.folder) {
		node = node.parent;
	}
	
	_.post( {
		url: bi_tree_util.BIWebUtilServlet,
		async: false,
		json: {
			servletType: bi_tree_util.ServletType_BIWebUtil,
			action: "saveDashboard",
			parentPath: this.path,
			caption: this.name,
			content: this.xml
		},
		callback: function( ret ) {
			var names= ret.split(",");
			view.refresh( {
				selectedCaption: names[0]
			} );
			callback();
		},
		onServerException: function( error ) {
			callback( error );
		}
	} );
}

/*
 *  资源上传对话框的使用方法：
 *  方法1：直接显示默认提供的div框。
 *  var upload = new ResourceDialog();
 *  upload.showUpload();					//上传资源
 *  upload.showSelect(callbackFunc);		//选择资源
 * 
 *  方法2：取出div内容，嵌入另一界面的子Div
 * 	var upload = new ResourceDialog();
 *  upload.getUploadDiv();					//上传
 *  upload.getSelectDiv();					//选择
 *  
 *  div.appendChild(upload.getUploadDiv());
 *  div.appendChild(upload.getSelectDiv(callback));
 *  
 *  //此回调在选择资源对话框的选定动作确定时发生，
 * 	//resPath：选定的资源全路径(不包括工作空间名)
 *  //可以在此回调中处理后续动作。
 *  function callbackFunc(resPath)
 *  {
 * 		
 *  }
 */
function ResourceDialog(servletURL){
	ResourceDialog.servletURL = servletURL;
};

ResourceDialog.prototype.showUpload = function() {
	this.show("upload");
}

ResourceDialog.prototype.showSelect = function(funcCallback) {
	this.show("select",funcCallback);
}

ResourceDialog.prototype.getSelected = function() {
	var ret = "";
	var node = ResourceDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var a = node.value.id.split("\1");
	ret = a[2];
	return ret;
}

ResourceDialog.prototype.getSelectedCaption = function() {
	var ret = "";
	var node = ResourceDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var caption="";
	while(node.parent!=null){
		caption=caption+"/"+node.caption;
		node=node.parent;
	}
	var b=caption.split("/");
	for(var i=b.length;i>0;i--){
		ret=ret+"/"+b[i-1];
	}
	return ret.substring(1,ret.length-1);
}

ResourceDialog.prototype.regDblClick = function(dblClick) {
	ResourceDialog.dblClick = dblClick;
}

ResourceDialog.prototype.getUploadDiv = function() {
		
	if (! ResourceDialog.panel ) {
		this.init(true,"upload");
	}
	return ResourceDialog.panel.root;
}

ResourceDialog.prototype.getSelectDiv = function(funcCallback) {
	if (! ResourceDialog.panel ) {
		this.init(true,"select",funcCallback);
	}
	return ResourceDialog.panel.root;
}

ResourceDialog.prototype.refreshUI = function(noUI,dialogType,funcCallback)
{
	if(dialogType=="upload") {
		ResourceDialog.divRepAction.style.display = "block";
		ResourceDialog.form.style.display = "block";
		ResourceDialog.btnField.style.display = "block";
	}
	else {
		ResourceDialog.divRepAction.style.display = "none";
		ResourceDialog.form.style.display = "none";
		ResourceDialog.btnField.style.display = "none";
	}
}

ResourceDialog.prototype.show = function(dialogType,funcCallback)
{
	if ( ResourceDialog.panel ) {
		ResourceDialog.panel.show();
		this.refreshUI(false,dialogType,funcCallback);
		return;
	}
	this.init(false,dialogType,funcCallback);
	ResourceDialog.panel.show();
	_.center( ResourceDialog.panel.root );
	
}

ResourceDialog.prototype.init = function(noUI,dialogType,funcCallback)
{
	if(!noUI) {
		dialog = Sue.ui.ext.dialog( {
			width: 383,
			caption: "上传图片"
		} );
		ResourceDialog.panel = dialog;
		ResourceDialog.panel.content.style.padding = "10px";
		// 解决选择片段后无法点击名称输入框的问题
		var rp = ResourceDialog.panel;
		rp.show = _.link( _.bind( rp.show, rp ), function() {
			try {
				resName.focus();
			} catch ( e ) {
				// focus命令通常不稳定，需要捕获这种错误
			}
		} );
	}else {
		ResourceDialog.panel = Sue.ui.panel( {
			parent: document.body,
			rootCSSText: "position:absolute;width:383px;border:solid 1px #718BB7;background-color:#FFF;padding:10px"
		} );
	}
	ResourceDialog.panel.content.innerHTML = _.loadUIT( "bi_dialog_upload_file");
	var msgDiv = bi_tree_util.f( ResourceDialog.panel,"msgDiv" );
	var resourceTree = bi_tree_util.f( ResourceDialog.panel,"repTree" );
	var savePath = bi_tree_util.f( ResourceDialog.panel,"savePath" );
	var savePathHidden = bi_tree_util.f( ResourceDialog.panel,"savePathHidden" );
	var resName = bi_tree_util.f( ResourceDialog.panel,"resName" );
	var resNameHidden = bi_tree_util.f( ResourceDialog.panel,"resNameHidden" );
	var overwrite = bi_tree_util.f( ResourceDialog.panel,"overwrite" );
	var overwriteHidden = bi_tree_util.f( ResourceDialog.panel,"overwriteHidden" );
		
	var uploadBtn = bi_tree_util.f(ResourceDialog.panel,'btnUpload');
	var uploadFilePath = bi_tree_util.f(ResourceDialog.panel,'uploadFilePath');
	ResourceDialog.form = bi_tree_util.f(ResourceDialog.panel,"form");
	ResourceDialog.btnField = bi_tree_util.f(ResourceDialog.panel,"btnField");
	ResourceDialog.form.action = ResourceDialog.servletURL;

	_.bindEvent( uploadBtn, "click", function() {
		if (uploadFilePath.value == "") {
			bi.getMessageTable( {
				type: "warning",
				caption: "请先选择要上传的图片"
			}, msgDiv );
			return ;
		}
		if ( !/\.(jpg|jpeg|gif|png|tif|tiff|bmp)$/i.test(uploadFilePath.value) )
		{
			bi.getMessageTable( {
				type: "warning",
				caption: "该图片格式不受支持 (仅限jpg/gif/png/tif/bmp)"
			}, msgDiv );
			return ;
		}
		if (resName.value == "") {
			bi.getMessageTable( {
				type: "warning",
				caption: "图片资源名称不能为空"
			}, msgDiv );
			return ;
		}
		if (resName.value.length>=80) {
			bi.getMessageTable( {
				type: "warning",
				caption: "图片资源名称不能超过80个字符"
			}, msgDiv );
			return;
		}
		var rn = resName.value;
		rn = _.escapeHTML( rn );
		resNameHidden.value = rn;
		overwriteHidden.value = overwrite.checked;

		var uploader = bi_tree_util.f( ResourceDialog.panel,'uploader' ); 
		_.unbindEvent( uploader ); 
		_.bindEvent( uploader, 'load', function() {
			var info = eval( '(' + uploader.contentWindow.document.body.innerHTML + ')' ); 
			
			if ( 'error' in info )
				bi.getMessageTable( {
					type: "error",
					caption: "上传失败",
					messages: info.error.message
				}, msgDiv );
			else {
				bi.getMessageTable( {
					type: "info",
					caption: "上传成功"
				}, msgDiv );
				
				var node = ResourceDialog.tree.getSelectedNode();
				if(!node)
				   node = ResourceDialog.tree.root.children[0];
				else if(!node.folder)
				   node = node.parent;
				var a = info.result.split(",");
				var findNode = findChildNodeByName(node,a[0]);
				if( !findNode ) {
					var Node = ResourceDialog.tree.getNodeConstructor();
					// 若父节点未lazyload，则lazyload重加载即可；若父节点已经lazyload，那么需要手动添加节点
					node.lazyload
					? node.vm.lazyload( node )
					: node.append(Node( {	
						caption: resNameHidden.value,
						value: { id: a[1] ,url:a[2]},
						lazyload: null,
						folder: false,
						click: click,
						dblclick: dblClick
					}));
				}
			}
		} ); 
		bi_tree_util.f( ResourceDialog.panel,"form" ).submit();
	});

	var newBtn = bi_tree_util.f(ResourceDialog.panel,"btnNewDir");
	var delBtn = bi_tree_util.f(ResourceDialog.panel,"btnDel");
	ResourceDialog.divRepAction = bi_tree_util.f(ResourceDialog.panel,"divRepAction");
	_.copyStyle( resourceTree, "backgroundColor,padding", [ "#FFF", "10px" ] );
	ResourceDialog.tree = Sue.ui.tree( {
		parent: resourceTree,
		caption: "",
		getIcon: function( node, f ) {
			return node.expanded && f( "folderopen" )
				|| node.folder && f( "folder" )
				|| f( "report" );
		}
	} );
	
	var rootNode = ResourceDialog.tree.getNodeConstructor()({
		caption: "图片资源",
		value:{id:-1,url:""},
		folder: true,
		click: click,
		dblclick: function() {
			if ( !this.expanded ) {
				this.expand();
			} else {
				this.collapse();
			}
		}
	});
	ResourceDialog.tree.setRoot(rootNode);
	_.post( {
		url: ResourceDialog.servletURL,
		json: {
			servletType: bi_tree_util.ServletType_BIWebUtil,
			id: "-1",
			treeType: "resource"
		},
		callback: function( ret ) {
			if ( ret != "empty" ) {
				var a = ret.split( "|" ), aa;
				var nodes = [];
				for( var i = 0, len = a.length; i < len; i++ ) {
					aa = a[i].split( "," );	
					var Node = ResourceDialog.tree.getNodeConstructor();
					nodes.push( Node( {
						caption: aa[0],
						value: { id: aa[1] ,url:aa[2]},
						lazyload: aa[3] == "false"?null:lazyload,
						folder: aa[3] == "true",
						click: click,
						dblclick: function() {
							if ( this.folder ) {
								if ( !this.expanded ) {
									this.expand();
								} else {
									this.collapse();
								}
							} else {
								dblClick( this );
							}
						}
					} ) );
				}
				rootNode.append( nodes );
			}
		}
	} );

	this.refreshUI(noUI,dialogType,funcCallback);

	//存储树新建目录的功能	
	_.bindEvent( newBtn, "click", function() {
		var node = ResourceDialog.tree.getSelectedNode();
		var parentPath = "";
		if ( !node ) {
			node = ResourceDialog.tree.root.children[0];
		} else if ( node.folder ) {
			parentPath = node.value.url;
		} else {
			var url = node.value.url;
			if( url.lastIndexOf( "/" ) != -1 ) {
				parentPath = url.substring( 0, url.lastIndexOf( "/" ) );
			}
			node = node.parent;
		}
		bi.input( {
			caption: "新建目录",
			text: "请输入新建目录名称：",
			parentDialog: ResourceDialog.panel,
			verify: function(dirName) {
				var str = dirName.replace(/(^\s*)|(\s*$)/g,"");
				if(str=="") {
					return {
						type: "warning",
						caption: "请输入新建目录名称"
					};
				}
				if(str.length>=80){
					return {
						type: "warning",
						caption: "目录名不能超过80个字符"
					};
				}
				return true;
			},
			ok: function( dirName ) {
				_.post( {
					url: ResourceDialog.servletURL,
					json: {
						servletType: bi_tree_util.ServletType_BIWebUtil,
						treeType: "resource",
						action: "repNewDir",
						path: parentPath,
						caption: dirName
					},
					callback: function( ret ) {
						bi.getMessageTable( {
							type: "info",
							caption: "新建目录成功"
						}, msgDiv );
						var a = ret.split(",");
						var Node = ResourceDialog.tree.getNodeConstructor();
						// 若父节点未lazyload，则lazyload重加载即可；若父节点已经lazyload，那么需要手动添加节点
						node.lazyload
						? node.vm.lazyload( node )
						: node.append( Node( {
							caption: a[0],
							value: { id: a[1] ,url: a[2] },
							lazyload: a[3] == "false" ? null : lazyload,
							folder: a[3],
							click: click,
							dblclick: dblClick
						} ) );
					}
				} );
			}
		} );
	} );
	//删除存储树结点的功能	
	_.bindEvent( delBtn, "click", function() {
		var node = ResourceDialog.tree.getSelectedNode();
		if ( !node ) {
			bi.getMessageTable( {
				type: "warning",
				caption: "请选择要删除的节点"
			}, msgDiv );
			return;
		};
		if (node.value.url == "") {
			bi.getMessageTable( {
				type: "warning",
				caption: "根目录不能删除"
			}, msgDiv );
			return;
		}
		bi.confirm( {
			caption: "删除确认",
			text: "您确认要删除" + ( node.folder ? "目录" : "结点“" ) + node.caption + "”吗？",
			parentDialog: ResourceDialog.panel,
			yes: function() {
				var url = node.value.url;
				_.post( {
					url: ResourceDialog.servletURL,
					json: {
						servletType: bi_tree_util.ServletType_BIWebUtil,
						treeType: "resource",
						action: "repDel",
						path: url
					},
					callback: function( ret ) {
						bi.getMessageTable( {
							type: "info",
							caption: "删除成功"
						}, msgDiv );
						node.parent.remove( node );
						savePath.value = "";
						savePathHidden.value = "";
						resName.value = "";
					}
				} );
			},
			no: _.Z
		} );
	} );
	if ( !noUI ) {
		bi.updateToPortalStyleButton( dialog.root );
		bi.updateToPortalStyleTextField( dialog.root, {
			width: "173px",
			backgroundColor: Sue.config.cs[14]
		} );
	}

	/**
	 * 按照名称查询子节点
	 * selectednode: 当前选中的节点
	 * name：名称
	 * return:  查找到的结点
	 */
	function findChildNodeByName( selectednode, name )
	{
		var node = selectednode;
		if(!node)
			//如果什么都没选中，则取根结点
			node = ResourceDialog.tree.root.children[0];
		else if(!node.folder)
			//如果当前选中不是目录，则取它的父结点
			node = node.parent;
		
		//如果没有子结点，则返回空，表示未找到指定名称的结点
		if ( !node || node.children == null ) return null;
		
		for(var i=0;i<node.children.length;i++) {
			if (name == node.children[i].caption) {
				return node.children[i];
			}
		}
		
		return null;
	}

	function click() {
		var url = this.value.url;
		if ( this.folder ) {
			resName.value = "";
			resNameHidden.value = "";
			savePath.value = _.map( this.getAncestors( true ).reverse().slice( 2 ), "caption" ).join( "/" );
			savePathHidden.value = url;
		} else if ( url.indexOf( "/" ) == -1 ) {
			resName.value = _.unescapeHTML( this.caption );
			resNameHidden.value = this.caption;
			savePath.value = "";
			savePathHidden.value = "";
		} else {
			savePath.value = _.map( this.getAncestors().reverse().slice( 2 ), "caption" ).join( "/" );
			resName.value = _.unescapeHTML( this.caption );
			resNameHidden.value = this.caption;
			savePathHidden.value = url.substring( 0, url.lastIndexOf( "/" ) );
		}
	}
	
	function dblClick() {
		ResourceDialog.dblClick && ResourceDialog.dblClick();
	}
	
	function lazyload( node, callback ) {
		_.post( {
			url: ResourceDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: node.value.id,
				treeType: "resource"
			},
			callback: function( r ) {
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), aa, node;
					var Node = ResourceDialog.tree.getNodeConstructor();
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: click,
							dblclick: dblClick,
							folder: aa[3] != "false",
							lazyload: aa[3] != "false" ? lazyload : null
						} ) ;
						nodes.push( node );
					}
				} 
				callback( nodes );
			}
		});
	}
}



/*
 *  片段对话框的使用方法：
 *  方法1：直接使用默认Div显示
 *  var pd = new PieceDialog(uiids,uiTypes);
 *  pd.showSave();					//打开片段保存对话框
 *  pd.showSelect(callbackFunc);	//打开片段选择对话框
 *  function callbackFunc(resPath)	//resPath: 选定的片段路径
 *  {
 * 		
 *  }
 * 
 *  方法2：取出div内容，嵌入另一界面的子Div
 * 	var pd = new PieceDialog();
 *  pd.getSaveDiv();				//保存
 *  pd.getSelectDiv();				//选择	去掉确定按纽 通过pd.getSelected()取当前选择值
 *  调用方的使用方式：
 *  div.appendChild(pd.getSaveDiv());
 *  div.appendChild(pd.getSelectDiv());
 *  alert(pd.getSelected);
 * 
 */
function PieceDialog(servletURL,uiids,uiTypes,bi_post)
{
	PieceDialog.servletURL = servletURL;
	this.uiids = uiids;
	this.uiTypes = uiTypes;
	this.bi_post = bi_post;
	delete PieceDialog.dblClick;
}

PieceDialog.prototype.regDblClick = function(dblClick) {
	PieceDialog.dblClick = dblClick;
}

PieceDialog.prototype.showSave = function() {
	this.show("save");
}

PieceDialog.prototype.showSelect = function(funcCallback) {
	this.show("select",funcCallback);
}

PieceDialog.prototype.getSaveDiv = function() {
	var firstTime = !PieceDialog.panel;
	if ( firstTime ) {
		this.init(true);
	}
	this.refreshUI(true,"save");
	return PieceDialog.panel.root;
}

PieceDialog.prototype.remove = function() {
	if(PieceDialog.panel) {
		_.gc(PieceDialog.panel.root);
		PieceDialog.panel = null;
	}	
}

PieceDialog.prototype.getSelectDiv = function() {
	var firstTime = !PieceDialog.panel;
	if ( firstTime ) {
		this.init(true);
	}
	this.refreshUI(true,"select");
	return PieceDialog.panel.root;
}

PieceDialog.prototype.show = function(dialogType,funcCallback) {
	var firstTime = !PieceDialog.panel;
	if ( firstTime ) {
		this.init(false);
	}
	this.refreshUI(false,dialogType,funcCallback);
	PieceDialog.panel.show();
	_.center( PieceDialog.panel.root );
	PieceDialog.panel.content.firstChild.style.padding = "10px";
	
}

PieceDialog.prototype.getSelected = function() {
	var ret = "";
	var node = PieceDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var a = node.value.id.split("\1");
	var ret = a[2];
	return ret;
}
PieceDialog.prototype.getSelectedCaption = function() {

	var ret = "";
	var node = PieceDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var caption="";
	while(node.parent!=null){
		caption=caption+"/"+node.caption;
		node=node.parent;
	}
	var b=caption.split("/");
	for(var i=b.length-1;i>0;i--){
		ret=ret+"/"+b[i-1];
	}
	return ret.substring(0,ret.length-1);
}
PieceDialog.prototype.refreshUI = function(noUI,dialogType,funcCallback) {
	if (dialogType=="save") {
		PieceDialog.panel.rebindButtonEvent( "保存", pieceSave );
		if(this.uiids.length == 1) {
			PieceDialog.componentType_input.disabled = true;
			PieceDialog.componentType_input2.disabled = true;
			if (this.uiTypes[0]=="worksheet") {
				PieceDialog.componentType_input.checked = true;
			}else if(this.uiTypes[0]=="chart") {
				PieceDialog.componentType_input2.checked = true;
			}
		}
		else if(this.uiids.length > 1)	{
			PieceDialog.componentType_input.disabled = false;
			PieceDialog.componentType_input2.disabled = false;
		}
		PieceDialog.componentType_div.style.display = "block";
		PieceDialog.pieceType_div.style.display = "block";
		PieceDialog.divRepAction.style.display = "block";
		PieceDialog.divPieceDir.style.display = "block";
		PieceDialog.divPieceName.style.display = "block";
	}else if(dialogType=="select") {
		PieceDialog.componentType_div.style.display = "none";
		PieceDialog.pieceType_div.style.display = "none";		
		PieceDialog.divRepAction.style.display = "none";
		PieceDialog.divPieceDir.style.display = "none";
		PieceDialog.divPieceName.style.display = "none";
	}
	
	var _this = this;
	function pieceSave() {
		var pieceCaption = PieceDialog.piecename_input.value;
		var pieceParentPath = PieceDialog.piecedir_input_hidden.value;
		if( !pieceCaption ) {
			bi.getMessageTable( {
				type: "warning",
				caption: "片段名不能为空"
			}, PieceDialog.msgDiv );
			return ;
		}
		if(pieceCaption.length>=80) {
			bi.getMessageTable( {
				type: "warning",
				caption: "片段名不能超过80个字符"
			}, PieceDialog.msgDiv );
			return ;
		}
		pieceCaption = _.escapeHTML( pieceCaption );
		var node = PieceDialog.tree.getSelectedNode();
		if(!node)
			node = PieceDialog.tree.root.children[0];
		else if(!node.folder)
			node = node.parent;
		
		var uiid;
		if(_this.uiids.length == 1) {
			uiid = _this.uiids[0];
		}else {
			//注意：checkbox的0表示表，1表示图
			var index = (PieceDialog.componentType_input.checked ? 0 : 1);
			if (_this.uiTypes[1]=="worksheet") 
				//图在上，表在下，需要倒置
				index = (index == 0 ? 1 : 0);
			uiid = _this.uiids[index];
		}
		_this.bi_post( {
			json: {
				uiid: uiid,
				type: "action",
				actionName: "savePiece",
				isDynamic: PieceDialog.piecetype_input.checked,
				pieceCaption: pieceCaption,		
				pieceParentPath: pieceParentPath
			},
			onServerException: function( error ) {
				bi.getMessageTable( {
					type: "warning",
					caption: "保存失败",
					messages: error.message
				}, PieceDialog.msgDiv );
			},
			callback: function( ret ) {
			   
				bi.getMessageTable( {
					type: "info",
					caption: "保存成功"
				}, PieceDialog.msgDiv );
				var a = ret.substr(4).split(",");
				var bExist = false;
				if(node.children!=null) {
					for(var i=0;i<node.children.length;i++) {
						if (a[0]==node.children[i].caption) {
							if(node.children[i].isDynamic != PieceDialog.piecetype_input.checked) {
								//状态变化，需要刷新图标
								node.children[i].getIcon = (PieceDialog.piecetype_input.checked ? "dynamic.png":"snapshot.png");
								node.children[i].vm.refreshIcon(node.children[i]);
								node.children[i].isDynamic = PieceDialog.piecetype_input.checked;
							}
							bExist = true;
							break;
						}
					}
				}
				if(!bExist && !node.lazyload ) {
					var Node = PieceDialog.tree.getNodeConstructor();
					// 若父节点未lazyload，则lazyload重加载即可；若父节点已经lazyload，那么需要手动添加节点
					node.lazyload
					? node.vm.lazyload( node )
					: node.append(Node( {	
						caption: a[0],
						value: { id: a[1] ,url:a[2]},
						lazyload: null,
						folder: false,
						click: PieceDialog.pieceTreeClick,
						dblclick: PieceDialog.pieceTreeDblClick,
						getIcon: PieceDialog.piecetype_input.checked ? "dynamic.png":"snapshot.png",
						isDynamic: PieceDialog.piecetype_input.checked
					}));
				}
				//保存成功后关闭保存对话框
			   PieceDialog.panel.destroy();
			}
		} );
	}
}
PieceDialog.pieceTreeDblClick = function()
{
	PieceDialog.dblClick && PieceDialog.dblClick();	
}

PieceDialog.pieceTreeClick = function()
{
	var pieceName = "";
	var pieceDir = "";
	if( this.folder ) {
		pieceDir = _.map( this.getAncestors( true ).reverse().slice( 2 ), "caption" ).join( "/" );
	} else {
		pieceDir = _.map( this.getAncestors().reverse().slice( 2 ), "caption" ).join( "/" );
		pieceName = this.caption;
	}
	this.vm.inputPiecename.value = pieceName;
	this.vm.inputPiecedir.value = pieceDir;
	this.vm.inputPiecedirHidden.value = this.folder
		? this.value.url
		: this.value.url.indexOf( "/" ) == -1
			? ""
			: this.value.url.match(/(.*)\/.*$/)[1];
};

PieceDialog.prototype.init = function(noUI) {
	if(!noUI) {
		// 应人机的要求，此处的容器改为正规的模态对话框
		var dialog = Sue.ui.ext.dialog( {
			width: 373,
			height: 390,
			caption: "导出分析片段",
			coveredDocuments: bi.getAllFramesDocuments(),
			closeAction: "close",
			destroyHook: function() {
				PieceDialog.panel = null;
			}
		} );
		PieceDialog.panel = dialog;
	} else {
		PieceDialog.panel = Sue.ui.panel( {
			parent: document.body,
			rootCSSText: "position:absolute;border:solid 1px #718BB7;background-color:#FFF;width:373px"
		} );
	}
	PieceDialog.panel.content.innerHTML = _.loadUIT( "bi_dialog_piece" );
	PieceDialog.msgDiv = bi_tree_util.f(PieceDialog.panel,"msgDiv");
	PieceDialog.div_pieceTree = bi_tree_util.f(PieceDialog.panel,"pieceTree");
	PieceDialog.piecetype_input = bi_tree_util.f(PieceDialog.panel,"pieceType1");
	PieceDialog.piecetype_input2 = bi_tree_util.f(PieceDialog.panel,"pieceType2");
	PieceDialog.piecedir_input = bi_tree_util.f(PieceDialog.panel,"pieceDir");
	PieceDialog.piecedir_input_hidden = bi_tree_util.f(PieceDialog.panel,"pieceDirHidden");
	PieceDialog.repNew_button = bi_tree_util.f(PieceDialog.panel,"btnNewDir");
	PieceDialog.repDel_button = bi_tree_util.f(PieceDialog.panel,"btnDel");
	PieceDialog.componentType_div = bi_tree_util.f(PieceDialog.panel,"componentType");
	PieceDialog.pieceType_div = bi_tree_util.f(PieceDialog.panel,"pieceType");
	
	PieceDialog.piecename_input = bi_tree_util.f(PieceDialog.panel,"pieceName");
	PieceDialog.componentType_input = bi_tree_util.f(PieceDialog.panel,"componentType1");
	PieceDialog.componentType_input2 = bi_tree_util.f(PieceDialog.panel,"componentType2");
	PieceDialog.divRepAction = bi_tree_util.f(PieceDialog.panel,"divRepAction");
	PieceDialog.divPieceDir = bi_tree_util.f(PieceDialog.panel,"divPieceDir");
	PieceDialog.divPieceName = bi_tree_util.f(PieceDialog.panel,"divPieceName");
	
	PieceDialog.tree = _.bind( pieceTreeInit, this )();
	_.bindEvent( PieceDialog.repNew_button, "click", function(){
		pieceRepositoryNewDir(PieceDialog);
	});
	_.bindEvent( PieceDialog.repDel_button, "click", function(){
		pieceRepositoryDel(PieceDialog.tree);
	});
	if(!noUI) {
		bi.updateToPortalStyleButton( dialog.root );
		bi.updateToPortalStyleTextField( dialog.root, {
			width: "173px",
			backgroundColor: Sue.config.cs[14]
		} );
	}

	var _this = this;
	
	function pieceTreeInit() 
	{
		PieceDialog.div_pieceTree.innerHTML = "";
		_.copyStyle( PieceDialog.div_pieceTree, "backgroundColor,padding", [ "#FFF", "10px" ] );
		var tree = Sue.ui.tree( {
			parent: PieceDialog.div_pieceTree,
			caption: "",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );
			}
		} );
		tree.vm.inputPiecename = PieceDialog.piecename_input;
		tree.vm.inputPiecedir = PieceDialog.piecedir_input;
		tree.vm.inputPiecedirHidden = PieceDialog.piecedir_input_hidden;
		tree.vm.inputPiecetype = PieceDialog.piecetype_input;
		tree.vm.Node = tree.getNodeConstructor();
		var rootNode = tree.vm.Node({
			caption: "片段",
			value: {id:-1,url:""},
			click: PieceDialog.pieceTreeClick,
			folder: true,
			dblclick: function() {
				if ( !this.expanded ) {
					this.expand();
				} else {
					this.collapse();
				}
			}
		});
		tree.setRoot(rootNode);
		_.post( {
			url: PieceDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: "-1",
				treeType: "piece" },
			callback: function( r ) {
				if ( r != "empty" ) {
					var a = r.split( "|" ), aa;
					var nodes = [];
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );	
						var Node = tree.getNodeConstructor();
						nodes.push( Node( {
							caption: aa[0],
							value: { id: aa[1] ,url:aa[2]},
							lazyload: aa[3] == "false"?null:pieceTreeLazyload,
							folder: aa[3] == "true",
							click: PieceDialog.pieceTreeClick,
							dblclick: function() {
								if ( this.folder ) {
									if ( !this.expanded ) {
										this.expand();
									} else {
										this.collapse();
									}
								} else {
									PieceDialog.pieceTreeDblClick( this );
								}
							},
							isDynamic: aa[4] == "dynamic" ? true:false,
							getIcon: 
								(aa[3] == "true" && "folder")
								|| (aa[4] == "dynamic" && "dynamic.png")
								|| (aa[4] == "snapshot" && "snapshot.png")
						} ) );
					}
					rootNode.append(nodes);
				}
			}
		} );
		PieceDialog.piecename_input.value = "";
		PieceDialog.piecedir_input.value = "";
		return tree;
	}

	function pieceTreeLazyload(_this, callback ) 
	{
		_.post( {
			url: PieceDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: _this.value.id ,
				treeType: "piece"},
			callback: function( r ) {
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), node, aa;
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = _this.vm.Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: PieceDialog.pieceTreeClick,
							dblclick: PieceDialog.pieceTreeDblClick,
							isDynamic: aa[4] == "dynamic" ? true:false,
							getIcon: 
								(aa[4] == "dynamic" && "dynamic.png")
								|| (aa[4] == "snapshot" && "snapshot.png")
								|| (aa[3] == "true" && "folder")
						} );
						if(aa[3]!="false")
							_.extend( node, { lazyload: pieceTreeLazyload, folder: true } );
						else
							_.extend( node, { folder: false } );
						nodes.push( node );
					}
				}
				callback( nodes );
			}
		} );
	};

	function pieceRepositoryNewDir(pieceDialog)
	{
		var tree = pieceDialog.tree;
		var node = tree.getSelectedNode();
		var parentPath = "";
		if(!node) {
			node = tree.root.children[0];
		}
		else if (node.folder)
			parentPath = node.value.url;
		else {
			if(node.value.url.lastIndexOf("/")!=-1)
				parentPath = node.value.url.match(/(.*)\/.*$/)[1];
			node = node.parent;
		}
		
		bi.input( {
			caption: "新建目录",
			text: "请输入新建目录名称：",
			verify: function(dirName) {
				var str = dirName.replace(/(^\s*)|(\s*$)/g,"");
				if(str=="") {
					bi.getMessageTable( {
						type: "warning",
						caption: "请输入新建目录名称"
					}, PieceDialog.msgDiv );
					return false;
				}
				if(str.length>=80){
					bi.getMessageTable( {
						type: "warning",
						caption: "目录名不允许超过80个字符"
					}, PieceDialog.msgDiv );
					return false;
				}
				return true;
			},
			ok: function( dirName ) {
				var str = dirName.replace(/(^\s*)|(\s*$)/g,"");
				newRepositoyDir(parentPath,str,"piece",
					tree,node,pieceTreeLazyload);
			},
			parentDialog: pieceDialog.panel
		} );
	}
	
	function newRepositoyDir(parentPath,dirName,treeType,tree,node,lazyload) 
	{
		_.post( {
			url: PieceDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				action: "repNewDir",
				path: parentPath,
				caption: dirName,
				treeType: treeType
			},
			callback: function( ret ) {
				bi.getMessageTable( {
					type: "info",
					caption: "新建目录成功"
				}, PieceDialog.msgDiv );
				var a = ret.split(",");
				var Node = tree.getNodeConstructor();
				// 若父节点未lazyload，则lazyload重加载即可；若父节点已经lazyload，那么需要手动添加节点
				node.lazyload
				? node.vm.lazyload( node )
				: node.append( Node( {
					caption: a[0],
					value: { id: a[1] ,url:a[2]},
					lazyload: a[3] == "false"?null:lazyload,
					folder: a[3],
					click: PieceDialog.pieceTreeClick,
					dblclick: PieceDialog.pieceTreeDblClick						
				} ) );
			}
		} );
	}
	
	function pieceRepositoryDel(tree)
	{
		var node = tree.getSelectedNode();
		if (node==null)	return;
		if (node.value.url == "" ) {
			bi.getMessageTable( {
				type: "warning",
				caption: "根目录不能被删除"
			}, PieceDialog.msgDiv );
			return;
		}
		var typeCaption = node.folder?"目录":"结点";
		bi.confirm( {
			caption: "删除" + typeCaption,
			text: "您确认要删除" + typeCaption + node.caption + "吗？",
			parentDialog: PieceDialog.panel,
			yes: function() {
				var nodePath = node.value.url;
				_.post( {
					url: PieceDialog.servletURL,
					json: {
						servletType: bi_tree_util.ServletType_BIWebUtil,
						action: "repDel",
						treeType: "piece",
						path: nodePath
					},
					callback: function( ret ) {
						bi.getMessageTable( {
							type: "info",
							caption: "删除成功"
						}, PieceDialog.msgDiv );
						node.parent.remove(node);
						tree.vm.inputPiecename.value = "";
						tree.vm.inputPiecedir.value = "";
					}
				} );
			},
			no: _.Z
		} );
	}
	
}

/*
 *  仪表板资源树的使用方法：
 *  方法1：取出div内容，嵌入另一界面的子Div
 * 	var pd = new DashboardTreeDialog();
 *  pd.getSelectDiv();				//选择	去掉确定按纽 通过pd.getSelected()取当前选择值
 *  调用方的使用方式：
 *  div.appendChild(pd.getSelectDiv());
 *  alert(pd.getSelected);
 * 
 */
function DashboardTreeDialog(servletURL)
{
	DashboardTreeDialog.servletURL = servletURL;
}

DashboardTreeDialog.prototype.remove = function() {
	if(DashboardTreeDialog.panel) {
		_.gc(DashboardTreeDialog.panel.root);
		DashboardTreeDialog.panel = null;
	}	
}

DashboardTreeDialog.prototype.getSelectDiv = function() {
	var firstTime = !DashboardTreeDialog.panel;
	if ( firstTime ) {
		this.init();
	}
	return DashboardTreeDialog.panel.root;
}

DashboardTreeDialog.prototype.getSelected = function() {
	var ret = "";
	var node = DashboardTreeDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var a = node.value.id.split("\1");
	var ret = a[0];
	return ret;
}

DashboardTreeDialog.dashboardTreeClick = function()
{
	if( this.folder ) {
		this.getAncestors( true ).reverse()
	} else {
		this.getAncestors().reverse();
	}
};

DashboardTreeDialog.prototype.init = function() {
	DashboardTreeDialog.panel = Sue.ui.panel( {
		parent: document.body,
		rootCSSText: "position:absolute;border:solid 1px #718BB7;background-color:#FFF;width:373px"
	} );
	
	DashboardTreeDialog.panel.content.innerHTML = _.loadUIT( "bi_dialog_dashboard_tree" );
	DashboardTreeDialog.div_dashboardTree = bi_tree_util.f(DashboardTreeDialog.panel,"dashboardTree");
	
	DashboardTreeDialog.tree = _.bind( dashboardTreeInit, this )();
	var _this = this;
	function dashboardTreeInit() 
	{
		DashboardTreeDialog.div_dashboardTree.innerHTML = "";
		_.copyStyle( DashboardTreeDialog.div_dashboardTree, "backgroundColor,padding", [ "#FFF", "10px" ] );
		var tree = Sue.ui.tree( {
			parent: DashboardTreeDialog.div_dashboardTree,
			caption: "",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );;
			}
		} );
		tree.vm.Node = tree.getNodeConstructor();
		var rootNode = tree.vm.Node({
			caption: "仪表板",
			value: {id:-1,url:""},
			folder: true
		});
		tree.setRoot(rootNode);
		_.post( {
			url: DashboardTreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: "-1",
				treeType: "dashboard" },
			callback: function( r ) {
				if ( r != "empty" ) {
					var a = r.split( "|" ), aa;
					var nodes = [];
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );	
						var Node = tree.getNodeConstructor();
						nodes.push( Node( {
							caption: aa[0],
							value: { id: aa[1] ,url:aa[2]},
							lazyload: aa[3] == "false"?null:dashboardTreeLazyload,
							click: DashboardTreeDialog.dashboardTreeClick,
							folder: aa[3] == "true",
							dblclick: DashboardTreeDialog.dashboardTreeDblClick,
							getIcon: 
								aa[3] == "true" && "folder"
						} ) );
					}
					rootNode.append(nodes);
				}
			}
		} );
		return tree;
	}

	function dashboardTreeLazyload(_this, callback ) 
	{
		_.post( {
			url: DashboardTreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: _this.value.id ,
				treeType: "dashboard"},
			callback: function( r ) {
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), node, aa;
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = _this.vm.Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: DashboardTreeDialog.dashboardTreeClick,
							dblclick: DashboardTreeDialog.dashboardTreeDblClick,
							getIcon: 
								(aa[3] == "true" && "folder")
						} );
						if(aa[3]!="false")
							_.extend( node, { lazyload: dashboardTreeLazyload, folder: true } );
						else
							_.extend( node, { folder: false } );
						nodes.push( node );
					}
				}
				callback( nodes );
			}
		} );
	};
}

/*
 *  主题报表资源树的使用方法：
 *  方法1：取出div内容，嵌入另一界面的子Div
 * 	var pd = new ReportTreeDialog();
 *  pd.getSelectDiv();				//选择	去掉确定按纽 通过pd.getSelected()取当前选择值
 *  调用方的使用方式：
 *  div.appendChild(pd.getSelectDiv());
 *  alert(pd.getSelected);
 * 
 */
function ReportTreeDialog(servletURL)
{
	ReportTreeDialog.servletURL = servletURL;
}

ReportTreeDialog.prototype.remove = function() {
	if(ReportTreeDialog.panel) {
		_.gc(ReportTreeDialog.panel.root);
		ReportTreeDialog.panel = null;
	}	
}

ReportTreeDialog.prototype.getSelectDiv = function() {
	var firstTime = !ReportTreeDialog.panel;
	if ( firstTime ) {
		this.init();
	}
	return ReportTreeDialog.panel.root;
}

ReportTreeDialog.prototype.getSelected = function() {
	var ret = "";
	var node = ReportTreeDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var a = node.value.id.split("\1");
	var ret = a[0];
	return ret;
}

ReportTreeDialog.prototype.getSelectedReportType = function() {
	var ret = "";
	var node = ReportTreeDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	return node.type;
}

ReportTreeDialog.reportTreeClick = function()
{
	if( this.folder ) {
		this.getAncestors( true ).reverse()
	} else {
		this.getAncestors().reverse();
	}
};

ReportTreeDialog.prototype.init = function() {
	ReportTreeDialog.panel = Sue.ui.panel( {
		parent: document.body,
		rootCSSText: "position:absolute;border:solid 1px #718BB7;background-color:#FFF;width:373px"
	} );
	
	ReportTreeDialog.panel.content.innerHTML = _.loadUIT( "bi_dialog_report_tree" );
	ReportTreeDialog.div_reportTree = bi_tree_util.f(ReportTreeDialog.panel,"reportTree");
	
	ReportTreeDialog.tree = _.bind( reportTreeInit, this )();
	var _this = this;
	function reportTreeInit() 
	{
		ReportTreeDialog.div_reportTree.innerHTML = "";
		_.copyStyle( ReportTreeDialog.div_reportTree, "backgroundColor,padding", [ "#FFF", "10px" ] );
		var tree = Sue.ui.tree( {
			parent: ReportTreeDialog.div_reportTree,
			caption: "",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );;
			}
		} );
		tree.vm.Node = tree.getNodeConstructor();
		var rootNode = tree.vm.Node({
			caption: "报表",
			value: {id:-1,url:""},
			folder: true
		});
		tree.setRoot(rootNode);
		_.post( {
			url: ReportTreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: "-1",
				treeType: "configReport" },
			callback: function( r ) {
				if ( r != "empty" ) {
					var a = r.split( "|" ), aa;
					var nodes = [];
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );	
						var Node = tree.getNodeConstructor();
						nodes.push( Node( {
							caption: aa[0],
							value: { id: aa[1] ,url:aa[2]},
							lazyload: aa[3] == "false"?null:reportTreeLazyload,
							click: ReportTreeDialog.reportTreeClick,
							folder: aa[3] == "true",
							type: aa[4],
							getIcon: 
								(aa[3] == "true" && "folder")
								|| (aa[4] == "ext" && "extReport.gif")
								|| (aa[4] == "olap" && "report.gif")
								|| (aa[4] == "dupont" && "dupontReport.gif")
								
						} ) );
					}
					rootNode.append(nodes);
				}
			}
		} );
		return tree;
	}

	function reportTreeLazyload(_this, callback ) 
	{
		_.post( {
			url: ReportTreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: _this.value.id ,
				treeType: "configReport"},
			callback: function( r ) {
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), node, aa;
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = _this.vm.Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: ReportTreeDialog.reportTreeClick,
							type: aa[4],
							getIcon: 
								(aa[3] == "true" && "folder")
								|| (aa[4] == "ext" && "extReport.gif")
								|| (aa[4] == "olap" && "report.gif")
								|| (aa[4] == "dupont" && "dupontReport.gif")								
								
						} );
						if(aa[3]!="false")
							_.extend( node, { lazyload: reportTreeLazyload, folder: true } );
						else
							_.extend( node, { folder: false } );
						nodes.push( node );
					}
				}
				callback( nodes );
			}
		} );
	};
}


/*
 *  EAS KPI资源树的使用方法：
 *  方法1：取出div内容，嵌入另一界面的子Div
 * 	var pd = new KPITreeDialog(url);
 *  pd.getSelectDiv();				//选择	去掉确定按纽 通过pd.getSelected()取当前选择值
 *  调用方的使用方式：
 *  div.appendChild(pd.getSelectDiv());
 *  alert(pd.getSelected);
 * 
 */
function KPITreeDialog(servletURL)
{
	KPITreeDialog.servletURL = servletURL;
}

KPITreeDialog.prototype.remove = function() {
	if(KPITreeDialog.panel) {
		_.gc(KPITreeDialog.panel.root);
		KPITreeDialog.panel = null;
	}	
}

KPITreeDialog.prototype.getSelectDiv = function() {
	var firstTime = !KPITreeDialog.panel;
	if ( firstTime ) {
		this.init();
	}
	return KPITreeDialog.panel.root;
}

KPITreeDialog.prototype.getSelected = function() {
	var ret = "";
	var node = KPITreeDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	var a = node.value.id.split("\1");
	var ret = a[0];
	return ret;
}

KPITreeDialog.prototype.getSelectedCaption = function() {
	var ret = "";
	var node = KPITreeDialog.tree.getSelectedNode();
	if(!node || node.folder) {
		return ret;
	}
	//TODO： 最好能显示出对应的BSC,CSF
	return node.caption;
}

KPITreeDialog.KPITreeClick = function()
{
	if( this.folder ) {
		this.getAncestors( true ).reverse()
	} else {
		this.getAncestors().reverse();
	}
};

KPITreeDialog.prototype.init = function() {
	KPITreeDialog.panel = Sue.ui.panel( {
		parent: document.body,
		rootCSSText: "position:absolute;border:solid 1px #718BB7;background-color:#FFF;width:373px"
	} );
	
	KPITreeDialog.panel.content.innerHTML = _.loadUIT( "bi_dialog_kpi_tree" );
	KPITreeDialog.div_kpiTree = bi_tree_util.f(KPITreeDialog.panel,"kpiTree");
	
	KPITreeDialog.tree = _.bind( kpiTreeInit, this )();
	var _this = this;
	function kpiTreeInit() 
	{
		KPITreeDialog.div_kpiTree.innerHTML = "";
		_.copyStyle( KPITreeDialog.div_kpiTree, "backgroundColor,padding", [ "#FFF", "10px" ] );
		var tree = Sue.ui.tree( {
			parent: KPITreeDialog.div_kpiTree,
			caption: "",
			getIcon: function( node, f ) {
				return node.expanded && f( "folderopen" )
					|| node.folder && f( "folder" )
					|| f( "report" );
			}
		} );
		tree.vm.Node = tree.getNodeConstructor();
		var rootNode = tree.vm.Node({
			caption: "KPI(BSC)",
			value: {id:-1,url:""},
			folder: true
		});
		tree.setRoot(rootNode);
		_.post( {
			url: KPITreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: "-1",
				virtualMode: "false",
				treeType: "kpi"},
			callback: function( r ) {
				if ( r != "empty" ) {
					appendAllNode(rootNode, eval(r), tree);
				}
			}
		} );
		return tree;
	}
	
	function appendAllNode(parent, data, tree)
	{
		var Node = tree.getNodeConstructor();
		for( var i = 0, len = data.length; i < len; i++ ) {
			if(data[i] instanceof Array) {
				var child = Node( {
					caption: data[i][0].caption ,
					value:{ id:  data[i][0].id ,
						    url: data[i][0].url },
					folder: data[i][0].isFolder,
					getIcon: 
						(data[i][0].isFolder && "folder")
				} );
				parent.append(child);
				appendAllNode(child, data[i].slice(1), tree);
			}else {
				var child = Node( {
					caption: data[i].caption ,
					value: { id: data[i].id ,
					         url: data[i].url },
					click: (data[i].isFolder ? null : KPITreeDialog.KPITreeClick),
					folder: data[i].isFolder,
					getIcon: 
						(data[i].isFolder && "folder")
				} );
				parent.append(child);
			}
		}
	}	
	
	function kpiTreeLazyload(_this, callback ) 
	{
		_.post( {
			url: KPITreeDialog.servletURL,
			json: {
				servletType: bi_tree_util.ServletType_BIWebUtil,
				id: _this.value.id ,
				treeType: "kpi"},
			callback: function( r ) {
				var nodes = [];
				if ( r != "empty" ) {
					var a = r.split( "|" ), node, aa;
					for( var i = 0, len = a.length; i < len; i++ ) {
						aa = a[i].split( "," );
						node = _this.vm.Node( {
							caption: aa[0],
							value: {
								id: aa[1],
								url: aa[2]
							},
							click: KPITreeDialog.kpiTreeClick,
							getIcon: 
								(aa[3] == "true" && "folder")
						} );
						if(aa[3]!="false")
							_.extend( node, { lazyload: kpiTreeLazyload, folder: true } );
						else
							_.extend( node, { folder: false } );
						nodes.push( node );
					}
				}
				callback( nodes );
			}
		} );
	};
}

function bi_tree_util() {}
bi_tree_util.f = function( parentPanel,id ) {
	return _.select( parentPanel.content, "sue", 1, id );
}

bi_tree_util.ServletType_BIWebUtil = "BIWebUtil";

bi_tree_util.checkExistViewItem = function(view,name, isFolder) {
	if(view && view.rowCount() > 1) {
		//第一行是标题行，需要跳过
		for(var i = 1; i < view.rowCount(); i++)
		{
			if(view.cell(i,0) == name) {
				if ( isFolder === undefined || ( isFolder !== undefined && isFolder === view.row( i, 0 ).$info.isFolder ) ) {
					return true;
				}
			}
				
		}
	}
	return false;
}
