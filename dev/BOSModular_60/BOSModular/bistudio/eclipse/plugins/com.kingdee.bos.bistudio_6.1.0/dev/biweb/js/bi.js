if ( !this.bi ) {

	window.onerror = _.K( false );
	_.bindEvent( window, "error", function( e ) {
		var warning = "脚本执行出错：" +
			e.errorMessage + "\n" +
			"URL：" + e.errorUrl + "\n" +
			"行号：" + e.errorLine;
		bi.portalDialog( warning );
		e.returnValue = false;
	} );
	
	var bi = ( function() {
		
		function getTargetIFrame( windowID ) {
			// 定位初始窗口，用作避免出现过多滚动条
			var __base_window = window,
				pluck = _.pluck( windowID );
			// 第一个条件用于确认是否已经找到初始窗口
			// 第二个条件用于确保不会因为parent属性的自引用而陷入死循环
			while( !pluck( __base_window ) && __base_window !== __base_window.parent ) __base_window = __base_window.parent;
			return __base_window.document.getElementById( __base_window[windowID] );
		}
		// 用于处理单报表portlet找不到的问题
		function getTargetPortletIFrame( iframeID ) {
			var __base_window = window;
			// 未找到 且 没有构成死循环
			while(!__base_window.document.getElementById( iframeID )&&__base_window !== __base_window.parent) 
				__base_window = __base_window.parent;
			return __base_window.document.getElementById( iframeID );
		}
		function handleIFrameHeight( iframe, height ) {
			if ( !iframe ) {
				return;
			} else if ( height !== undefined ) {
				iframe.style.height = height + "px";
			} else if ( iframe ) {
				height = Math.max( document.body.scrollHeight, window.screen.availHeight - 160 );
				iframe.style.height = height + "px";
			}
		}
		
		
		// public方法
		return {
		    
			// 调整最底层iframe高度，避免出现滚动条
			tryResetBaseIFrameHeight: function( height ) {
				var __base_iframe = getTargetIFrame( "__base_window" );
				handleIFrameHeight( __base_iframe, height );
				// 使用getTargetPortletIFrame()处理portlet的高度问题
				//debugger;
				var __bi_portlet_iframe = getTargetPortletIFrame( "__bi_portlet_iframe" );
				handleIFrameHeight( __bi_portlet_iframe, height );
				// 兼容新的portlet形式
				try
				{
					//single
					if(window.frameElement && window.frameElement.id == "__bi_portlet_iframe" ){
						var __bi_portlet_iframe1 = window.frameElement;
						handleIFrameHeight( __bi_portlet_iframe1, height );
					}
					//dir
					if(window.parent.frameElement && window.parent.frameElement.id == "__bi_portlet_iframe"){
						var __bi_portlet_iframe2 = window.parent.frameElement;
						handleIFrameHeight( __bi_portlet_iframe2, height );
					}
				}
				catch(err)
				{
				   //暂时不处理错误
				}

			},
			getBaseIFrameScrollTop: function() {
				var __base_iframe = getTargetIFrame( "__base_window" );
				return __base_iframe
					? __base_iframe.document.body.scrollTop
					: 0;
			},
			progressBar: function( doc ) {
				var doc = doc || document;
				var div = _.div( { parent: doc.body, cssText: "position:absolute;z-index:10000" } );
				_.crt( "img", { src: Sue.config.bi_progress_picture_path }, div );
				_.center( div );
				var cover = _.cover( null, null, null, doc );
				return {
					remove: function() {
						_.gc( div );
						cover && cover.remove();
						div = cover = null;
					}
				};
			},
			portalDialog: function( msg ) {
				window.showModalDialog( Sue.config.bi_message_box_path + "?warn" + encodeURIComponent( msg ), null, "dialogWidth=429px;dialogHeight=208px;center=yes;help=no;status=no;scroll=no" );
			},
			// 模态输入框。自动HTML转义
			// param = {
			// 		caption: (string) 标题文字
			//		text: (string) 提示输入文字
			//		verify: (function) 校验函数，返回true表示校验通过；false表示校验不通过，对话框不关闭；返回一个object则将该object作为一个bi.getMessageTable的配置对象传入，显示警告信息
			// 		ok: (function) 点击确定执行的函数
			// 		parentDialog: (Sue.ui.ext.dialog) 父对话框实例
			//		document: 所属的文档对象。默认为当前页面文档对象
			// }
			input: function( param ) {
				param.parentDialog && param.parentDialog.hide();
				var dialog = Sue.ui.ext.dialog( {
					coveredDocuments: bi.getAllFramesDocuments(),
					document: param.document,
					z: 10000,
					width: 350,
					caption: param.caption,
					closeAction: "close",
					destroyHook: function() {
						param.parentDialog && param.parentDialog.show();
					}
				} );
				dialog.setContent( _.loadUIT( "bi_dialog_input" ) );
				dialog.addButton( "确定", clickOK );
				var input = _.select( dialog.content, "sue", 1, "input" );
				//设置输入焦点
				try{
   					input.focus();
				}catch (e){
				} 			
				_.bindEvent( input, "keydown", function( e ) {
					if ( e.keyCode == 13 ) clickOK();
				} );
				this.updateToPortalStyleTextField( dialog.root, { backgroundColor: Sue.config.cs[14] } );
				_.select( dialog.content, "sue", 1, "text" ).innerHTML = param.text || "";
				function clickOK() {
					var value = input.value;
					value = _.escapeHTML( value );
					if ( param.verify ) {
						var v = param.verify( value );
						if ( v === false ) return;
						else if ( typeof v === "object" ) {
							bi.getMessageTable( v, _.select( dialog.content, "sue", 1, "msg" ) );
							return;
						}
					}
					param.ok && param.ok( value );
					dialog.destroy();
				}
			},
			// 模态确认框
			// param = {
			// 		caption: (string) 标题文字
			//		text: (string) 提示确认文字
			//		yes: (function) yes回调
			//		no: (function) no回调
			//		cancel: (function) cancel回调
			// 		parentDialog: (Sue.ui.ext.dialog) 父对话框实例
			//		document: 所属的文档对象。默认为当前页面文档对象
			// }
			confirm: function( param ) {
				param.parentDialog && param.parentDialog.hide();
				var dialog = Sue.ui.ext.dialog( {
					coveredDocuments: bi.getAllFramesDocuments(),
					document: param.document,
					z: 10000,
					width: 300,
					caption: param.caption,
					closeAction: "close",
					buttonCentered: true,
					destroyHook: function() {
						param.parentDialog && param.parentDialog.show();
					}
				} );
				dialog.setContent( _.loadUIT( "bi_dialog_confirm" ) );
				param.yes && dialog.addButton( "是", _.link( _.bind( dialog.destroy, dialog ), param.yes ) );
				param.no && dialog.addButton( "否", _.link( _.bind( dialog.destroy, dialog ), param.no ) );
				param.cancel && dialog.addButton( "取消", _.link( param.cancel, _.bind( dialog.destroy, dialog ) ) );
				var textContainer = _.select( dialog.content, "sue", 1, "text" );
				textContainer.innerHTML = param.text || "";
			},
			info: function( msg ) {
				window.showModalDialog( Sue.config.bi_message_box_path + "?info" + encodeURIComponent( msg ), null, "dialogWidth=429px;dialogHeight=208px;center=yes;help=no;status=no;scroll=no" );
			},
			getRepositoryPicture: function( servletURL, repositoryPath ) {
				if( !repositoryPath ) return "";
				var url = servletURL + "?servletType=getPicture&repositoryPath=" + encodeURI(repositoryPath) ;
				var ret;
				_.get( {
					url: url,
					async: false,
					nocache: true,
					beforeStart: null,
					afterEnd: null,
					callback: function( r ) {
						ret = r;
					}
				} );
				return ret;
			},
			// 将指定搜索指定DOM范围（子节点）内的所有className为"portal_button"的按钮，将其置换为portal风格的按钮
			// 若指定的范围是数组，则直接在数组内进行置换
			// propertyName指定了按何种属性值返回引用hash表
			updateToPortalStyleButton: function( scope, propertyName ) {
				if ( !scope ) throw new Error( "客户端脚本错误: 指定的范围不能为空" );
				if ( !( scope instanceof Array ) ) {
					var isButton = scope.tagName.toLowerCase() == "button";
					if ( isButton && scope.className == "portal_button" ) {
						scope = [ scope ];
					} else {
						scope = _.find( scope, function( e ) {
							return e.tagName && e.tagName.toLowerCase() == "button" && ( e.className == "portal_button" || e.className == "portal_switch_button" );
						} );
					}
				}
				var len = scope.length,
					hash,
					btn;
				if ( propertyName ) {
					hash = {};
					var	pluck = _.pluck( propertyName );
				}
				for( var i = 0; i < len; i++ ) {
					btn = Sue.ui.button( {
						parent: scope[i].ownerDocument,
						type: scope[i].className == "portal_switch_button" ? "switch" : "simple",
						caption: scope[i].innerHTML,
						cssText: scope[i].style.cssText,
						click: _.extractEvent( scope[i], "click" ),
						properties: _.mixin( {}, scope[i], "id,sue,disabled" )
					} );
					propertyName && ( hash[ pluck( scope[i] ) ] = btn );
					scope[i].parentNode.insertBefore( btn.span, scope[i] );
					_.gc( scope[i] );
				}
				return hash;
			},
			// portal样式按钮,不绑定事件
			updateToPortalStyleButtonWithoutClick: function( scope, propertyName,objName) {
				if ( !scope ) throw new Error( "客户端脚本错误: 指定的范围不能为空" );
				if ( !( scope instanceof Array ) ) {
					var isButton = scope.tagName.toLowerCase() == "button";
					if ( isButton && scope.className == "portal_button" ) {
						scope = [ scope ];
					} else {
						scope = _.find( scope, function( e ) {
							return e.tagName && e.tagName.toLowerCase() == "button" && ( e.className == "portal_button" || e.className == "portal_switch_button" );
						} );
					}
				}
				var len = scope.length,
					hash,
					btn;
				if ( propertyName ) {
					hash = {};
					var	pluck = _.pluck( propertyName );
				}
				for( var i = 0; i < len; i++ ) {
					btn = Sue.ui.button( {
						parent: scope[i].ownerDocument,
						id:objName,
						type: scope[i].className == "portal_switch_button" ? "switch" : "simple",
						caption: scope[i].innerHTML,
						cssText: scope[i].style.cssText,
						properties: _.mixin( {}, scope[i], "id,sue,disabled" )
					} );
					propertyName && ( hash[ pluck( scope[i] ) ] = btn );
					scope[i].parentNode.insertBefore( btn.span, scope[i] );
					_.gc( scope[i] );
				}
				return hash;
			},
			updateToPortalStyleTextField: function( scope, param ) {
				if ( !scope ) throw new Error( "客户端脚本错误: 指定的范围不能为空" );
				if ( !( scope instanceof Array ) ) {
					var isTextField = scope.tagName.toLowerCase() == "input" && scope.type.toLowerCase() == "text";
					if ( isTextField && scope.className == "portal_textfield" ) {
						scope = [ scope ];
					} else {
						scope = _.find( scope, function( e ) {
							return e.tagName && e.tagName.toLowerCase() == "input" && e.type.toLowerCase() == "text" && e.className == "portal_textfield";
						} );
					}
				}
				var len = scope.length;
				var tf;
				for( var i = 0; i < len; i++ ) {
					_.extend( scope[i].style, {
						border: "none",
						borderBottom: ( scope[i].disabled || scope[i].readOnly ) ? "solid 1px #555" : ( "solid 1px " + Sue.config.cs[16] )
					}, param || {} );
				}
			},
			/**
			 * 将提示信息用人机UI的标准展示出来
			 * msgs = [ {
			 * 		type: (string) 信息类型（可选info/warning/error）
			 * 		caption: (string) 信息标题（应言简意赅）
			 * 		messages: (array of string) 详细信息数组（表示同一标题下的多条信息）
			 * }, ... ]
			 * pnt: 表格DOM对象的父节点
			 */ 
			getMessageTable: function( msgs, pnt ) {
				if ( !msgs ) throw new Error( "客户端脚本错误: 传入的消息不能为空" );
				pnt.innerHTML = "";
				pnt.style.display == "none" && ( pnt.style.display = "block" );
				msgs = _.$A( msgs );
				var icons = {
					info: Sue.config[ "bi_message_table_icon_prefix" ] + "info.gif",
					warning: Sue.config[ "bi_message_table_icon_prefix" ] + "warning.gif",
					error: Sue.config[ "bi_message_table_icon_prefix" ] + "error.gif",
					close: Sue.config[ "bi_message_table_icon_prefix" ] + "close.gif"
				};
				var tdf = [];
				for( var i = 0; i < msgs.length; i++ ) {
					tdf.push( _.format( "{[!width:27px;background:url(%s) center center no-repeat][!font-weight:bold;vertical-align:bottom~%s][!width:27px;]!height:27px;vertical-align:middle}", icons[ msgs[i].type ], msgs[i].caption ) );
					if ( msgs[i].messages ) {
						msgs[i].messages = _.$A( msgs[i].messages );
						var len = msgs[i].messages.length;
						for( var j = 0; j < len; j++ ) {
							tdf.push( _.format( "{*[~%s]*!height:21px}", msgs[i].messages[j] ) );
						}
					}
				}
				tdf.push( "!width:100%;border-collapse:collapse;border:solid 1px #e7817e;background-color:#fdf6f3;font-size:12px;color:#004a80;" );
				var table = _.table( tdf.join( "" ), pnt );
				var closeImg = _.crt( "img", { src: icons.close }, table.td( 0, 2 ) );
				_.bindEvent( closeImg, "click", function() {
					pnt.style.display = "none";
					_.gc( table.table );
				} );
			},
			// 若当前页面属于一个框架集，则返回所有同级的子框架文档对象集，否则返回当前页面文档对象。
			// 这个方法主要用于为模态对话框生成覆盖所有框架的层
			getAllFramesDocuments: function() {
				var coveredDocuments = [];
				if ( parent.frames.length > 0 ) {
					for( var i = 0; i < parent.frames.length; i++ ) {
						coveredDocuments.push( parent.frames[i].window.document );
					}
				} else {
					coveredDocuments.push( document );
				}
				return coveredDocuments;
			}
		};
	} )();
	
}