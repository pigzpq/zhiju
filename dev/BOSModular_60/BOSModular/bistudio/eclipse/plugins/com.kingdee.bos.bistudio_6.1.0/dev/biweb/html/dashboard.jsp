1ffe



<html>
	<head>
		<meta http-equiv="Pragma" content="no-cache"/> 
		<meta http-equiv="Cache-Control" content="no-cache"/> 
		<meta http-equiv="Expires" content="0"/>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	   	
	   	<link rel="stylesheet" type="text/css" href="../ext-2.0/resources/css/ext-all.css" />
	   	
	   	<link href="../css/worksheet.css" rel="stylesheet" type="text/css"></link>
	   	<link href="../css/ui-components.css" rel="stylesheet" type="text/css"></link>
		
		<script src="../ext-2.0/adapter/ext/ext-base.js"></script>
		<script src="../ext-2.0/ext-all.js"></script>
		
		<script src="../dashboard/FusionCharts/js/FusionCharts.js"></script>
		<script src="../js/sue-main.js"></script>
		<script src="../js/sue-ui.js"></script>
		<script src="../js/sue-config.js"></script>
		<script src="../js/bi.js"></script>
		<script src="../dashboard/script_engine.js"></script>
		<script src="../js/DimSelector.js"></script>		
		<script src="../js/dashboard.js"></script>
		<script>
			// 由于要改变xsl里面的色彩方案，所以这里把原本的静态CSS改为动态注册
			_.css( _.format( "th.column-heading-even, th.column-heading-odd, th.column-heading-span, th.corner-heading, th.row-heading-even, th.row-heading-odd, th.row-heading-span, th.column-heading-even-right, th.row-heading-even-right, th.column-heading-span-right, th.row-heading-span-right, th.row-heading-heading, th.column-heading-heading, th.rownum-heading, th.rownum {background-color:%s;border:solid 1px #fff;}", Sue.config.cs[6] ) );
			_.css( _.format( "td.cell-even, td.cell-odd {border:solid 1px %s}", Sue.config.cs[6] ) );
			_.css( _.format( ".slicer_field, .page_field, .strategy_title, .report_msgdiv {background-color:%s} .filter_panel_container hr {color:%s} .filter_panel_container a {color:%s}", Sue.config.cs[7], Sue.config.cs[10], Sue.config.cs[11] ) );
			// initialize the tabbed panel after window has been loaded
			var setDefault;
			var dashboardPath;
			_.bindEvent( window, "load", function() {
				bannerImage = null;
			 	tabbedpanel = Sue.ui.ext.tabbedPanel( {
					parent: document.body,
					max: 10,
					fontColor: Sue.config.cs[8],
					overflow: function() {
						bi.portalDialog( "您打开的页签数目过多，请先关闭一些页签。" );
					},
					init: function() {
						this.isTab = _.K( true );
						tabbedpanel.externalRoot.style.display = "inline";
						if ( bannerImage ) {
							_.gc( bannerImage );
							bannerImage = null;
						}
					},
					select: function() {
						if ( !this.loaded ) {
							loadDashBoard( this );
							this.loaded = true;
						}
						path = this.url;
						dashboardPath=path;
						setDefaultEnable();
						current_Node = this.node;
					},
					destroy: function() {
						_.post( {
							url: "/easWebClient/BIReport",
							json: {
								actionName: "removeDashboardState",
								servletType: "getSession",
								caption: this.caption,
								url: this.url.match( /^(.*)&caption/ )[1]
							}
						} );
						if ( tabbedpanel.tabs.length <= 1 ) {
							bannerImage = _.crt( "img", {
								src: "../img/ui-web/report_banner.gif"
							}, document.body );
							tabbedpanel.externalRoot.style.display = "none";
						}
					}
				} );
				setDashBoardCurrentNode = function(firstNode ) {
					first_Node=firstNode;
				}
			   	getHashHomePage=function(){
			   		return hashHomePage;
			  	 }
				var menuSpan=_.crt( "span", null, this.head, "font-size:12px;position:absolute;right:0px;border:none;width:100px;background:none;padding:0px 0px 5px 0px" );
				var path, current_Node,first_Node,old_Node=null,hashHomePage;
								
				setDefault =_.crt( "input", { type:"checkbox"},menuSpan );
				_.bindEvent( setDefault, "click", onDafaultClick);
				menuSpan.appendChild(document.createTextNode("默认显示"));	
				/**
				var a = _.crt( "a", { href: "javascript:void(0);", innerHTML: "&nbsp;&nbsp;设为首页" },menuSpan, "text-decoration:none" );
				_.bindEvent( a, "click", function() {
				    var url = decodeURIComponent(path.match( /(.*)\?/)[1]);
		  	 	    var dashbordPath = decodeURIComponent(path.match( /dashboard_path\=(.*?)(&.*?)?$/)[1] );				
				   _.post( {
				            url:url,
				   	        beforeStart: _.Z,
		                    afterEnd: _.Z,
					    	json: {	    
					    	            type: "action",
                                       	servletType: "BIWebUtil",		
										action: "saveHomePageByDashboard",  //删除仪表板配置
										path:dashbordPath		
								  },
						    callback: function( r ) 
						          {
						              
						                alert("设置首页成功!");
						                hashHomePage=true;
						                current_Node && current_Node.setCaption(current_Node.caption,"color:red");
						                if(old_Node!=null && old_Node!=current_Node){
						                     old_Node && old_Node.setCaption(old_Node.caption,"color:black");
						               		 old_Node=current_Node;
						                }else if(first_Node!=current_Node){
						                first_Node && first_Node.setCaption(first_Node.caption,"color:black");
						                	 old_Node=current_Node;
						                }
						          }	
				             } 
					      );
					
				} );*/
				
				tabbedpanel.setExternalContent( menuSpan );
				tabbedpanel.externalRoot.style.display = "none";
				// 根据session状态恢复上次没有关闭的仪表板
				_.post( {
					url: "/easWebClient/BIReport",
					json: {
						servletType: "getSession",
						actionName: "getDashBoardList"
					},
					callback: function( r ) {
						var lastTab = r.pop();
						_.map( r, function( tab ) {
							tab = eval( "(" + tab + ")" );
							tabbedpanel.append( {
								$uniqueValue: tab.url,
								//node: _this,
								caption: tab.caption,
								url: tab.url + "&caption=" + encodeURIComponent( tab.caption ),
								servletURL: "/easWebClient/BIReport",
								servletType: "BIDashBoard"
							}, true );
						} );
						if ( lastTab ) {
							lastTab = eval( "(" + lastTab + ")" );
							tabbedpanel.append( {
								$uniqueValue: lastTab.url,
								//node: _this,
								caption: lastTab.caption,
								url: lastTab.url + "&caption=" + encodeURIComponent( lastTab.caption ),
								servletURL: "/easWebClient/BIReport",
								servletType: "BIDashBoard"
							} );
						} else if ( !r.length ) {
						   _.post( {
						            url:"/easWebClient/BIReport",
						   	        beforeStart: _.Z,
				                    afterEnd: _.Z,
							    	json: {	    
							    	            type: "action",
		                                       	servletType: "BIWebUtil",		
												action: "getDefaultPath"	
										  },
								    callback: function( r ) 
								          {	
								            if(!r.length){
								                setDefault.checked=false;								                
								                bannerImage = _.crt( "img", {
								                src: "../img/ui-web/report_banner.gif"
							                    }, document.body );
								            }else{
								                var dashboard=r.split("|");
								                for(var i=0;i<dashboard.length;i++){//显示默认                 
								                   var dashboard_caption=dashboard[i].split(",")[0];
								                   var dashboard_url=dashboard[i].split(",")[1];
									                tabbedpanel.append( {
									                   $uniqueValue: dashboard_url,
														caption: dashboard_caption,
														url: dashboard_url + "&caption=" + encodeURIComponent( dashboard_caption ),
														servletURL: "/easWebClient/BIReport",
														servletType: "BIDashBoard"
													  } );
								                }
								            }	                     
								          }	
						           } );
						}
					}
				} );
			} );	
			    //删除默认
			function delDefaultDashboard(){
					    var dashboard_url=dashboardPath.match( /^(.*)&caption\=/ )[1];
					    var url = decodeURIComponent(dashboardPath.match( /(.*)\?/)[1]);
			  	 	    var dashbordPath = decodeURIComponent(dashboardPath.
12a0
match( /dashboard_path\=(.*?)(&.*?)?$/)[1] );				
					    var dashbordCaption=decodeURIComponent(dashboardPath.match(/caption\=(.*?)(\&.*)?$/)[1] );
					   _.post( {
					            url:url,
					   	        beforeStart: _.Z,
			                    afterEnd: _.Z,
						    	json: {	    
						    	            type: "action",
	                                       	servletType: "BIWebUtil",		
											action: "delDefaultPath", 
											path:dashboard_url,
											caption:dashbordCaption		
									  },
							    callback: function( r ) 
							          {
							                alert("删除默认成功!");
							                var dashboard=r.split("|");
							                setDefault.checked=false;  
									        								        
							          }	
					             } );		
					}
			    //设置默认	
				function setDefaultDashboard(){ 
					    var dashboard_url=dashboardPath.match( /^(.*)&caption\=/ )[1];
					    var url = decodeURIComponent(dashboardPath.match( /(.*)\?/)[1]);
			  	 	    var dashbordPath = decodeURIComponent(dashboardPath.match( /dashboard_path\=(.*?)(&.*?)?$/)[1] );				
					    var dashbordCaption=decodeURIComponent(dashboardPath.match(/caption\=(.*?)(\&.*)?$/)[1] );				
					   _.post( {
					            url:url,
					   	        beforeStart: _.Z,
			                    afterEnd: _.Z,
						    	json: {	    
						    	            type: "action",
	                                       	servletType: "BIWebUtil",		
											action: "setDefaultPath", 
											path:dashboard_url,
											caption:dashbordCaption	
									  },
							    callback: function( r ) 
							          {			
							                if(r=="ok"){
							                   alert("设置默认成功!");							               
                                               setDefault.checked=true;	
							                }else{
							                   alert("默认显示超出了最大个数的限制!");							               
                                               setDefault.checked=false;	
							                }                          
							                        
							          }	
					             } 
						      );
					} 
			function onDafaultClick(){
				if(!setDefault.checked){
					delDefaultDashboard();
				}else{
					setDefaultDashboard();
				}
		    }
		    //如果当前节点为默认节点，则删除按钮可用，否则设为默认可用
			function setDefaultEnable() {
			            var dashboard_url=dashboardPath.match( /^(.*)&caption\=/ )[1];
					    var url = decodeURIComponent(dashboardPath.match( /(.*)\?/)[1]);
			  	 	    var dashbordPath = decodeURIComponent(dashboardPath.match( /dashboard_path\=(.*?)(&.*?)?$/)[1] );				
					   
					   _.post( {
					            url:url,
					   	        beforeStart: _.Z,
			                    afterEnd: _.Z,
						    	json: {	    
						    	            type: "action",
	                                       	servletType: "BIWebUtil",		
											action: "setDefaultEnable", 
											path:dashboard_url	
									  },
							    callback: function( r ) 
							          {
							              
							               if(r=="true"){//如果已经是默认显示
							                 setDefault.checked=true;
							               }else{
							                 setDefault.checked=false;
							               }    
							          }	
					             } );		
			}
			function loadDashBoard( tab ) {
				var env;
				// 获取该dashboard相关的环境变量
				_.get( {
					url: tab.url,
					servletType: tab.servletType,
					async: false,
					nocache: true,
					callback: function( r ) {
						try {
							env = eval( "(" + r + ")" );
						} catch ( e ) {
							bi.portalDialog( r );
						}
					}
				} );
				if ( !env ) return;
				if ( "error" in env ) {
					bi.portalDialog( env.error.message );
					return;
				}
				tab.env = env;
				env.servletType = tab.servletType;
				// 设置背景
				var bg = env.background;
				var st = tab.body.style;
				bg.color && ( st.backgroundColor = bg.color );
				bg.url && ( st.backgroundImage = "url(" + bi.getRepositoryPicture( tab.servletURL, bg.url ) + ")" );
				if ( bg.scale == "center" ) {
					st.backgroundRepeat = "no-repeat";
					st.backgroundPosition = "center center";
				}
				var overflowDiv = _.div( {
					parent: tab.body,
					cssText: "overflow-x:auto;width:100%",
					innerHTML: env.layoutTable
				} );
				
				createScriptEngine( env );
				createScriptEngineDatasources( env );
				createScriptEngineCells( env );
				createScriptEngineDials( env );				
				runAllScript( env.scriptEngine );
			}
		    
		</script>
	</head>
	<body topmargin="10" leftmargin="0" bottommargin="12" rightmargin="0">
	</body>
</html>
0

