/**
 * Framework Sue UI library
 * @author Casey Lai
 * @since 2008-1-22
 */

if ( this.Sue && !Sue.ui ) {
	var portalColorSchemeName;//颜色方案
	if(document.cookie.match( /BI_COLOR_SCHEME_NAME\=(\w+);/ )!=null){
		portalColorSchemeName= document.cookie.match( /BI_COLOR_SCHEME_NAME\=(\w+);/ )[1];
	}
	 
	// 基础组件
	Sue.ui = ( function( _ ) {
		
		var Panel = ( function() {
			function Panel( param ) {
				var doc = _.doc( param.parent );
				var root = _.div( _.mixin( { cssText: param.rootCSSText }, param, "parent" ) ),
					content = param.scale ? setScalable( root, param.scale ).content : root;
				param.contentCSSText && ( content.style.cssText = param.contentCSSText );
				param.className && ( content.className = param.className );
				param.innerHTML && ( content.innerHTML = param.innerHTML );
				param.dragable && setDragable( root );
				var popup = param.popup,
					cover;
				popup === true && ( popup = {} );
				var _this = _.extend( this, {
					root: root,
					content: content,
					show: function() {
						if ( root.style.display == "block" ) return;
						// 若该面板是属于弹出式，则鼠标在面板之外的区域点击时，面板将自动隐藏
						if ( popup ) {
							( cover || ( cover = _.getDocumentCover( {
								doc: doc
							} ) ) ).show( {
								z: popup.z || root.style.zIndex - 1,
								rgb: param.rgb,
								opacity: param.opacity,
								click: function() {
									_this.hide();
								}
							} );
							// 因为在切换页签时浮动的panel需要统一处理，这里在浮动面板显示的时候自动将panel的引用保存到一个全局变量中
							// 关闭的时候删除引用
							var pops = _.cache( "sue_popup_panels" ) || [];
							pops.push( this );
							_.cache( "sue_popup_panels" , pops );
						}
						root.style.display = "block";
						return this;
					},
					hide: function( e ) {
						if ( root.style.display == "none" ) return;
						// 删除引用
						var pops = _.cache( "sue_popup_panels" );
						if ( pops && pops.length > 0 ) {
							var i = _.indexOf( pops, this );
							if ( i != -1 ) {
								pops.splice( i, 1 );
							}
						}
						if ( cover ) {
							cover.hide();
						}
						root.style.display = "none";
						return this;
					}
				} );
			}
			
			var scalableMap = [ [ "nw", "n", "ne" ], [ "w", null, "e" ], [ "sw", "s", "se" ] ];
			// 设定指定的div可以拖放大小
			function setScalable( panel, param ) {
				var doc = panel.ownerDocument;
				panel.style.position = "absolute";
				// 用一个3×3的表格来对拖放大小事件进行监听
				var table = _.table( "A|[!width:2px]|B|height:2px|@{?A*?A!?B}{*3}{*3!?B}!border-collapse:collapse;width:100%;height:100%", panel ),
					// 在表格指定的行列上绑定拖放事件
					f = function( r, c, s ) {
						var td = table.td( r, c );
						td.style.cursor = scalableMap[r][c] + "-resize";
						_.bindEvent( td, "mousedown", function( e ) {
							var xywh = _.map( s.split( "," ), parseInt ),
								m = [ param.minWidth, param.maxWidth, param.minHeight, param.maxHeight ],
								xy = _.xy( panel, document.documentElement ),
								wh = { w: panel.clientWidth - 3, h: panel.clientHeight - 3 },
								mx = e.clientX, my = e.clientY,
								glass = _.cover( +panel.style.zIndex + 2 ),
								shadow = _.div( { parent: doc.body, cssText: _.format( "border:solid #CCC;position:absolute;left:%spx;top:%spx;width:%spx;height:%spx;z-index:%s", xy.x, xy.y, wh.w, wh.h, panel.style.zIndex + 1 ) } ),
								style = shadow.style;
							_.bindEvent( doc.body, "mousemove", function( e ) {
								var dx = e.clientX - mx, dy = e.clientY - my,
									nw = wh.w + xywh[2] * dx, nh = wh.h + xywh[3] * dy;
								if ( nw >= m[0] && nw <= m[1] ) {
									style.width = nw + "px";
									xywh[0] && ( style.left = xy.x + xywh[0] * dx + "px" );
								}
								if ( nh >= m[2] && nh <= m[3] ) {
									style.height = nh + "px";
									xywh[1] && ( style.top = xy.y + xywh[1] * dy + "px" );
								}
							} );
							_.bindEvent( glass.div, "mouseup", function() {
								_.copyStyle( [ panel, content ], "left,top", shadow );
								panel.style.width = parseInt( panel.style.width ) + parseInt( shadow.style.width ) - wh.w + "px";
								table.table.style.height = panel.style.height = parseInt( panel.style.height ) + parseInt( shadow.style.height ) - wh.h + "px";
								_.gc( shadow );
								glass.remove();
								_.unbindEvent( doc.body, "mousemove" );
								param.hook && param.hook( panel );
							} );
						} );
					},
					dir = param.direction, d;
				// 在指定的方向上注册监听器
				if ( dir ) {
					d = {};
					dir = dir.split( "," );
					for( var i = 0; i < dir.length; i++ ) {
						d[dir[i]] = true;
					}
				}
				( !d || d.nw ) &&  f( 0, 0, "1,1,-1,-1" ),
				 ( !d || d.n ) &&  f( 0, 1, "0,1,0,-1" ),
				( !d || d.ne ) &&  f( 0, 2, "0,1,1,-1" ),
				 ( !d || d.w ) &&  f( 1, 0, "1,0,-1,0" ),
				 ( !d || d.e ) &&  f( 1, 2, "0,0,1,0" ),
				( !d || d.sw ) &&  f( 2, 0, "1,0,-1,1" ),
				 ( !d || d.s ) &&  f( 2, 1, "0,0,0,1" ),
				( !d || d.se ) &&  f( 2, 2, "0,0,1,1" );
				var content = table.td( 1, 1 );
				return {
					panel: panel,
					table: table,
					content: content
				};
			}
			
			// 设置div可鼠标拖动
			function setDragable( div ) {
				var dragBar = _.div( {
					cssText: _.format( "width:100%;height:10px;border:none;font-size:1px;margin-bottom:10px;padding:0px;background-color:%s;cursor:move", Sue.config.cs[20] || "#CCE0EE" )
				} );
				div.firstChild
				? div.insertBefore( dragBar, div.firstChild )
				: div.appendChild( dragBar );
				_.bindEvent( dragBar, "mousedown", function( e ) {
					if ( dragBar !== ( e.srcElement || e.target ) ) return;
					var w = div.clientWidth, h = div.clientHeight,
						xy = _.xy( div, document.documentElement ),
						dx = e.clientX - xy.x, dy = e.clientY - xy.y;
					var glass = glass || _.cover( 10000, null, null, div.ownerDocument ),
						shadow = shadow || _.div( {
							parent: ( div.ownerDocument || document ).body,
							cssText: _.format( "border:solid #CCC;position:absolute;left:%spx;top:%spx;width:%spx;height:%spx;z-index:9999", xy.x, xy.y, w, h )
						} );
					_.disableSelect( div );
					_.disableSelect( glass.div );
					_.bindEvent( glass.div, "mousemove", function( e ) {
						_.copyStyle( shadow, "left,top", [ e.clientX - dx, e.clientY - dy ] );
					} );
					_.bindEvent( glass.div, "mouseup", function() {
						_.copyStyle( div, "left,top", shadow );
						_.unbindEvent( glass.div );
						_.gc( shadow );
						_.enableSelect( glass.div );
						glass.remove();
						glass = shadow = null;
						_.enableSelect( div );
					} );
				} );
			}
			
			return Panel;
		} )();
		
		var Tree = ( function() {
			/**
			 * param {
			 * 		caption: (string) 节点的文本
			 * 		captionCSSText: (string) 文本的cssText
			 * 		disable: (boolean) 若设为true，该节点不对鼠标事件做出响应
			 * 		click: (function) 节点点击钩子
			 * 		dblclick: (function) 节点双击钩子
			 * 		lazyload: (function) 节点的惰性加载钩子
			 * 		getIcon: (string) 该节点使用的图标的路径。该属性的优先级比树的getIcon配置参数优先级高
			 * 		noIcon: (boolean) 若设为true，则该节点不显示图标
			 * 		check: (boolean) 不设置该属性表示不显示checkbox，设置为false表示显示checkbox但是不选中，true表示选中状态
			 * 		checkHook: (function) 选择框点击后执行的钩子
			 * }
			 */
			function Node( vm, param ) {
				_.extend( this, param, {
					id: param.id || _.uuid(),
					vm: vm
				} );
			}
			// 添加单个儿子节点
			function appendNode( node ) {
				var children = this.children = this.children || [],
					sibling = children[ children.length - 1 ];						
				node.parent = this;
				sibling && ( node.previous = sibling, sibling.next = node );
				children.push( node );
				"expanded" in this || ( this.expanded = false );
				this.parent || ( this.expanded = true );
				this.vm.append( node );
			}
			// 添加许多儿子节点
			function appendNodes( nodes ) {
				if ( !nodes.length ) return;
				var children = this.children = this.children || [],
					sibling = children[ children.length - 1 ],
					end = nodes.length - 1,
					head = nodes[ 0 ], tail = nodes[ end ];
				for( var i = 1; i < end; i++ ) {
					nodes[ i ].parent = this,
					nodes[ i ].previous = nodes[ i - 1 ],
					nodes[ i ].next = nodes[ i + 1 ];
				}
				head.parent = tail.parent = this;
				sibling && ( head.previous = sibling, sibling.next = head );
				nodes[ 1 ] && ( head.next = nodes[ 1 ] );
				nodes[ end - 1 ] && ( tail.previous = nodes[ end - 1 ] );
				this.children = children.concat( nodes );
				"expanded" in this || ( this.expanded = false );
				this.parent || ( this.expanded = true );
				this.vm.appendAll( nodes );
			}
			// 通过函数添加儿子节点。可以用该方法实现节点的虚模式加载
			// 函数f应具有如下性质：前N-1次调用f返回儿子节点集，第N次调用返回一个空值（0、null、undefined、""、[]），N属于正整数集
			// hook指定了虚模式添加完成后执行的钩子函数
			// interval指定了f被调用的频率，以毫秒为单位，默认200毫秒
			function appendNodesInFunction( f, hook, interval ) {
				var _this = this;
				( function g() {
					var nodes = f();
					if ( nodes && nodes.length > 0 ) {
						appendNodes.call( _this, nodes );
						window.setTimeout( g, interval || 200 );
					} else {
						hook && hook();
					}
				} )();
			}
			// Node类的原型
			Node.prototype = {
				// 添加儿子节点
				append: function( node, hook, interval ) {
					if ( node instanceof Function ) appendNodesInFunction.call( this, node, hook, interval );
					else if ( node instanceof Array ) appendNodes.call( this, node );
					else appendNode.call( this, node );
				},
				// 删除单个儿子节点
				remove: function( node ) {
					if ( !this.children ) return;
					var idx = typeof node == "number" ? node : _.indexOf( this.children, node ),
						node = this.children[ idx ];
					this.children.splice( idx, 1 );
					node.previous && ( node.previous.next = node.next );
					node.next && ( node.next.previous = node.previous );
					if ( !this.children.length ) {
						delete this.children;
						delete this.expanded;
					}
					this.vm.remove( node );
				},
				// 返回当前节点的全部祖先集合
				getAncestors: function( selfIncluded ) {
					var a = [];
					for( var node = selfIncluded ? this : this.parent; node; node = node.parent ) a.push( node );
					return a;
				},
				// 返回当前节点的全部子孙集合
				// method: 可取"bfs"、"dfs"或者为空，分别以广度优先顺序、深度优先顺序、默认顺序返回结果
				getAllChildren: function( method ) {
					if ( !this.children ) return [];
					var q = [].concat( this.children ), r, e, c, len;
					switch ( method ) {
						case "bfs":
							r = [ [].concat( q ) ];
							while( e = q.shift() ) ( c = e.children ) && ( q = q.concat( c ), r.push( c ) );
							return [].concat.apply( [], r );
						case "dfs":
							r = [];
							for( var i = 0, len = q.length; i < len; i++ ) {
								r.push( q[i] );
								q[i].children && ( r = r.concat( q[i].getAllChildren( "dfs" ) ) );
							}
							return r;
						default:
							r = q;
							for( var i = 0, len = q.length; i < len; i++ ) {
								q[i].children && ( r = r.concat( q[i].getAllChildren() ) );
							}
							return r;
					}
				},
				// 展开当前节点。若当前节点是一个尚未触发的虚模式节点，则该方法将对当前节点执行虚加载
				expand: function() {
					if ( this.lazyload ) this.vm.lazyload( this )
					else if ( this.expanded === false ) this.vm.expand( this );
				},
				// 折叠当前节点
				collapse: function() {
					this.expanded && this.vm.collapse( this );
				},
				// 重设节点的caption
				setCaption: function( caption, cssText ) {
					var a = this.div.lastChild;
					a.innerHTML = caption;
					cssText && ( a.style.cssText = cssText );
					a.title = _.unescapeHTML( caption );
					this.caption = caption;
				}
			}
	
			// 返回树所用的视图管理器（每一棵Sue-Tree都有自己独有的视图管理器，用于管理树的DOM渲染）
			function getViewManager( param ) {
				// 从节点ID到节点的映射表
				var map = {},
					iconPath = Sue.config[ "ui_tree_icon_path" ];
				// 返回指定名称资源的完整路径，用于Sue-Tree调用资源图片
				function img( name ) {
					var ext = ".gif";
					if ( name.indexOf( "." ) != -1 ) {
						ext = "";
					}
					return img[ name ] || ( img[ name ] = iconPath + name + ext );
				}
				// 返回指定节点的子孙在视图上排列最后的一个
				function getLastChild( node ) {
					var a = node.children;
					return a ? getLastChild( a[ a.length - 1 ] ) : node;
				}
				// 获取节点获取图标的函数
				function getgetIcon( node ) {
					return node.getIcon ? _.bind( img, this, node.getIcon ) : param.getIcon;
				}
				// 刷新节点图标
				function refreshIcon( node ) {
					if ( node.noIcon ) return;
					var gi = getgetIcon( node );
					gi && ( map[ node.id ].div.icon.src = gi( node, img ) );
				}
				// 对指定的节点进行视图渲染
				function render( node ) {
					var buf = [], ats = node.getAncestors();
					ats.pop();
					// 添加祖先的连接线
					for( var at = ats.pop(); at; at = ats.pop() ) buf.push( "<img style=\"vertical-align:middle\" src='", img( at.next ? "I": "blank" ), "'/>" );
					// 连接线尾
					buf.push( "<img style=\"vertical-align:middle;cursor:default\"/>" );
					// 节点图标
					var gi = getgetIcon( node );
					gi && !node.noIcon && buf.push( "<img style=\"vertical-align:middle\" src='", gi( node, img ), "'/>" );
					// 节点checkbox
					"check" in node && ( buf.push( "<img style=\"vertical-align:middle\" src='", img( node.check ? "CB5" : "CB1" ), "'/>" ) );
					// 节点文本
					buf.push( "<a style=\"padding-left:4px;vertical-align:middle;font:12px Arial;white-space:nowrap;break-all:keep-all;text-decoration:none;color:#000\">", node.caption, "</a>" );
					var div = _.div( {
							doc: param.doc,
							cssText: "word-break:keep-all;white-space:nowrap",
							innerHTML: buf.join( "" )
						} ),
						a = div.lastChild;
					a.title = _.unescapeHTML( node.caption );
					node.captionCSSText && ( a.style.cssText = node.captionCSSText );
					// 注册文本的事件
					node.disable || ( _.bindEvent( a, "mouseover", function() {
						_.extend( a.style, { cursor: "hand", textDecoration: "underline" } );
					} ),
					_.bindEvent( a, "mouseout", function() {
						_.extend( a.style, { cursor: "default", textDecoration: "none" } );
					} ),
					node.click && _.bindEvent( a, "mouseup", function( e ) {
						var evt = _.extend( {}, e );
						selectNode( node );
						// 此处可能需要同时注册鼠标单击和双击事件。由于浏览器的原因，若使用普通的方法注册事件，双击事件
						// 会被单击事件所“劫持”，不能正常使用。因此，这儿采取了一种特殊的处理方法。
						node.clickFlag = !node.clickFlag;
						node.actionHook && window.clearTimeout( node.actionHook );
						node.actionHook = window.setTimeout( function() {
							node.clickFlag && node.click && node.click( node, evt );
							!node.clickFlag && node.dblclick && node.dblclick( node, evt );
							node.clickFlag = false;
							node.actionHook = null;
						}, 500 );
					} ) );
					_.disableSelect( a );
					// ...
					node.parent.expanded || ( div.style.display = "none" );
					node.div = div;
					var image = a.previousSibling;
					"check" in node && ( div.check = image, image = image.previousSibling );
					gi && !node.noIcon && ( div.icon = image, image = image.previousSibling );
					div.line = image;
					map[ node.id ] = node;
					setLine( node );
					"check" in node && initCheck( node );
					return div;
				}
				// 设置节点checkbox
				function initCheck( node ) {
					var check = map[ node.id ].div.check;
					_.bindEvent( check, "mouseover", function() { check.src = check.over; } );
					_.bindEvent( check, "mouseout", function() { check.src = check.out; } );
					_.bindEvent( check, "click", function() {
						setCheck( "over", node, !node.check, node.checkHook );
					} );
					setCheck( "out", node, node.check );
				}
				// 设置checkbox
				function setCheck( src, node, checked, hook ) {
					var check = map[ node.id ].div.check;
					node.check = checked;
					check.over = img( node.check ? "CB6" : "CB2" );
					check.out = img( node.check ? "CB5" : "CB1" );
					check.src = check[ src ];
					hook && hook( node );
				}
				// 设置节点连接线尾
				function setLine( node ) {
					var line = map[ node.id ].div.line,
						f = function( g ) {
							_.unbindEvent( line, "click" );
							_.bindEvent( line, "click", function() { g( node ); } );
							return true;
						};
					node.expanded && ( line.src = img( node.next ? "TM" : "LM" ), f( collapse ) )
					|| node.lazyload && ( line.src = img( node.next ? "TP" : "LP" ), f( lazyload ) )
					|| node.children && ( line.src = img( node.next ? "TP" : "LP" ), f( expand ) )
					|| ( line.src = img( node.next ? "T" : "L" ) );
				}
				// 展开节点
				function expand( node ) {
					if ( node.expanded === false ) {
						node.expanded = true;
						setLine( node );
						refreshIcon( node );
						var children = ( function( node, r, q ) {
							var e;
							while( e = q.shift() ) {
								if ( e.parent.expanded ) {
									r.push( e );
									e.children && ( q = q.concat( e.children ) );
								}
							}
							return r;
						} )( node, [], [].concat( node.children ) );
						for( var i = 0, len = children.length; i < len; i++ ) {
							var child = children[ i ];
							child.parent.expanded && ( map[ child.id ].div.style.display = "block" );
						}
					}
				}
				// 折叠节点
				function collapse( node ) {
					if ( node.expanded ) {
						node.expanded = false;
						setLine( node );
						refreshIcon( node );
						var children = node.getAllChildren();
						for( var i = 0, len = children.length; i < len; i++ ) children[ i ].div.style.display = "none";
					}
				}
				// 对节点进行虚加载
				function lazyload( node, hook ) {
					node.append( new Node( param.vm, {
						caption: "正在获取数据，请稍候……",
						disable: true,
						noIcon: true
					} ) );
					expand( node );
					var _lazyload = node.lazyload;
					delete node.lazyload;
					_.bind( _lazyload, node, node, function( nodes ) {
						node.append( nodes );
						node.remove( 0 );
						hook && hook();
					} )();
				}
				// 重新渲染节点的全部儿子节点
				function rerenderChildren( node ) {
					setLine( node );
					var children = node.getAllChildren( "bfs" ),
						child, oldiv;
					for( var i = 0, len = children.length; i < len; i++ ) {
						child = children[i];
						oldiv = child.div;
						render( child );
						oldiv.parentNode.replaceChild( child.div, oldiv );
					}
				}
				// 设定选择节点（包括了UI的改变）
				function selectNode( node ) {
					if ( node == node.vm.selectedNode ) return;
					node.vm.selectedNode && ( node.vm.selectedNode.div.lastChild.style.backgroundColor = "" );
					node.vm.selectedNode = node;
					param.showSelectShadow === false || ( node.div.lastChild.style.backgroundColor = "#CCC" );
				}
				
				return {
					selectedNode: null,
					map: map,
					// 在视图上添加一个节点
					append: function( node ) {
						if ( node.id in map ) return;
						var parent = node.parent,
							div = render( node ),
							lastNode = node.previous ? getLastChild( node.previous ) : parent,
							lastDiv = lastNode.id in map ? map[ lastNode.id ].div : param.captionDiv;
						lastDiv.parentNode.insertBefore( div, lastDiv.nextSibling );
						parent.id != "root" && ( setLine( parent ), refreshIcon( parent ) );
						node.previous && rerenderChildren( node.previous );
					},
					// 在视图上添加多个节点
					appendAll: function( nodes ) {
						for( var i = 0, len = nodes.length; i < len; i++ ) this.append( nodes[i] );
					},
					// 从视图上删除一个节点
					remove: function( node ) {
						node == this.selectedNode && ( this.selectedNode = null );
						var div = map[ node.id ].div;
						delete map[ node.id ];
						_.gc( div );
						var children = node.getAllChildren( "bfs" );
						for( var i = 0, len = children.length; i < len; i++ ) this.remove( children[ i ] );
						if ( node.parent.id in map && !node.next ) {
							node.previous && ( setLine( node.previous ), rerenderChildren( node.previous ) )
							|| setLine( node.parent );
							refreshIcon( node.parent );
						}
					},
					expand: expand,
					collapse: collapse,
					lazyload: lazyload,
					setCheck: function( node, checked, hook ) {
						setCheck( "out", node, checked, hook );
					},
					refreshIcon: refreshIcon,
					selectNode: selectNode
				};
			};
			
			function Tree( param ) {
				var doc = param ? _.doc( param.parent ) : document;
				var frag = _.frag( doc ),
					vm = getViewManager( _.extend( param, {
						doc: doc,
						frag: frag,
						captionDiv: _.div( {
							innerHTML: param.caption || "",
							cssText: "font:12px Arial;color:#000",
							parent: frag
						} )
					} ) );
				_.extend( this, param, {
					vm: vm,
					root: new Node( vm, {
						id: "root",
						expanded: true
					} )
				} );
				param.parent && param.parent.appendChild( frag );
			}
			// Tree的原型
			Tree.prototype = {
				// 返回当前树的节点的构造器
				getNodeConstructor: function() {
					return _.bind( function( param ) {
						return new Node( this.vm, param );
					}, this );
				},
				// 返回当前树最底层的DOM对象
				getTree: function() {
					return this.frag;
				},
				// 设置树根。可取单个Node实例、Node实例集合、函数
				setRoot: function( node, hook, interval ) {
					this.root.append( node, hook, interval );
				},
				// 用指定的判别函数f过滤指定的节点
				getNodes: function( f ) {
					if ( f === undefined ) return _.unhash( this.vm.map, "value" );
					var m = this.vm.map, a = [];
					typeof f == "string" && ( f = _.pluck( f ) );
					for( var id in m ) f( m[ id ] ) && a.push( m[ id ] );
					return a;
				},
				selectNode: function( node ) {
					this.vm.selectNode( node );
				},
				// 获取当前选中的节点
				getSelectedNode: function() {
					return this.vm.selectedNode;
				},
				// 清除选中的节点
				clearSelectedNode: function() {
					var node = this.vm.selectedNode;
					if ( node && this.showSelectShadow !== false ) {
						node.div.lastChild.style.backgroundColor = "";
					}
					this.vm.selectedNode = null;
				}
			};
			return Tree;
		} )();
		
		
		// Sue-Menu的CSS样式
		var Menu = ( function() {
			var mouseoverBackgroundColor = "#CCC";
			var menuColor="#000";
			function Menu( param ) {
				// 菜单的根面板
				var root = Sue.ui.panel( {
						parent: document.body,
						rootCSSText: "display:none;position:absolute;border:solid 1px #aeb6ba;padding:5px;z-index:" + ( param.z || Sue.config[ "ui_menu_zindex" ] ),
						popup: true
					} ),
				items = param.items;
				root.root.style.backgroundColor = param.backgroundColor || "#FFF";
				mouseoverBackgroundColor = param.mouseoverBackgroundColor || "#CCC";
				if(param.menuColor!=null){
					menuColor=param.menuColor
				}
				items = _.$A( items );
				// items.selected作为哈希表，保存被选择的菜单项的索引
				items.selected = {};
				// 根据菜单项生成TDF
				var tdf = [];
				for( var i = 0; i < items.length; i++ ) {
					items[i] == "line"
					? tdf.push( "{[,3!font-size:12px;vertical-align:middle~<hr size=\"1\"/>]!height:1px}" )
					: tdf.push( _.format( "{[!font-size:12px;vertical-align:middle~%s][!font-size:12px;vertical-align:middle;padding:0px 3px;white-space:nowrap;word-break:keep-all;%s~%s][!font-size:12px;vertical-align:middle~%s]!height:20px}", items[i].selected === true && !param.noSelectFlag ? "<img />" : "", items[i].cssText || "", items[i].caption.replace( /\]/g, "\\]" ), items[i].sub ? "<img />" : "" ) );
				}
				tdf.push( "!border-collapse:collapse" );
				var table = _.table( tdf.join( "" ), root.content );
				// 定义成员
				_.extend( this, {
					root: root,
					table: table,
					items: items,
					param: param
				} );
				param.single && ( this.single = true );
				// 渲染视图、注册监听器
				for( var i = 0; i < items.length; i++ ) {
					if ( items[i] != "line" ) {
						items[i].sub && ( items[i].sub = new Menu( items[i].sub ).root, items[i].sub.prim = root );
						items[i].selected === true && ( items.selected[i] = true );
						render.call( this, i );
					}
				}
			};
			function render( i ) {
				var iconPath = Sue.config[ "ui_menu_icon_path" ],
					root = this.root, table = this.table, item = this.items[i],
					tr = table.tr( i ),
					selectedImg = table.td( i, 0 ).firstChild,
					subImg = table.td( i, 2 ).firstChild;
				selectedImg && ( selectedImg.src = _.format( "%s%s.gif", iconPath, item.disable ? "selected_disable" : "selected" ) );
				table.td( i, 1 ).style.color = item.disable ? "#555" :menuColor;
				subImg && ( subImg.src = _.format( "%s%s.gif", iconPath, item.disable ? "sub_disable" : "sub" ) );
				if ( item.disable ) {
					tr.style.cursor = "default";
					tr.style.backgroundColor = "";
					_.unbindEvent( tr, "mouseover,mouseout,click" );
				} else {
					tr.style.cursor = "pointer";
					_.bindEvent( tr, "mouseover", function() {
						tr.style.backgroundColor = mouseoverBackgroundColor;
						if ( root.sub !== item.sub ) {
							var sub = root.sub;
							while( sub ) {
								sub.hide();
								sub = sub.sub;
							}
							root.sub = null;
							item.sub && ( tr.displaySub = window.setTimeout( function() {
								( root.sub = item.sub ).show();
								var x = _.xy( root.root ).x + root.root.clientWidth,
									y = _.xy( tr ).y;
								// 避免越过页面边界
								if ( x + item.sub.root.clientWidth > document.body.clientWidth ) {
									x = _.xy( root.root ).x - item.sub.root.clientWidth;
								}
								if ( y + item.sub.root.clientHeight > document.body.clientHeight ) {
									y -= item.sub.root.clientHeight;
								}
								_.copyStyle( item.sub.root, "left,top", [ x + "px", y + "px" ] );
							}, 500 ) );
						}
					} );
					_.bindEvent( tr, "mouseout", function() {
						tr.style.backgroundColor = "";
						item.sub && window.clearTimeout( tr.displaySub );
					} );
					item.sub || ( _.bindEvent( tr, "click", _.bind( function() {
						var prim = root;
						do {
							prim.hide();
						} while( prim = prim.prim );
						if ( this.single && (!this.param.asynchronism)) {
							for( var p in this.items.selected ) {
								this.select( +p, false );
								this.disable( +p, false );
							}
							this.select( i, true );
							this.disable( i, true );
						} else {
							"selected" in item && ( this.select( i, !item.selected ) );
						}
						if ( typeof item.click == "function" ) {
							if ( "selected" in item ) item.click( i, item.selected );
							else item.click( i );
						}
					}, this ) ) );
				}
			};
			// Menu原型
			Menu.prototype = {
				disable: function( i, disable ) {
					var item = this.items[i];
					if ( item.disable != disable ) {
						item.disable = disable;
						render.call( this, i );
					}
					return this;
				},
				select: function( i, slt ) {
					var param = this.param;
					var item = this.items[i],
						td = this.table.td( i, 0 );
					if ( item.selected !== slt ) {
						item.selected = slt;
						if ( slt ) {
							this.items.selected[i] = true;
							param.noSelectFlag || ( td.innerHTML = _.format( "<img src='%s%s.gif'/>", Sue.config[ "ui_menu_icon_path" ], item.disable ? "selected_disable" : "selected" ) );
						} else if ( !slt && td.firstChild ) {
							delete this.items.selected[i];
							td.firstChild && _.gc( td.firstChild );
						}
					}
					return this;
				},
				getSelectedItems: function() {
					var items = this.items,
						selected = items.selected,
						a = [];
					for( var p in selected ) {
						a.push( items[p] );
					}
					return a;
				},
				clearItems:function(){	
					for(var i=this.items.length-1;i>=0;i--){
						this.items.pop(i);
					}
					for(var i=this.table.table.rows.length-1;i>=0;i--){
						this.table.table.deleteRow(i);
					}
				},
				reloadItems:function(items){
					// 渲染视图、注册监听器
				  for( var i = 0; i < items.length; i++ ) {
					var newRow=this.table.table.insertRow();
					newRow.style.height="20px";
					var newCell0 = newRow.insertCell(); //创建新单元格
					var newCell1 = newRow.insertCell(); //创建新单元格
					var newCell2 = newRow.insertCell(); //创建新单元格
					newCell1.innerText=items[i].caption;
					newCell1.style.fontSize="12px";
					if ( items[i] != "line" ) {
						items[i].sub && ( items[i].sub = new Menu( items[i].sub ).root, items[i].sub.prim = root );
						items[i].selected === true && ( items.selected[i] = true );
						render.call( this, i );
					}
				}
					
				}
			};
			return Menu;
		} )();
		
		var MenuBar = ( function() {
			function MenuBar( param ) {
				var model = param.model || [],
					ul = _.crt( "ul", null, param.parent, "position:absolute;width:100%;border-bottom:solid 1px #CCC;background-color:#FFF;font-size:12px;color:#0063AB;padding:4px 0px;margin:0px" ),
					state = {};
				ul.style.backgroundImage = _.format( "url(%sbg.gif)", Sue.config[ "ui_menubar_icon_path" ] );
				ul.style.zIndex = param.z || Sue.config[ "ui_menubar_zindex" ];
				param.fontColor && ( ul.style.color = param.fontColor );
				_.extend( this, {
					model: model,
					ul: ul,
					state: state
				} );
				this.lis = _.map( model, _.bind( render, this ) );
			};
			function render( item, i ) {
				var ul = this.ul, state = this.state,
					li = _.crt( "li", {
						innerHTML: item.caption
					}, null, "display:inline;padding:3px 10px;cursor:hand" ),
					mouseover = _.bindEvent( li, "mouseover", function() {
						li.style.backgroundColor = "#FFF";
						li.style.border = "solid 1px #aeb6ba";
						li.style.borderBottom = "none";
						var f = state.last && li != state.last.li ? state.last.mouseout : null;
						state.last = {
							li: li,
							mouseout: mouseout
						};
						f && f();
						state.showMenu && click();
					} ),
					mouseout = _.bindEvent( li, "mouseout", function() {
						if ( !state.showMenu ) {
							li.style.backgroundColor = "";
							li.style.border = "none";
							state.last = null;
						} else if ( state.last && li != state.last.li ) {
							li.style.backgroundColor = "";
							li.style.border = "none";
							hide();
						}
					} ),
					click = _.bindEvent( li, "click", function() {
						state.showMenu = true;
						item.menu.root.root.style.borderTop = "none";
						var xy = _.xy( li );
						_.copyStyle( item.menu.root.root, "left,top", [ xy.x + "px", xy.y + li.offsetHeight + "px" ] );
						item.menu.root.show();
					} );
				// 若没有提供menu属性，则必须提供一个click属性，表示单击菜单项要执行的动作，这样可以不出现菜单
				// 我们不需要真的要有一个菜单，至少像菜单就行了。Duck Typing
				item.menu = item.menu
				? Sue.ui.menu( item.menu )
				: {
					root: {
						root: {
							style: {}
						},
						show: function() {
							item.click( {
								panel: item.menu,
								li: li
							} );
						},
						hide: _.Z
					}
				};
				var hide = item.menu.root.hide;
				item.menu.root.hide = _.link( hide, function() {
					li.style.backgroundColor = "";
					li.style.border = "none";
					state.showMenu = false;
					state.last = null;
				} );
				i > 0 && ul.childNodes[i] ? ul.insertBefore( li, ul.childNodes[i] ) : ul.appendChild( li );
				return li;
			}
			MenuBar.prototype = {
				insert: function( i, modelItems ) {
					i = Math.max( Math.min( i, this.model.length ), 0 );
					modelItems = _.$A( modelItems );
					[].splice.apply( this.model, [ i, 0 ].concat( modelItems ) );
					[].splice.apply( this.lis, [ i, 0 ].concat( _.map( modelItems, _.bind( _.rcurry( render )( i ), this ) ) ) );
				},
				append: function( modelItems ) {
					this.insert( this.model.length, modelItems );
				}
			};
			return MenuBar;
		} )();
		
		var List = ( function() {
			function List( param ) {
				var root = _.div( {
						parent: param.parent,
						cssText: "table-layout:fixed;border:solid 1px #CCC;font-size:12px;color:#000;width:140px;height:200px;overflow-x:hidden;overflow-y:auto"
					} ),
					items = param.items || [],
					selected = {},
					map = {};
				param.rootStyle && _.extend( root.style, param.rootStyle );
				_.extend( this, {
					root: root,
					items: items,
					selected: selected,
					single: !!param.single,
					hooks: param.hooks ? _.$A( param.hooks ) : null,
					map: map,
					$0: null,
					$1: null
				} );
				root.appendChild( render.call( this, items ) );
			};
			function render( items ) {
				items = _.$A( items );
				var frag = _.frag(),
					map = this.map;
				for( var i = 0, len = items.length; i < len; i++ ) {
					map[ items[i].uuid = items[i].uuid || _.uuid() ] = bind.call( this, items[i], _.div( {
						parent: frag,
						title: items[i].caption,
						innerHTML: items[i].caption,
						cssText: "width:1000px;padding:1px 5px;cursor:hand;text-align:left"
					} ) );
				}
				return frag;
			};
			function bind( item, div ) {
				var map = this.map,
					_this = this,
					f = function( item ) {
						if ( map[ item.uuid ].style.display == "none" ) return;
						_this.selected[ item.uuid ] = item;
						map[ item.uuid ].style.backgroundColor = "#CCC";
					};
				_.disableSelect( div );
				_.unbindEvent( div, "click" );
				_.bindEvent( div, "click", function( e ) {
					var selected = _this.selected;
					if ( _this.single ) {
						for( var p in selected ) map[p].style.backgroundColor = "#FFF";
						selected = _this.selected = {};
						f( item );
					} else if ( !e.shiftKey || _this.$0 == null ) {
						if ( !e.ctrlKey ) {
							for( var p in selected ) map[p].style.backgroundColor = "#FFF";
							selected = _this.selected = {};
						}
						_this.$0 = item.uuid;
						_this.$1 = null;
						f( item );
					} else {
						_this.$1 = item.uuid;
						for( var p in selected ) map[p].style.backgroundColor = "#FFF";
						selected = _.mixin( _this.selected, selected, "$0,$1" );
						var items = _this.items,
							select = false;
						for( var i = 0, len = items.length; i < len; i++ ) {
							if ( items[i].uuid == _this.$0 || items[i].uuid == _this.$1 ) {
								select = !select;
								f( items[i] );
							}
							select && f( items[i] );
						}
					}
				} );
				if ( this.hooks ) {
					_.unbindEvent( div, _.map( this.hooks, "type" ).join( "," ) );
					_.map( this.hooks, function( hook ) {
						_.bindEvent( div, hook.type, _.bind( hook.hook, div, item ) );
					} );
				}
				return div;
			};
			List.prototype = {
				getItems: function( f, n ) {
					var items = this.items, c = 0, a = [];
					n = n || Infinity;
					for( var i = 0, len = items.length; i < len; i++ ) {
						f( items[i] ) && ( a.push( items[i] ), c++ );
						if ( c >= n ) break;
					}
					return a;
				},
				getSelectedItems: function() {
					var selected = this.selected;
					return _.collect( this.items, function( item ) { return selected[ item.uuid ]; } );
				},
				insert: function( items, i ) {
					items = _.$A( items );
					i < this.items.length - 1 ? [].splice.apply( this.items, [ i, 0 ].concat( items ) ) : [].push.apply( this.items, items );
					var root = this.root,
						frag = render.call( this, items );
					i > 0 && root.childNodes[i] ? root.insertBefore( frag, root.childNodes[i] ) : root.appendChild( frag );
				},
				remove: function( items ) {
					items = _.$A( items );
					var map = this.map,
						selected = this.selected,
						item;
					while( items.length ) {
						item = items[0];
						item.uuid in selected && delete selected[ item.uuid ];
						_.gc( map[ item.uuid ] );
						delete map[ item.uuid ];
						items.shift();
						this.items === items || [].splice.call( this.items, _.indexOf( this.items, item ), 1 );
					}
				},
				disable: function( items ) {
					var selected = this.selected, map = this.map;
					_.copyStyle( _.map( _.$A( items ), function( item ) {
						delete selected[ item.uuid ];
						return _.unbindEvent( map[ item.uuid ] );
					} ), "backgroundColor,color,cursor", [ "#FFF", "#CCC", "auto" ] );
				},
				enable: function( items ) {
					var _this = this, map = this.map;
					_.copyStyle( _.map( _.$A( items ), function( item ) {
						return bind.call( _this, item, map[ item.uuid ] );
					} ), "color,cursor", [ "#000", "hand" ] );
				},
				swap: function( item1, item2 ) {
					var items = this.items;
					var index1 = _.indexOf(items, item1),
						index2 = _.indexOf(items, item2);
					items[index2] = item1;
					items[index1] = item2;
					var map = this.map;
					var div1 = map[ item1.uuid ],
						div2 = map[ item2.uuid ];
					var temp = div1.title;
					div1.title = div1.innerHTML = div2.title;
					div2.title = div2.innerHTML = temp;
					map[ item1.uuid ] = div2;
					map[ item2.uuid ] = div1;
					div2.style.backgroundColor = item1.uuid in this.selected ? "#CCC" : "#FFF"
					div1.style.backgroundColor = item2.uuid in this.selected ? "#CCC" : "#FFF"
					bind.call( this, item1, div2 );
					bind.call( this, item2, div1 );
				}
			};
			return List;
		} )();
		
		var AbstractBtn = ( function() {
			function AbstractBtn( param ) {
				var span = _.crt( "span", null, param.parent, "cursor:default;" + ( param.cssText || "" ) ),
					table = _.table( _.format( "A|[!width:4px;padding:0px]|@{?A[!padding:2px 10px 0px 10px;color:#003f6d;font-size:12px~%s]?A}!height:21px;border:none;border-collapse:collapse;padding:0px;display:inline;margin-bottom:-3px", param.caption ), span );
				var f = _.curry( table.td )( 0 ),
					g = _.curry( setBackground )( Sue.config.cs.name, f( 0 ), f( 1 ), f( 2 ) ),
					h = function( n ) {
						return function() {
							span.disabled || g( n );
						}
					};
				g( "normal" );
				param.properties && _.extend( span, param.properties );
				_.extend( this, {
					span: span,
					h: h
				} );
			}
			function setBackground( colorSuffix, left, middle, right, bg ) {
				left.style.backgroundImage = _.format( "url(%s%s_left_%s.gif)", Sue.config[ "ui_button_icon_path" ], bg, colorSuffix );
				middle.style.backgroundImage = _.format( "url(%s%s_middle_%s.gif)", Sue.config[ "ui_button_icon_path" ], bg, colorSuffix );
				right.style.backgroundImage = _.format( "url(%s%s_right_%s.gif)", Sue.config[ "ui_button_icon_path" ], bg, colorSuffix );
			};
			return AbstractBtn;
		} )();
		
		// 普通按钮
		function SimpleBtn( param ) {
			var _super = _.extend( this, new AbstractBtn( param ) ),
				span = _super.span,
				h = _super.h;
			if(param.id!=null && param.id!=""){
				span.id=param.id;
			}		
			_.bindEvent( span, "mouseover,mouseup", h( "mouseover" ) );
			_.bindEvent( span, "mouseout", h( "normal" ) );
			_.bindEvent( span, "mousedown", h( "mousedown" ) );
			param.click && _.bindEvent( span, "click", function() {
				span.disabled || param.click.apply( param, _.$A( arguments ) );
			} );
		}
		
		// 开关式按钮。点击即处于按下状态
		function SwitchBtn( param ) {
			var _super = _.extend( this, new AbstractBtn( param ) ),
				span = _super.span,
				h = _super.h;
			span.pressed = false;
			_.bindEvent( span, "mouseover", function() {
				span.pressed || h( "mouseover" )();
			} );
			_.bindEvent( span, "mouseout", function() {
				span.pressed || h( "normal" )();
			} );
			param.click && _.bindEvent( span, "click", function( e ) {
				if ( span.disabled ) return;
				span.pressed = !span.pressed;
				if( span.pressed ) {
					h( "mousedown" )();	
				} else {
					h( "normal" )();
				}
				param.click.apply( param, _.$A( arguments ) );
			} );
		}
		SwitchBtn.prototype = {
			press: function() {
				if ( this.span.pressed || this.span.disabled ) return;
				var click = _.extractEvent( this.span, "click" );
				click && click();
			},
			release: function() {
				if ( !this.span.pressed || this.span.disabled ) return;
				this.span.pressed = false;
				this.h( "normal" )();
			}
		};
		
		var Table = ( function() {
			function Table( param ) {
				var DEFAULT_HEAD_TR_CSSTEXT = _.format( "background-image:url(%s);height:21px;font-size:12px", Sue.config[ "ui_table_icon_path" ] + "default_head_bg.gif" ),
					DEFAULT_HEAD_TD_CSSTEXT = "border:solid 1px #FFF;text-align:center;color:#5B5C5F;padding-top:2px;white-space:no-wrap;word-break:keep-all",
					DEFAULT_ODD_TR_CSSTEXT = "height:21px;background-color:#FFF",
					DEFAULT_EVEN_TR_CESSTEXT = "height:21px;background-color:" + ( Sue.config.cs[3] || "#EAF2F8" ),
					DEFAULT_BODY_TD_CSSTEXT = "text-align:left;padding-left:15px;padding-right:10px;vertical-align:middle;border:solid 1px #D4D4D4;";
				var frag = _.frag(),
					container = frag;
				// 设定命令工具条 & 滚动区
				var b1 = "command" in param,
					b2 = "scroll" in param;
				if ( b1 || b2 ) {
					var rt = _.table( ( b1 ? _.format( "{[!height:27px;padding:0px;vertical-align:middle;background-image:url(%scommand_bg_%s.gif);border:solid 1px %s;border-bottom:none]}", Sue.config[ "ui_table_icon_path" ], Sue.config.cs.name, Sue.config.cs[4] || "#8DB2D3" ) : "" ) + "{[!padding:0px]}!border-collapse:collapse;table-layout:fixed;cursor:default;font-size:12px;" + ( param.rootCSSText || "" ), frag );
					container = rt.td( +b1, 0 );
					if ( b1 ) {
						var comTD = rt.td( 0, 0 );
						_.map( _.$A( param.command ), function( command ) {
							var image=command.icon && _.crt( "img", { src: command.icon }, comTD, "margin-left:5px" );
							if( image ) image.align="absmiddle";
							var a = _.crt( "a", {
								innerHTML: command.caption
							}, comTD, _.format( "color:%s;text-decoration:none;margin:0px 1px 1px %spx;font-size:12px;cursor:pointer", Sue.config.cs[5] || "#0062AB", command.icon ? 1 : 1 ) );
							_.bindEvent( a, "mouseover", function() {
								this.style.textDecoration = "underline";
							} );
							_.bindEvent( a, "mouseout", function() {
								this.style.textDecoration = "none";
							} );
							_.bindEvent( a, "click", command.execute );
						} );
					}
					if ( b2 ) {
						var scr = param.scroll;
						container = _.div( {
							parent: container,
							cssText: _.format( "overflow:auto;width:%s;height:%s", scr.width ? scr.width + "px" : "100%", scr.height ? scr.height + "px" : "100%" )
						} );
					}
				}
				// 设定表头TDF
				var headTDF = [],
					d = param.head,
					di, css, caption, colCSS = [];
				if ( d instanceof Array ) {
					for( var i = 0, len = d.length; i < len; i++ ) {
						di = d[i];
						css = ( di.cssText || DEFAULT_HEAD_TD_CSSTEXT ) + ( di.width ? ";width:" + di.width : "" );
						caption = di.caption ? "~" + esc( di.caption, "@{}[]?*!~" ) : "";
						headTDF.push( _.format( "[!%s%s]", css, caption ) );
						//添加逻辑,如果是数值则右对齐,其它左对齐
						if(param.colType) {
							//number:数值 string:文本 date: 日期
							if(param.colType[d[i].caption] == "number") {
								colCSS.push("text-align:right;");
							} else {
								colCSS.push("");
							}
						}
					}
					headTDF.push( "!", d.cssText || DEFAULT_HEAD_TR_CSSTEXT, "}" );
					headTDF.unshift( "{" );
				}
				
				// 设定表体TDF
				var bodyTDF = [],
					rowTDF = [],
					o;
				d = param.data;
				
				if ( d instanceof Array ) {
					for( var i = 0, len = d.length; i < len; i++ ) {
						di = d[i];
						rowTDF.push( "{" );
						for( var j = 0, len2 = di.length; j < len2; j++ ) {
							o = di[j];
							if ( typeof o == "string" ) {
								caption = o;
							} else if ( o && typeof o == "object" ) {
								caption = o.caption || ( o + "" );
							} else {
								caption = o + "";
							}
							rowTDF.push( _.format( "[!%s%s]", DEFAULT_BODY_TD_CSSTEXT + ( param.cellCSSText || "" ) + ( colCSS && (";" + colCSS[j])), caption.length ? "~" + esc( caption, "@{}[]?*!~" ) : "" ) );
						}
						
						rowTDF.push( "!", i & 1 ? param.oddTRCSSText || DEFAULT_ODD_TR_CSSTEXT : param.evenTRCSSText || DEFAULT_EVEN_TR_CESSTEXT, "}" );
						bodyTDF.push( rowTDF.join( "" ) );
						rowTDF = [];
					}
				}
				// 用TDF生成表格
				var tableCSSText = _.format( "!border-collapse:collapse;border:solid 1px %s;width:100%;font-size:12px;cursor:default;", Sue.config.cs[4] || "#8DB2D3" ) + ( param.cssText || "" );
				var tdf = headTDF.join( "" ) + bodyTDF.join( "" ) + tableCSSText,
					table = _.table( tdf, container );
				var _this = _.extend( this, {
					table: table,
					param: param
				} );
				// 设定表头事件绑定
				d = param.head;
				if ( d instanceof Array ) {
					for( var i = 0, len = d.length; i < len; i++ ) {
						if ( d[i].hook ) {
							_.map( _.$A( d[i].hook ), function( h ) {
								var td = table.td( 0, i );
								h.type
									? _.bindEvent( td, h.type, _.bind( h.callback, td, d[i], _this ) )
									: h.callback.call( td, d[i] );
							} );
						}
					}
				}
				d = param.data;
				// 设定行选择事件
				if ( param.rowSelectable && d instanceof Array ) {
					var flagMap = {};
					for( var i = 0, len = d.length; i < len; i++ ) {
						var tr = table.tr( i + 1 );
						tr.flagIndex = i;
						flagMap[i] = tr;
						_.bindEvent( tr, "click", _.bind( rowSelect, tr, this ) );
					}
					_.extend( this, {
						selectedRow: [],
						selectedRowData: [],
						flag: undefined,
						flagMap: flagMap
					} );
				}
				
				rt && ( this.commandTable = rt );
				// 调用渲染器
				render.call( this, param, param.renderer );
				param.parent && param.parent.appendChild( frag );
			}
			function esc( s, cs ) {
				return s.replace( new RegExp( _.map( cs.split( "" ), function( c ) { return "\\" + c; } ).join( "|" ), "g" ), function( s ) {
					return "\\" + s;
				} );
			}
			function render( param, rs ) {
				rs = rs && _.$A( rs );
				if ( !( rs instanceof Array ) ) return;
				for( var i = 0, len = rs.length; i < len; i++ ) {
					var r = rs[i];
					if ( "row" in r ) {
						rowRender.call( this, r, param );
					} else if ( "col" in r ) {
						colRender.call( this, r, param );
					}
				}
			}
			// 行渲染器（按tr渲染）
			function rowRender( r, param ) {
				var table = this.table;
				var data = param.data;
				var row;
				if ( r.row == "*" ) {
					row = _.range( 0, data.length );
				} else if ( typeof r.row == "number" ) {
					row = [ r.row ];
				} else {
					row = r.row.split( "," );
				}
				var type = r.type ? r.type.split( "," ) : null;
				for( var i = 0, len = row.length; i < len; i++ ) {
					// 第0行是表格列头
					var tr = table.tr( row[i] + 1 );
					if ( !type ) {
						r.render( {
							tr: tr,
							value: data[ row[i] ],
							data: data,
							row: +row[i]
						} );
					} else {
						for( var t = 0; t < type.length; t++ ) {
							_.bindEvent( tr, type[t], _.bind( r.render, this, {
								tr: tr,
								value: data[ row[i] ],
								data: data,
								row: +row[i]
							} ) );
						}
					}
				}
			}
			// 列渲染器（按td渲染）
			function colRender( r, param ) {
				var table = this.table;
				var head = param.head;
				var data = param.data;
				var col;
				if ( typeof r.col == "number" ) {
					col = [ r.col ];
				} else if ( r.col == "*" ) {
					col = _.range( 0, head.length );
				} else {
					col = r.col.split( "," );
				}
				var type = r.type ? r.type.split( "," ) : null;
				for( var c = 0; c < col.length; c++ ) {
					for( var row = 0; row < data.length; row++ ) {
						// 第0行是表格列头
						var td = table.td( row + 1, col[c] );
						if ( !type ) {
							r.render( {
								td: td,
								value: data[row][ col[c] ],
								data: data,
								row: row,
								col: +col[c]
							} );
						} else {
							for( var t = 0; t < type.length; t++ ) {
								_.bindEvent( td, type[t], _.bind( r.render, this, {
									td: td,
									value: data[row][ col[c] ],
									data: data,
									row: row,
									col: +col[c]
								} ) );
							}
						}
					}
				}
			}
			function rowSelect( table, e ) {
				var tr = this;
				if ( table.param.multipleSelect == true ) {
					if ( !e || (!e.ctrlKey && !e.shiftKey) ) {
						singleSelect();
					} else if ( e.ctrlKey ) {
						if ( selected( tr ) ) return;
						table.selectedRow.push( tr );
						tr.bgcolor = tr.style.backgroundColor;
						tr.style.backgroundColor = "#FFDDB2";
						table.selectedRowData.push( table.param.data[ tr.flagIndex ] );
						table.flag = tr.flagIndex;
					} else {
						if ( table.flag <= tr.flagIndex ) {
							var minIndex = table.flag + 1,
								maxIndex = tr.flagIndex + 1;
						} else {
							var minIndex = tr.flagIndex,
								maxIndex = table.flag;
						}
						_.map( _.range( minIndex, maxIndex ), function( index ) {
							var row = table.flagMap[index];
							if ( selected( row ) ) return;
							row.bgcolor = row.style.backgroundColor;
							row.style.backgroundColor = "#FFDDB2";
							table.selectedRow.push( row );
							table.selectedRowData.push( table.param.data[index] );
						} );
					}
				} else {
					singleSelect();
				}
				function singleSelect() {
					_.map( table.selectedRow, function( row ) {
						row.style.backgroundColor = row.bgcolor;
					} );
					table.selectedRow = [ tr ];
					tr.bgcolor = tr.style.backgroundColor;
					tr.style.backgroundColor = "#FFDDB2";
					table.selectedRowData = [ table.param.data[ tr.flagIndex ] ];
					table.flag = tr.flagIndex;
				}
				function selected( row ) {
					return _.indexOf( table.selectedRow, row ) != -1;
				}
			}
			Table.prototype = {
				// 运行期渲染。使用方法同构造器渲染器用法
				render: function( rs ) {
					render.call( this, this.param, rs );
				},
				// 获取选择行指定索引列的内容
				getSelectedCellContent: function( index ) {
					if ( !this.selectedRow || !this.selectedRow.length ) return null;
					var td = this.selectedRow[0].childNodes[index];
					return td.innerText || td.textContent;
				},
				// 获取选中行的数据
				getSelectedRowData: function() {
					return this.selectedRowData;
				}
			};
			return Table;
		} )();
		
		_.css( ".sue_lazytable {border-collapse:collapse;font-size:12px}" );
		_.css( ".sue_lazytable tr {height:21px}" );
		_.css( ".sue_lazytable td {padding:0px 15px;vertical-align:middle;border:solid 1px #D4D4D4}" );
		var LazyTable = ( function() {
 			function LazyTable( param ) {
				var viewport = param.viewport;
				if ( !viewport || !viewport.style.height ) {
					throw new Error( "SueError: 惰性列表的Viewport与其高度必须配置。" );
				}
				_.extend( viewport.style, {
					overflow: "auto",
					padding: "0px"
				} );
				viewport.style.overflow = "auto";
				var head = param.head,
					data = param.data;
				var rowCount = param.data.length,
					colCount = param.head.length;
				// 取行列数的二进制表示，以进行倍增的串组装
				var rowBin = ( rowCount ).toString( 2 ),
					colBin = ( colCount ).toString( 2 );
				var tableHTML = "<table class='sue_lazytable'>" + getHeadHTML( head ) + getBigStr( [ "<tr>" + getBigStr( [ "<td></td>" ], colBin ) + "</tr>" ], rowBin ) + "</table>";
				viewport.innerHTML = tableHTML;
				var timer;
				var loadMap = {};
				var color = Sue.config.cs[3] || "#EAF2F8";
				_.bindEvent( viewport, "scroll", function() {
					timer && window.clearTimeout( timer );
					timer = window.setTimeout( function() {
						var tbody = viewport.firstChild.firstChild;
						var begin = Math.floor( rowCount * viewport.scrollTop / viewport.scrollHeight );
						var rows = Math.ceil( viewport.clientHeight / 21 ); // 21是表格默认行高
						var i = 0;
						var tr = tbody.children[ begin + 1 ]; // 1表示不计算表头行
						while( i < rows ) {
							var row = begin + i;
							var rowData = data[ row ];
							if ( !loadMap[ row ] && rowData ) {
								tr.style.backgroundColor = row & 1 ? "#FFF" : color;
								var td = tr.firstChild;
								var j = 0,
									len = rowData.length;
								while( j < len ) {
									td.innerHTML = rowData[j];
									td = td.nextSibling; // nextSibling比children[index]性能更优
									j++;
								}
								loadMap[ row ] = 1;
							}
							tr = tr.nextSibling;
							i++;
						};
					}, 200 );
				} )();
			}
			LazyTable.prototype = {
				
			};
			function getBigStr( initArray, binStr ) {
				for( var i = 1; i < binStr.length; i++ ) {
					initArray.push( initArray[ i - 1 ] + initArray[ i - 1 ] );
				}
				var big = [];
				for( var i = 0; i < binStr.length; i++ ) {
					if ( +binStr.charAt( binStr.length - i - 1 ) ) {
						big.push( initArray[i] );
					}
				}
				return big.join( "" );
			}
			function getHeadHTML( head ) {
				return "<tr style='background-image:url(" + Sue.config[ "ui_table_icon_path" ] + "default_head_bg.gif" + ");height:21px;font-size:12px'>" +
					_.map( head, function( h ) {
						return "<td style='border:solid 1px #FFF;text-align:center;color:#5B5C5F;padding:2px 15px 0px;white-space:no-wrap;word-break:keep-all'>" + h.caption + "</td>";
					} ).join( "" ) + "</tr>";
			}
			return LazyTable;
		} )();
						
		return {
			/**
			 * param {
			 * 		parent: (DOM Element) 父元素
			 * 		rootCSSText: (string) 根面板CSS样式
			 * 		contentCSSText: (string)  内容面板CSS样式
			 * 		className: (string) 内容面板CSS
			 * 		scale: (object) 面板支持可伸缩 {
			 * 			minWidth/maxWidth/minHeight/maxHeight: (number)单位px
			 * 			direction: (string) nw/n/ne/w/e/sw/s/se，默认为全选
			 * 			hook: (function) 完成伸缩调整后执行的钩子，传入一个根面板参数
			 * 		}
			 * 		popup: (boolean/object) {
			 * 			z: 覆盖层的z坐标
			 * 			rgb: 覆盖层的颜色
			 * 			opacity: 覆盖层的alpha值
			 * 		}
			 * 		dragable: (boolean) 是否支持鼠标拖动
			 * }
			 */
			panel: function( param ) {
				return new Panel( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		caption: (string) 树文本
			 * 		getIcon: (function) 这个方法应传入一个节点对象作为参数，返回该节点对象对应的图标路径（图片文件路径）
			 * 		showSelectShadow: (boolean) 是否显示点击阴影。默认显示
			 * }
			 */
			tree: function( param ) {
				return new Tree( param );
			},
			/**
			 * param = {
			 * 		z: (number) 菜单位置的层次，默认为50
			 * 		single: (boolean) 若该菜单用作单项选择，设置为true
			 * 		backgroundColor: (#RRGGBB) 背景色值
			 * 		mouseoverBackgroundColor: (#RRGGBB) mouseover时底色色值
			 *      asynchronism:是否动态加载菜单
			 *		noSelectFlag: (boolean) 若为true，则不显示选择后的对勾
			 * 		items: (array) 菜单项 {
			 * 			caption: (string) 文本
			 * 			cssText: (string) 用于控制菜单文本显示的CSS
			 * 			selected: (boolean) 是否被选择
			 * 			disable: (boolean) 是否被禁用
			 * 			sub: (param) 子菜单。设置为子菜单的param引用
			 * 			click: (function) 鼠标单击钩子
			 * 		}
			 * }
			 */
			menu: function( param ) {
				return new Menu( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		fontColor: (#RRGGBB) 字体颜色
			 * 		z: (N+) 菜单高度
			 * 		model: (array) 菜单条的模型 {
			 * 			caption: (string) 文本
			 * 			menu: (Sue.ui.menu) 菜单
			 * 		}
			 * }
			 */
			menubar: function( param ) {
				return new MenuBar( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		rootStyle: (object) 根元素样式
			 * 		single: (boolean) 单选
			 * 		hooks: (array) 事件处理钩子 [
			 * 			{
			 * 				type: "click",
			 * 				hook: function(item) {
			 * 					...(handle code)
			 * 				}
			 * 			}
			 * 			...
			 * 		]
			 * 		items: (array) 条目数组 {
			 * 			caption: (string) 文本
			 * 		}
			 * }
			 */
			list: function( param ) {
				return new List( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		type: (string) 按钮的类型：普通按钮（simple）、开关式按钮（switch），默认普通按钮
			 * 		cssText: (string) 直接设置给button根容器的css
			 * 		caption: (string) 表面文字
			 * 		click: (function) 点击执行的回调
			 * 		properties: (object) 绑定到按钮上的属性
			 * }
			 */
			button: function( param ) {
				return new ( param.type == "switch" ? SwitchBtn : SimpleBtn )( param );
			},
			/**
			 * 序时簿数据表格。由于人机人员已经对表格样式作了明确的说明，故表格的CSS默认采取人机规定的样式渲染。但是考虑到未来可能
			 * 出现的需求和人机方案的变更，仍然保留开发者自定义CSS的接口
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		cssText: (string) 表格的cssText
			 * 		rootCSSText: (string) 根元素的cssText（仅在定义了命令工具条或者滚动区时才有效，未定义以上两者直接使用表格cssText）
			 * 		cellCSSText: (string) 单元格cssText
			 * 		scroll: {                          --> 此对象用于控制表格的滚动条
			 * 			width: (number)                --> 滚动区宽度，单位px
			 * 			height: (number)               --> 滚动区高度，单位px
			 * 		}
			 * 		command: (array) 命令工具条 [
			 * 			......
			 * 			{
			 * 				caption: (string) 显示的命令文本
			 * 				icon: (string) 图标路径
			 * 				execute: function() {                   --> 执行的命令
			 * 					......(handle code)
			 * 				}
			 * 			}
			 * 			......
			 * 		]
			 * 		head: (array) 表头信息 [
			 * 			......
			 * 			{
			 * 				caption: (string) 显示的表头文本
			 * 				cssText: (string) 自定义表头td的cssText
			 * 				width: (number || percent) 为了使用方便，用此属性定义表头的宽度。此属性设置优先于cssText中的定义
			 * 				hook: [
			 * 					......
			 * 					{
			 * 						type: "click",
			 * 						callback: function( param ) {
			 * 							(handle code)
			 * 						}
			 * 					},
			 * 					......
			 * 				]
			 * 			}
			 * 			......
			 * 			cssText: (string) 自定义表头tr的cssText
			 * 		]
			 * 		data: (array^2) 二维数组，用于存储数据 [
			 * 			......
			 * 			[
			 * 				"Casey Lai",                                --> 字符串表示不需要渲染器，且实际值就是字面值
			 * 				{                                           --> 也可以采取对象的形式
			 * 					caption: "Casey Lai",                   --> caption属性表示字面值。若不设置该属性，则序列化为字符串当作字面值
			 * 					value: "Casey Lai: Kingdee 2008/9/11"   --> value属性表示实际值（也可以不写，将自动用字面值代替）
			 * 				},
			 * 				123                                         --> 不同于以上两种类型的其它类型（数字、日期等），序列化为字符串当作字面值
			 * 			],
			 * 			......
			 * 		]
			 * 		renderer: (array) 渲染器组 [
			 * 			......
			 * 			{
			 * 				col: "0,2,3,5",                        --> 指定作用的列，逗号分隔。单独的星号表示全部列。也可直接以数字表示单独的列
			 * 				type: "click,focus",                   --> 触发渲染的事件名。特别的，若不定义事件名，则该渲染器渲染效果不需要事件触发即能呈现
			 * 				render: function( param ) {            --> param = {td:要渲染的td, value:单元格对应的数据, row:行索引, col:列索引}
			 * 					......(handle code)
			 * 				}
			 * 			}
			 * 			......
			 * 		]
			 * 		oddTRCSSText: (string) 奇数行tr使用的cssText
			 * 		evenTRCSSText: (string) 偶数行tr使用的cssText
			 * 		rowSelectable: (boolean) 是否允许行选择
			 * 		multipleSelect: (boolean) 是否允许多行选择
			 * }
			 */
			table: function( param ) {
				return new Table( param );
			},
			/**
			 * 惰性列表用于加载大数据量表格，大数据量通过行列数乘积界定。一般的，2000以上可以认为是大数据量。
			 * param = {
			 * 		viewport: (DIV DOM) 表格的显示区域，亦是容器。该属性必须设定，且必须明确设定style.height属性。
			 * 		head: (array) 表头数组
			 * 		data: (array^2) 数据二维数组
			 * }
			 */
			lazyTable: function( param ) {
				return new LazyTable( param );
			}
		};
	} )( Sue.util );
	
	// 扩展组件
	Sue.ui.ext = ( function( _ ) {
		
		function SelectableLabel( param ) {
			// 生成组件结构
			var root = _.div( {
				cssText: "display:inline;font:12px Arial;white-space:nowrap;break-all:keep-all",
				parent: param.parent || null
			} ),
				caption = _.div( {
				cssText: "display:inline;padding:5px 0px",
				innerHTML: param.caption || "",
				parent: root
			} ),
				valueCaption = _.div( {
				cssText: "display:inline;border:solid 1px #FFF;padding:4px 3px 0px 3px;" +
					(param.disableClick ? "" : "text-decoration:underline;cursor:pointer"),
				innerHTML: "<div style=\"display:inline\">" + ( param.valueCaption || "" ) + 
					(param.disableClick ? "" : "</div><div style='display:inline;font-size: 10px'>▼</div>"),
				parent: root
			} );
			// 右边距
			var ROOT_RIGHT_MARGIN = 16;
			root.style.marginRight = ROOT_RIGHT_MARGIN + "px";
			param.color && ( root.style.color = param.color );
			param.bgcolor && ( valueCaption.style.backgroundColor = valueCaption.style.borderColor = param.bgcolor );
			// 注册相关事件
			var panel = param.panel,
				originalCSS = valueCaption.style.cssText,
				f = ( function() {
					// 设置valueCaption的mouseover效果
					_.bindEvent( valueCaption, "mouseover", function() {
						valueCaption.style.textDecoration = "none";
					} );
					// mouseout效果
					_.bindEvent( valueCaption, "mouseout", function() {
						valueCaption.style.cssText = originalCSS;
					} )();
					return arguments.callee;
				} )(),
				// 单击valueCaption，首先解除mouseover和mouseout绑定，再显示面板，最后执行单击钩子函数
				click = _.bindEvent( valueCaption, "click", function() {
					if(param.disableClick) 
						return;
					_.unbindEvent( valueCaption, "mouseover,mouseout" );
					var xy = _.xy( valueCaption );
					_.copyStyle( panel.root, "left,top", [ xy.x + "px", xy.y + valueCaption.offsetHeight + 2 + "px" ] );
					panel.show();
					// 若显示的菜单右边缘超出页面，则改为右对齐显示
					if ( xy.x + panel.root.offsetWidth > document.body.clientWidth ) {
						panel.root.style.left = xy.x + root.offsetWidth - ROOT_RIGHT_MARGIN - panel.root.offsetWidth;
					}
					param.click && param.click();
				});
			// 将valueCaption的mouseover绑定到面板的hide方法后
			panel.hide = _.link( _.bind( panel.hide, panel ), f );
			_.extend( this, {
				root: root,
				caption: caption,
				valueCaption: valueCaption,
				valueText: valueCaption.firstChild
			} );
		};
		
		var F7 = ( function() {
			function F7( param ) {
				var root = _.div( {
						className: "sue_ui_ext_f7",
						parent: param.parent,
						innerHTML: _.loadUIT( "sue_ui_ext_f7" )
					} ),
					f = function( tag ) {
						return _.find( root, function( e ) {
							return e.tagName && e.tagName.toLowerCase() == tag;
						}, 1 )[0];
					};
				_.extend( this, {
					root: root,
					div: f( "div" ),
					input: f( "input" ),
					btn: f( "button" )
				} );
				param.readonly && ( this.input.readOnly = true );
				this.btn.style.background = _.format( "url(%ssearch.gif) no-repeat #FFF", Sue.config[ "ui_ext_filter_icon_path" ] );
			};
			F7.prototype = {
				setDisabled: function( isDisable ) {
					this.btn.disabled = this.input.disabled = isDisable !== false;
					this.input.style.backgroundColor =
					this.btn.style.backgroundColor = isDisable !== false ? "#F2F2F2" : "#FFF";
				}
			};
			return F7;
		} )();
		
		function Filter( param ) {
			var iconPath = Sue.config[ "ui_ext_filter_icon_path" ],
				f7 = Sue.ui.ext.f7( { parent: param.parent } ),
				searchHandler = function() {
					param.onSearch && param.onSearch();
					result.length > 0 && param.onGoto && gotoHandler( 0 );
				},
				result = [],
				pointer = 0,
				adjuest = function( n ) {
					pointer = Math.max( Math.min( n, result.length - 1 ), 0 );
				},
				gotoHandler = function( flag ) {
					if ( /\d+/.test( flag ) ) {
						adjuest( flag );
					} else if ( flag == "previous" ) {
						adjuest( pointer - 1 );
					} else if ( flag == "next" ) {
						adjuest( pointer + 1 );
					}
					param.onGoto && result[pointer] && param.onGoto( result[pointer] );
				};
			_.bindEvent( f7.btn, "click", searchHandler );
			_.bindEvent( f7.input, "keypress", function( e ) {
				e.keyCode == 13 && searchHandler();
			} );
			if ( param.onGoto ) {
				var imgPrev = _.crt( "img", { src: _.format( "%sprevious.gif", iconPath ) }, f7.root );
				var imgNext = _.crt( "img", { src: _.format( "%snext.gif", iconPath ) }, f7.root );
				_.bindEvent( imgPrev, "click", function() { gotoHandler( "previous" ); } );
				_.bindEvent( imgNext, "click", function() { gotoHandler( "next" ); } );
			} else {
				// 当过滤器没有前进后退按钮时，重设置f7的宽度，使之与父节点宽度相等
				var w = param.parent.clientWidth || param.parent.offsetWidth || parseInt( param.parent.style.width || "0" ) || 140;
				w = w > 140 ? w : 140;
				f7.div.style.width = w + "px";
				f7.input.style.width = w - 22 + "px";
			}
			_.extend( this, {
				root: f7.root,
				div: f7.div,
				input: f7.input,
				setResult: function( r ) {
					result = r;
				}
			} );
		};
		Filter.prototype = {
			getRegExp: function() {
				var text = ( "*" + this.input.value + "*" )
				.replace( /([\$\^\(\)\-\+\=\{\}\[\]\|\\\:\,\.])/g, "\\$1" )
				.replace( /\*+/g, ".*" )
				.replace( /\?+/g, ".{0,1}" );
				return new RegExp( "^" + text + "$" , "i" );
			}
		};
		
		function DualSelector( param ) {
			var panel = Sue.ui.panel( {
					parent: document.body,
					rootCSSText: "position:absolute;z-index:52;width:480px;height:300px;background-color:#FFF;border:solid 1px #CCC",
					innerHTML: _.loadUIT( "sue_ui_ext_dual_selector" ),
					popup: { z: 51 },
					dragable: param.dragable
				} ),
				f = _.curry( _.select )( panel.content, "sue", 1 );
			f( "src" ).appendChild( param.left );
			f( "dest" ).appendChild( param.right );
			_.bindEvent( f( "gt" ), "click", param.gtClick );
			_.bindEvent( f( "lt" ), "click", param.ltClick );
			_.bindEvent( f( "gt2" ), "click", param.gt2Click );
			_.bindEvent( f( "lt2" ), "click", param.lt2Click );
			_.bindEvent( f( "ok" ), "click", param.okClick );
			_.bindEvent( f( "cancel" ), "click", function() {
				param.cancelClick && param.cancelClick();
				panel.hide();
			} );
			panel.root.style.display = "none";
			_.extend( this, { panel: panel } );
		};
		
		var DatePicker = ( function() {
			function DatePicker( param ) {
				var panel = Sue.ui.panel( {
						parent: document.body,
						rootCSSText: "display:none;position:absolute;background-color:#FFF;width:200px;height:200px;border:solid 1px #718BB7;text-align:center;padding:0px 0px 10px;z-index:52",
						innerHTML: _.loadUIT( "sue_ui_ext_datepicker" ),
						popup: true,
						dragable: param.dragable
					} ),
					date = param.date ? param.date : new Date(),
					f = _.curry( _.select )( panel.content, "sue", 1 ),
					prevTD = f( "previous_img" ),
					nextTD = f( "next_img" ),
					yearSelector = f( "year_selector" ),
					monthSelector = f( "month_selector" ),
					todayBtn = f( "today" ),
					cells = [ null ].concat( _.find( panel.content, function( e ) {
						return e.sue && /^cell\d+$/.test( e.sue );
					}, 42 ) ),
					iconPath = Sue.config[ "ui_ext_datepicker_icon_path" ],
					mouseover = function() { this.style.backgroundColor = "#CCC"; },
					mouseout = function() { this.style.backgroundColor = "#FFF"; },
					click = function() {
						_.extend( _this, this.$date );
						panel.hide();
						param.click && param.click();
					},
					y = date.getFullYear(),
					m = date.getMonth() + 1,
					prevImg = _.crt( "img", { src: _.format( "%s%s.gif", iconPath, "previous" ) }, prevTD ),
					nextImg = _.crt( "img", { src: _.format( "%s%s.gif", iconPath, "next" ) }, nextTD ),
					_this = this;
				createYearOptions( yearSelector, 1970, 2030 );
				_.bindEvent( prevImg, "click", function() {
					setCell.call( _this, _this.m == 1 ? _this.y - 1: _this.y, _this.m == 1 ? 12 : _this.m - 1 );
				} );
				_.bindEvent( nextImg, "click", function() {
					setCell.call( _this, _this.m == 12 ? _this.y + 1: _this.y, _this.m == 12 ? 1 : _this.m + 1 );
				} );
				_.bindEvent( yearSelector, "change", function() {
					setCell.call( _this, +yearSelector.options[ yearSelector.selectedIndex ].value, _this.m );
				} );
				_.bindEvent( monthSelector, "change", function() {
					setCell.call( _this, _this.y, +monthSelector.options[ monthSelector.selectedIndex ].value );
				} );
				_.bindEvent( todayBtn, "click", function() {
					var date = new Date(),
						y = date.getFullYear(),
						m = date.getMonth() + 1;
					setCell.call( _this, y, m );
					_.extend( _this, {
						y: y,
						m: m,
						d: date.getDate()
					} );
					panel.hide();
					param.click && param.click();
				} );
				for( var i = 1; i <= 42; i++ ) {
					_.bindEvent( cells[i], "mouseover", mouseover );
					_.bindEvent( cells[i], "mouseout", mouseout );
					_.bindEvent( cells[i], "click", click )
				}
				setCell.call( _.extend( this, {
					panel: panel,
					cells: cells,
					y: y,
					m: m,
					d: date.getDate()
				} ), y, m );
			}
			function renderCell( cell, color, y, m, d ) {
				cell.innerHTML = d;
				cell.style.color = color;
				cell.$date = { y: y, m: m, d: d };
			}
			function setCell( y, m ) {
				var cells = this.cells,
					leap = !( y % 100 ? y % 4 : y % 400 ),
					M = [ null, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ],
					w = new Date( _.format( "%s/%s/1", y, m ) ).getDay();
				this.y = y;
				this.m = m;
				for( var i = w + 1, len = w + M[m], j = 1; i <= len; i++, j++ ) {
					renderCell( cells[i], "#000", y, m, j );
				}
				for( var i = w, m1 = m == 1 ? 12 : m - 1, y1 = m == 1 ? y - 1 : y, j = M[m1]; i >= 1; i--, j-- ) {
					renderCell( cells[i], "#DDD", y1, m1, j );
				}
				for( var i = w + M[m] + 1, m2 = m == 12 ? 1 : m + 1, y2 = m == 12 ? y + 1 : y, j = 1; i <= 42; i++, j++ ) {
					renderCell( cells[i], "#DDD", y2, m2, j );
				}
				_.select( _.select( this.panel.content, "sue", 1, "year_selector" ), "value", 1, y + "" ).selected = true;
				_.select( _.select( this.panel.content, "sue", 1, "month_selector" ), "value", 1, m + "" ).selected = true;
			}
			function createYearOptions( selector, from, to ) {
				selector.options.length = 0;
				for( var i = from, j = 0; i < to; i++, j++ ) {
					selector.options[j] = new Option( i + "年", i );
				}
			}
			return DatePicker;
		} )();
		//页签背景颜色
		var bgImage="";
		var TabbedPanel = ( function() {
			var MAX_CAPTION_LENGTH = 8;
			// 保存tab的初始信息。用于防止打开相同的页签
			var tabStorage = {};
			function TabbedPanel( param ) {
				var head = _.div( {
						parent: param.parent,
						cssText: "padding:4px 0px 4px 0px"
					} ),
					body = _.div( {
						parent: param.parent
					} ),
					tabs = [];
				_.extend( this, {
					head: head,
					body: body,
					tabs: tabs,
					max: Infinity,
					selected: null,
					map: {},
					externalRoot: null
				}, param );
				render.call( this, param.tabs );
			};
			function render( tabs ) {
				if ( !tabs ) return;
				var iconPath = Sue.config[ "ui_ext_tabbedpanel_icon_path" ];
				tabs = _.$A( tabs );
				var span, closeImg, body, _this = this;
				// 返回最后一个添加成功的tab的uuid
				var result;	
				if(portalColorSchemeName=="blue"){
					bgImage="tagbg_blue.gif";
				}else if(portalColorSchemeName=="orange"){
					bgImage="tagbg_orange.gif";
				}else if(portalColorSchemeName=="green"){
					bgImage="tagbg_green.gif";
				}else if(portalColorSchemeName=="red"){
					bgImage="tagbg_red.gif";
				}
				
				for( var i = 0; i < tabs.length; i++ ) {
					// $uniqueValue设定了可以代表页签的唯一值。设定了这个属性才能实现相同页签的自动切换
					var uv = tabs[i].$uniqueValue;
					if ( uv ) {
						if ( uv in tabStorage ) {
							result = tabStorage[ uv ];
							continue;
						}
					}
					// 页签数量过多的处理
					if ( this.max == this.tabs.length ) {
						this.overflow && this.overflow();
						uv && delete tabStorage[ uv ];
						return;
					}
					this.tabs.push( tabs[i] );
					// 此处搞定HTML字符被不正确截断的问题
					var maxLength = _this.maxCaptionLength || MAX_CAPTION_LENGTH;
					var uc = _.unescapeHTML( tabs[i].caption );
					var ih = _.escapeHTML( uc.length > maxLength ? uc.substring( 0, maxLength ) + "..." : uc );
					span = this.map[ tabs[i].uuid = _.uuid() ] = _.crt( "span", { innerHTML: ih + "&nbsp;&nbsp;&nbsp;" }, this.head, "background-color:#E8E8E8;cursor:hand;padding:1px;padding-bottom:4px;margin-right:1px;font-size:12px;color:#0063AB;border:solid 1px #aeb6ba;border-bottom:none" + tabs[i].captionCSSText );
					this.fontColor && ( span.style.color = this.fontColor );
					span.title = uc;
					// 若noclose为真，表示该页签不能关闭
					tabs[i].noclose || ( closeImg = _.crt( "img", { src: _.format( "%s%s.gif", iconPath, "close" ) }, span, "visibility:hidden" ) );
					span.uuid = tabs[i].uuid;
					uv && ( tabStorage[ uv ] = tabs[i].uuid );
					// 若tab没有配置init/select钩子而tabbedpanel配置了，就把tabbedpanel的钩子绑定到tab上
					!tabs[i].init && this.init && ( tabs[i].init = this.init );
					!tabs[i].select && this.select && ( tabs[i].select = this.select );
					!tabs[i].closeMonitor && this.closeMonitor && ( tabs[i].colse = this.colse );
					!tabs[i].destroy && this.destroy && ( tabs[i].destroy = this.destroy );
					_.bindEvent( span, "click", _.bind( function( tab ) {
						_this.doSelect( tab.uuid );
					}, span, tabs[i] ) );
					tabs[i].noclose || _.bindEvent( span, "mouseover", function() {
						var closeImg = this.lastChild;
						closeImg.style.visibility = "visible";
					} );
					tabs[i].noclose || _.bindEvent( span, "mouseout", function() {
						var closeImg = this.lastChild;
						closeImg.style.visibility = "hidden";
					} );
					tabs[i].noclose || _.bindEvent( closeImg, "click", function() {
						_this.closeMonitor(this.parentNode.uuid );
						_this.remove( this.parentNode.uuid );
					} );
					tabs[i].body = body = _.div( {
						parent: _this.body,
						cssText: "border:solid 1px #aeb6ba;display:none"
					} );
					tabs[i].init && tabs[i].init();
					result = tabs[i].uuid;
				}
				return result;
			};
			TabbedPanel.prototype = {
				append: function( tabs, disableAutoActive ) {
					var uuid = render.call( this, tabs );
					!disableAutoActive && uuid && this.doSelect( uuid );
					return tabs;
				},
				closeMonitor:function(uuid){
					var i = _.indexOf( this.tabs, function( tab ) { return tab.uuid == uuid; } ),
						tab = this.tabs[i];
					tab.closeMonitor && tab.closeMonitor(uuid);
				},
				remove: function( uuid ) {
					var i = _.indexOf( this.tabs, function( tab ) { return tab.uuid == uuid; } ),
						tab = this.tabs[i];
					tab.destroy && tab.destroy();
					_.gc( this.map[ uuid ] );
					if ( this.selected && this.selected.uuid == uuid ) {
						var selected = this.tabs.length == 1 ? null : i > 0 ? i - 1 : i + 1;
						selected == null && ( this.selected = null );
						selected == null || this.doSelect( this.tabs[ selected ].uuid );
					}
					_.gc( tab.body );
					i == -1 || this.tabs.splice( i, 1 );
					delete this.map[ uuid ];
					var uv = tab.$uniqueValue;
					uv && delete tabStorage[ uv ];
				},
				doSelect: function( uuid ) {
					if ( uuid == null || this.selected && this.selected.uuid == uuid ) return;
					var selected = this.selected;
					if ( selected != null ) {
						 _.extend( this.map[ selected.uuid ].style, {
							backgroundColor: "#E8E8E8",
							paddingTop: "1px",
							paddingBottom: "4px",
							borderTop: "solid 1px #aeb6ba",
							position: ""
						} );
						selected.body.style.display = "none";
					}
					_.extend( this.map[ uuid ].style, {
		                backgroundColor: this.activeTabBackgroundColor || "#FFF",
						paddingTop: "3px",
						paddingBottom: "4px",
						borderTop: "solid 1px #aeb6ba",
						position: "relative"
					} );
					var tab = _.collect( this.tabs, function( tab ) { return tab.uuid == uuid; } )[0];
					this.selected = tab;
					tab.body.style.display = "block";
					tab.select && tab.select( selected );
				},
				setExternalContent: function( e ) {
					var span = _.crt( "span", null, this.head, "font-size:12px;position:absolute;right:0px;border:none;background:none;padding:0px 0px 20px 0px" );
					if ( typeof e == "string" ) {
						span.innerHTML = e;
					} else {
						span.appendChild( e );
					}
					this.externalRoot = span;
				}
			};
			return TabbedPanel;
		} )();
		
		var ExtDialog = ( function() {
			function ExtDialog( param ) {
				var doc = _.doc( param.document );
				var root = _.div( {	parent: doc.body});

				width = param.width;
				height = param.height;
								
				var win = new Ext.Window({
						title		: param.caption,
               			layout      : 'fit',
               			width       : width,
               			height      : height,
               			closeAction :'hide',
               			//plain       : true,
               			resizable	: true,
               			autoScroll	: true,
               			items		: [root],
               			buttons		: param.buttons
				});
				
				//var table = _.table( _.format( "{[!vertical-align:bottom;padding-left:6px;padding-bottom:3px;font-weight:bold;font-size:12px;backgrounp-color:red;color:%s;width:%s;height:5px;]!height:5px}{[,2]}{[,2!text-align:right]!height:20px}!border-collapse:collapse;table-layout:fixed;width:100%;height:100%;background-color:%s;border:solid 1px #859fc1", Sue.config.cs[15] || "#0F498C", param.width - 15, Sue.config.cs[14] || "#E0EAF5" ), root );
				//var table = _.table("{[!background-color:red;]}{[]}{[]}",root);

				var _this = _.extend( this, {
					param: param,
					root: root,
					content: root,//table.td(1,0),
					//table: table,
					win: win
				} );
			}
			ExtDialog.prototype = {
				show: function() {
					this.win.show();
				},
				hide: function() {
					this.win.hide();
				},
				addButton: function( caption, click ) {
					var button = new Ext.Button( {
						text: caption,
						handle: click
					} );
				},
				setCaption: function( caption ) {
					win.setTitle(caption);
				},
				// 设置对话框内容。若传入的参数是字符串，则作为innerHTML处理，否则作为DOM元素添加到内容区
				setContent: function( o ) {
					if ( typeof o == "string" )	{
						this.root.innerHTML = o;
					} else {
						this.root.appendChild( o );
					}
					
					this.win.doLayout();
				},
				destroy: function() {
					_.gc( this.root );
					this.root = null;
					this.param.destroyHook && this.param.destroyHook();
					this.win.hide();
				}
			};
			return ExtDialog;
		} )();
		
		var Dialog = ( function() {
			function Dialog( param ) {
				var doc = _.doc( param.document );
				var root = _.div( {
					parent: doc.body,
					cssText: "position:absolute;z-index:" + ( param.z || Sue.config[ "ui_ext_dialog_zindex" ] )
				} );
				param.width && ( root.style.width = param.width + "px" );
				param.height && ( root.style.height = param.height + "px" );
				var css = _.curry( _.format, 2 )( "border:solid 1px #%s;width:100%;height:100%" );
				// 四级阴影
				var shadow = _.div( {
					parent: _.div( {
						parent: _.div( {
							parent: _.div( {
								parent: root,
								cssText: css( "E0E0E0" )
							} ),
							cssText: css( "DCDCDC" )
						} ),
						cssText: css( "D4D4D4" )
					} ),
					cssText: css( "CACACA" )
				} );
				var table = _.table( _.format( "{[!vertical-align:bottom;padding-left:6px;padding-bottom:3px;font-weight:bold;font-size:12px;color:%s;width:%s][!width:20px;padding-right:5px;text-align:right]!height:25px}{[,2]}{[,2!text-align:right]!height:0px}!border-collapse:collapse;table-layout:fixed;width:100%;height:100%;background-color:%s;border:solid 1px #859fc1", Sue.config.cs[15] || "#0F498C", param.width - 15, Sue.config.cs[14] || "#E0EAF5" ), shadow );
				table.td( 0, 0 ).innerHTML = param.caption || "";
				var closeImg = _.crt( "img", { src: Sue.config[ "ui_ext_dialog_icon_path" ] + _.format( "close_mouseout_%s.gif", Sue.config.cs.name ) }, table.td( 0, 1 ) );
				_.bindEvent( closeImg, "mouseover", function() {
					closeImg.src = Sue.config[ "ui_ext_dialog_icon_path" ] + _.format( "close_mouseover_%s.gif", Sue.config.cs.name );
				} );
				_.bindEvent( closeImg, "mouseout", function() {
					closeImg.src = Sue.config[ "ui_ext_dialog_icon_path" ] + _.format( "close_mouseout_%s.gif", Sue.config.cs.name );
				} );
				_.bindEvent( closeImg, "click", function() {
					if ( param.closeAction == "close" ) {
						_this.destroy();
					} else {
						setCoversVisible( false );
						root.style.display = "none";
					}
				} );
				_.center( root );
				root.style.top && ( root.style.top = Math.max( 100, parseInt( root.style.top ) - 150 ) + "px" );
				var coverMake = param.withCover !== false ? _.curry( _.cover )( root.style.zIndex - 1, "#CCC", 0.55 ) : _.curry( _.cover )( root.style.zIndex - 1, null, null );
				var covers = _.map( _.$A( param.coveredDocuments || document ), coverMake );
				var setCoversVisible = function( isVisible ) {
					for( var i = 0; i < covers.length; i++ ) {
						covers[i].div.style.display = isVisible ? "block" : "none";
					}
				}
				param.buttonCentered && ( table.td( 2, 0 ).style.textAlign = "center" );
				var _this = _.extend( this, {
					param: param,
					root: root,
					content: table.td( 1, 0 ),
					table: table,
					covers: covers,
					setCoversVisible: setCoversVisible,
					buttons: {}
				} );
			}
			Dialog.prototype = {
				show: function() {
					this.setCoversVisible( true );
					this.root.style.display = "block";
				},
				hide: function() {
					this.setCoversVisible( false );
					this.root.style.display = "none";
				},
				addButton: function( caption, click ) {
					this.buttons[ caption ] = Sue.ui.button( {
						parent: this.table.td( 2, 0 ),
						cssText: "margin-right:10px",
						caption: caption,
						click: click
					} );
					this.table.tr( 2 ).style.height = "32px";
				},
				setButtonDisable: function( caption, isDisable ) {
					if ( !this.buttons[ caption ] ) return;
					this.buttons[ caption ].span.disabled = isDisable !== false;
				},
				setCaption: function( caption ) {
					this.table.td( 0, 0 ).innerHTML = caption || "";
				},
				// 设置对话框内容。若传入的参数是字符串，则作为innerHTML处理，否则作为DOM元素添加到内容区
				setContent: function( o ) {
					var td = this.table.td( 1, 0 );
					if ( typeof o == "string" )	{
						td.innerHTML = o;
					} else {
						td.appendChild( o );
					}
				},
				// 有时需要重新绑定按钮事件
				rebindButtonEvent: function( caption, click ) {
					var btn = this.buttons[ caption ];
					if ( btn ) {
						_.unbindEvent( btn.span, "click" );
						_.bindEvent( btn.span, "click", click );
					} else {
						this.addButton( caption, click );
					}
				},
				destroy: function() {
					var len = this.covers.length;
					for( var i = 0; i < len; i++ ) {
						this.covers[i].remove();
					}
					this.covers.length = 0;
					_.gc( this.root );
					this.root = null;
					this.param.destroyHook && this.param.destroyHook();
				}
			};
			return Dialog;
		} )();
		
		var PageFlipper = ( function() {
			function PageFlipper( param ) {
				var root = _.div( {
						parent: param.parent,
						cssText: param.rootCSSText,
						innerHTML: _.loadUIT( "sue_ui_ext_pageflipper" )
					} ),
					current = param.current,
					total = param.total,
					callback = param.callback,
					sue = function( sueName ) {
						return _.select( root, "sue", 1, sueName );
					},
					f = function( imgName, disabled, page ) {
						var img = _.crt( "img", {
							src: _.format( "%s%s.gif", Sue.config[ "ui_ext_pageflipper_icon_path" ], disabled ? imgName + "_disable" : imgName )
						}, sue( imgName ), "cursor:pointer" );
						disabled || _.bindEvent( img, "click", _.bind( callback, this, page ) );
					};
				f( "first", current <= 1, 1 );
				f( "prev", current <= 1, current - 1 );
				f( "next", current >= total, current + 1 );
				f( "last", current >= total, total );
				sue( "total" ).innerHTML = total;
				var input = sue( "current" );
				input.value = current;
				_.bindEvent( input, "keydown", function( event ) {
					var value = +input.value;
					if ( event.keyCode == 13 ) {
						// 校验输入是否合法
						if ( !/^[1-9]+\d*$/.test( value ) || value > total ) {
							( param.error || _.Z )( value );
							return false;
						} else if ( value == current ) {
							// 若输入当前页，则静默不作处理
							return false;
						}
						param.callback( value );
					}
				} );
				if ( !param.sizeHook ) {
					sue( "pageSizeTD" ).style.display = "none";
				} else {
					var click = function( i ) {
						sl.valueText.innerHTML = items[i].caption;
						param.sizeHook( +items[i].caption );
					}
					var items = _.map( param.sizeList, function( s ) {
						return {
							caption: s + "",
							selected: s == param.size,
							disable: s == param.size,
							click: click
						};
					} );
					var menu = Sue.ui.menu( {
						items: items,
						single: true
					} );
					var sl = Sue.ui.ext.selectableLabel( {
						parent: sue( "size" ),
						valueCaption: param.size,
						bgcolor: "#EDF7FF",
						panel: menu.root
					} );
					sl.root.style.marginRight = "0px";
				}
				_.extend( this, {
					root: root
				} );
			}
			return PageFlipper;
		} )();
				
		return {
			/**
			 * param {
			 * 		parent: (DOM Element) 父元素
			 * 		caption: (string) 标题文本
			 * 		valueCaption: (string) 值文本
			 * 		panel: (panel) 用于选择的面板
			 * 		color: (string) 文字的颜色
			 * 		bgcolor: (string) 背景色和边框色
			 * 		click: (function) 鼠标单击钩子
			 * }
			 */
			selectableLabel: function( param ) {
				return new SelectableLabel( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		readonly: (boolean) 是否只读
			 * }
			 */
			f7: function( param ) {
				return new F7( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		onSearch: (function) 点击搜索按钮或者按下回车时触发的钩子
			 * 		onGoto: (function) 点击定位图片钩子
			 * }
			 */
			filter: function( param ) {
				return new Filter( param );
			},
			/**
			 * param = {
			 * 		left: 左列表组件的根容器
			 * 		right: 右列表组件的根容器
			 * 		gtClick: ">>"按钮钩子
			 * 		ltClick: "<<"按钮钩子
			 * 		okClick: 确定按钮钩子
			 * 		cancelClick: 取消按钮钩子
			 * }
			 */
			dualSelector: function( param ) {
				return new DualSelector( param );
			},
			/**
			 * param = {
			 * 		date: (Date) 初始化日期。默认是当前日期
			 * 		click: (function) 选中某日期后触发的钩子
			 * }
			 */
			datePicker: function( param ) {
				return new DatePicker( param );
			},
			/**
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		max: (number) 页签数目上限
			 * 		overflow: (function) 页签数目到达上限后试图再打开新页签执行的函数
			 * 		init: (function) 页签初始化的函数。只有在生成页签时执行一次
			 * 		select: (function) 页签选择时执行的函数。带一个上一个被选择tab的形参
			 * 		destroy: (function) 页签关闭时执行的函数
			 * 		fontColor: (#RRGGBB) 页签文字颜色
			 * 		activeTabBackgroundColor: (#RRGGBB) 激活的tab背景色
			 * 		inactiveTabBackgroundColor: (#RRGGBB) 未激活的tab背景色
			 * 		maxCaptionLength: (number) caption最大长度，超长用省略号表示
			 * }
			 */
			tabbedPanel: function( param ) {
				return new TabbedPanel( param );
			},
			/**
			 * 模态对话框
			 * param = {
			 * 		document: (DOM Document) 指定的文档对象，默认采用当前页面文档对象
			 * 		caption: (string) 标题
			 * 		width: (number) 一个建议的宽度。若内容过长，该宽度可能无效
			 * 		height: (number) 一个建议的高度。若内容过高，该高度可能无效
			 * 		closeAction: (string) 定义关闭按钮的策略："close"表示销毁对话框，默认采用"隐藏"策略
			 * 		z: (number) 层次
			 * 		withCover: (boolean) 是否显示覆盖层（灰色背景），默认显示
			 * 		coveredDocuments: (array of document DOM) 要进行覆盖的页面文档对象
			 * 		destroyHook: (function) 点击关闭按钮时执行的钩子
			 * 		buttonCentered: (boolean) 是否将按钮水平居中（默认右对齐）
			 * }
			 */
			dialog: function( param ) {
				return new Dialog( param );
			},
			extDialog: function(param) {
				return new ExtDialog(param);
			},
			/**
			 * 翻页器
			 * param = {
			 * 		parent: (DOM Element) 父元素
			 * 		rootCSSText: (string) 根元素cssText
			 * 		current: (number) 当前页数
			 * 		total: (number) 总页数
			 * 		callback: (function) 翻页事件回调函数
			 * 		error: (function) 输入错误处理钩子
			 * 		sizeHook: (function) 改变每页行数后执行的钩子
			 * 		size: (number) 每页行数
			 * 		sizeList: (array) 待选行数。若提供了sizeHook，本属性也应同时提供
			 * }
			 */
			pageFlipper: function( param ) {
				return new PageFlipper( param );
			}
		};
	} )( Sue.util );

}