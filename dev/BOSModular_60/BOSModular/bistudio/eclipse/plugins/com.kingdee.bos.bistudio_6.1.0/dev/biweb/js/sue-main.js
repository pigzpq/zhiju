/**
 * Framework Sue
 * @author Casey Lai
 * @since 2007-12-24
 */

// 确保不会重复执行
if ( !this.Sue ) {

	var Sue = function( clazz, param ) {
		return eval( clazz )( param );
	};

	// 创建闭包以确保命名空间的洁净
	( function() {
		
		var // 缓存对象
			cache = {},
			// 柯里化框架
			$curry = function( f ) {
				var h;
				return h = function( g, n ) {
					n = n || g.length;
					return function() {
						var args = _.$A( arguments );
						if ( args.length >= n ) {
							return g.apply( this, args );
						} else {
							return h( function() {
								return g.apply( this, f( args, _.$A( arguments ) ) );
							}, n - args.length );
						}
					};
				};
			},
		
		// 公用工具函数
			_ = Sue.util = {
			
			// --------- 工具函数 ---------
			
			// 将给定的对象转为数组
			$A: function( o, index ) {
				if ( o instanceof Array ) return o;
				return typeof o["length"] == "number" && !/^(string)|(function)$/.test( typeof o ) ? [].slice.call( o, index || 0 ) : [o];
			},
			// 用指定的值v生成长度为n的数组，若提供了连接符c，则用连接符将数组连接为字符串
			fill: function( v, n, c ) {
				var a = [];
				a.length = n;
				a = _.map( a, _.K( v ) );
				return typeof c == "string"
					? a.join( c )
					: a;
			},
			// 产生含有指定范围数字的数组
			range: function( from, to, step ) {
				var a = [];
				step = step || 1;
				for( var i = from; i < to; i += step ) {
					a.push( i );
				}
				return a;
			},
			// 继承全部源对象的全部属性到目标对象
			extend: function( dest/*, src1, src2...*/ ) {
				var a = _.$A( arguments, 1 ), src;
				for( var i = 0; i < a.length; i++ ) {
					for( var p in ( src = a[i] ) ) dest[p] = src[p];
				}
				return dest;
			},
			// 将源对象的指定属性混入目标对象
			mixin: function( dest, src, ps, f ) {
				f = f || _.I;
				if ( ps instanceof RegExp ) {
					for( var p in src ) ps.test( p ) && ( dest[ f(p) ] = src[p] );
				} else {
					ps = ps.split( "," );
					for( var i = 0, p; i < ps.length; i++ ) ( p = ps[i] ) in src && ( dest[ f(p) ] = src[p] );
				}
				return dest;
			},
			// 用函数对数组进行映射，返回映射后的新数组
			map: function( a, f ) {
				var r = [];
				typeof f == "string" && ( f = _.pluck( f ) );
				for( var i = 0, len = a.length; i < len; i++ ) r.push( f( a[i] ) );
				return r;
			},
			collect: function( a, f ) {
				var r = [];
				for( var i = 0, len = a.length; i < len; i++ ) f( a[i] ) && r.push( a[i] );
				return r;
			},
			// 将指定的数组按键、值函数转化为hash表
			hash: function( a, kf, vf ) {
				var o = {};
				typeof kf == "string" && ( kf = _.pluck( kf ) );
				typeof vf != "function" && ( vf = _.K( vf ) );
				for( var i = 0, len = a.length; i < len; i++ ) o[ kf( a[i] ) ] = vf( a[i] );
				return o;
			},
			// 将指定的hash表转化为数组，kv取值“key”或者“value”，表示反哈希键还是值
			unhash: function( o, kv ) {
				var a = [];
				if ( kv == "key" ) for( var p in o ) a.push( p );
				else for( var p in o ) a.push( o[p] );
				return a;
			},
			// 返回数组中满足条件的索引值，找不到则返回-1
			indexOf: function( a, o ) {
				if ( typeof o == "function" ) {
					for( var i = 0, len = a.length; i < len; i++ ) if ( o( a[ i ] ) ) return i;
				} else {
					for( var i = 0, len = a.length; i < len; i++ ) if( a[ i ] == o ) return i;
				}
				return -1;
			},
			// 返回给定的方法中能够正常执行的方法，都不能正常执行，返回undefined
			choose: function( /*f1, f2...*/ ) {
				for( var i = 0, len = arguments.length; i < len; i++ ) {
					try {
						arguments[i]();
						return arguments[i];
					} catch( e ){}
				}
			},
			// Python风格的字符串格式化。用%s表示占位符，%%表示对%的转义
			format: function( s/*s1, s2...*/ ) {
				var a = _.$A( arguments, 1 );
				return s.replace( /([^%]?)%s/g, function( s, s1 ) {
					return ( s1 || "" ) + a.shift();
				} ).replace( /%%/g, "%" );
			},
			// 将给定的JavaScript对象转化为JSON串。仅有自定义Object、数组、字符串、数字、布尔值和null允许作为JSON的数据类型
			json: function( o ) {
				var type = typeof o;
				if ( type == "string" ) {
					// 转义控制符
					return "\"" + o.replace( /["\\\x00-\x1f\x7f-\x9f]/g, function( s ) {
						var c = s.charCodeAt();
						return "\\u00" + Math.floor( c / 16 ).toString( 16 ) + ( c % 16 ).toString( 16 );
					} ) + "\"";
				} else if ( type == "number" ) {
					// NaN和Infinity是非法的
					if ( isNaN( o ) || !isFinite( o ) ) throw new Error( "SueError: Invalid JSON number type." );
					return "" + o;
				} else if ( type == "boolean" || o === null ) {
					return "" + o;
				} else if ( o instanceof Array ) {
					return "[" + _.map( o, _.json ).join(",") + "]";
				} else if ( type == "object" ) {
					var a = [];
					for( var p in o ) a.push( "\"" + p + "\":" + _.json( o[p] ) );
					return "{" + a.join( "," ) + "}";
				} else if ( type == "function" ) {
					//do nothing		
				} else {
					throw new Error( "SueError: Invalid JSON type." );
				}
			},
			cache: function( k, v ) {
				if ( v === undefined ) return cache[k];
				else if ( v === null ) delete cache[k];
				else cache[k] = v;
				return v;
			},
			//判断是否正整数
			isInteger: function(num){
				var patrn=/^[0-9]*[1-9][0-9]*$/;   
  				if (!patrn.exec(num)) 
				   return false;  
  				else
   					return true; 
			},
			// --------- 高阶函数 ---------
			
			// 将指定的函数的this指针绑定到指定的对象上，同时可以绑定指定的参数到函数参数列表
			// 返回一个函数，执行该函数时传递的参数将被绑定到指定的函数参数列表（在绑定期参数之后）
			bind: function( f, o/*, arg1, arg2... argn*/ ) {
				var args = _.$A( arguments, 2 );
				return function( /*argn+1, argn+2... argn+m*/ ) {
					return f.apply( o, args.concat( _.$A( arguments ) ) );
				}
			},
			// 将给定的函数连接起来，函数之间没有关系，返回连接函数
			// 例：link( f1, f2... fn )() == f1(); f2();... fn();
			link: function( /*f1, f2...*/ ) {
				var a = _.$A( arguments );
				return function() {
					for( var i = 0; i < a.length; i++ ) a[i].apply( this, _.$A( arguments ) );
				}
			},
			// 将给定的函数连接起来，前一函数的返回值作为后一函数的参数，返回连接函数
			// 例：compose( f1, f2... fn )( args ) == fn( ...f2( f1( args ) ) )
			compose: function( /*f1, f2...*/ ) {
				var a = _.$A( arguments );
				return function( /*arg1, arg2... argn*/ ) {
					var r = arguments;
					for( var i = 0; i < a.length; i++ ) r = a[i].apply( this, _.$A( r ) );
					return r;
				}
			},
			// 指定一个属性名，返回的函数接受一个object作为参数，返回该object的指定属性值
			pluck: function( p ) {
				return function( o ) {
					return o[p];
				}
			},
			// 柯里化指定的函数。可以指定函数的参数个数，不指定将使用函数的默认参数个数
			// 例：curry( f )( a )( b )( c ) == curry( f )( a, b )( c ) == curry( f )( a )( b, c ) == f( a, b, c )
			curry: $curry( function( a0, a1 ) {
				return a0.concat( a1 );
			} ),
			// 右柯里化
			// 例：rcurry( f )( a )( b )( c ) == rcurry( f )( a, b )( c ) == rcurry( f )( a )( b, c ) == f( c, b, a )
			rcurry: $curry( function( a0, a1 ) {
				return a1.concat( a0.reverse() );
			} ),
			
			// --------- S/K/I/Z 组合子 ---------
			
			// S( f, g )( arg1, arg2... ) == f( g( arg1, arg2... ), arg1, arg2... )
			S: function( f, g ) {
				return function() {
					var args = _.$A( arguments );
					return f.apply( this, [ g.apply( this, args ) ].concat( args ) );
				}
			},
			K: function( x ) { return function() { return x; } },
			I: function( x ) { return x; },
			Z: function() {}
		};
		
		// 扩展工具函数
		_.extend( _,
		
		// 浏览器工具函数
		( function() {
			
			var u = 1,
				ua = navigator.userAgent.toLowerCase(),
				garbage, escaper;
			
			// 将DOM对象的所有子节点压入队列尾。配合下面的BFS算法，实现对DOM的广度优先遍历
			function push( e, q ) {
				for( e = e.firstChild; e; e = e.nextSibling ) q.push( e );
			};
			// 广度优先搜索（Boardth First Search）
			// e: DOM元素， f: 判别函数， n: 结果期望个数， r: 结果集， q: 临时队列
			function bfs( e, f, n, r, q ) {
				push( e, q );
				while( e = q.shift() ) {
					if ( f( e ) ) {
						r.push( e );
						if ( typeof n == "number" && --n < 1 ) return r;
					}
					push( e, q );
				}
				return r;
			};

			// 用HTML编码的形式替换指定字符串中所有用“\”指定的在字符集中的字符
			function esc( s, cs ) {
				return s.replace( new RegExp( _.map( cs.split( "" ), function( c ) { return "\\\\\\" + c; } ).join( "|" ), "g" ), function( s ) {
					return "&#" + s.charCodeAt(1) + ";";
				} );
			};

			// 表格描述范式（Table Description Formula）解析器
			function parseTable( tdf ) {
				// 预处理转义字符
				tdf = esc( tdf.replace( /\\\\/g, "&#92;" ), "@{}[]?*!~" ).replace( /\*/g, "[]" );
				// 将宏与主体分开
				var	k = tdf.indexOf( "@" ),
					macros = esc( tdf.substring( 0, k ), "|$" ),
					tdf = tdf.substring( k + 1 );
				// 替换主体里面的宏
				if ( macros ) {
                    var p = /(\w+)\|(.*?)\|/g, m, np;
					while ( m = p.exec( macros ) ) {
						np = m[2].indexOf( "$" ) == -1;
                        tdf = tdf.replace( new RegExp( "\\?" + m[1] + ( np ? "" : "(\\((.*?)\\))?" ), "g" ), np ? m[2] : _.curry( function( m2, s, s1, s2 ) {
							var a = s2 ? s2.split( "," ) : [];
                            return m2.replace( /\$/g, function() {
                                return a.shift() || "";
                            } );
                        } )( m[2] ) );
                    }
                }
				// 展开数字复写表达式
				tdf = tdf.replace( /(\[[^\[\]]*?\])(\d+)/g, function( s, s1, s2 ) {
					return _.fill( s1, +s2, "" );
				} ).replace( /(\{[^\{\}]*?\})(\d+)/g, function( s, s1, s2 ) {
					return _.fill( s1, +s2, "" );
				} );
				// 将完全展开的主体解析为表格HTML
				var ptr = /\{.*?\}/g,
					ptd = /\[.*?\]/g,
					mtr, mtd, rc,
					rspan, cspan, css, data,
					r = [];
				css = tdf.match( /!([^\]\}]*?)$/ );
				r.push( "<table" );
				css && r.push( " style=\"" + css[1] + "\"" );
				r.push( "><tbody>" );
				while( mtr = ptr.exec( tdf ) ) {
					css = mtr[0].match( /!([^\]]*?)\}/ );
					r.push( "<tr" );
					css && r.push( " style=\"" + css[1] + "\"" );
					r.push( ">" );
					while( mtd = ptd.exec( mtr[0] ) ) {
						rc = mtd[0].match( /\[(\d*)\,?(\d*)/ ), rspan = rc[1], cspan = rc[2];
						css = mtd[0].match( /!(.*?)(~|\])/ );
						data = mtd[0].match( /~(.*?)\]/ );
						r.push( "<td" );
						rspan && r.push( " rowspan=\"" + rspan + "\"" );
						cspan && r.push( " colspan=\"" + cspan + "\"" );
						css && r.push( " style=\"" + css[1] + "\"" );
						r.push( ">" );
						data && r.push( data[1] );
						r.push( "</td>" );
					}
					r.push( "</tr>" );
				}
				r.push( "</tbody></table>" );
				return r.join( "" );
			};
			
			// 获取文档对应的覆盖层
			// 覆盖层用于在给定的文档页面上接收单击事件
			// param = {
			// 		doc: (HTML Document) 指定的文档对象，默认为当前文档对象window.document
			// 		z: (整数) 覆盖层的高度，默认为9999
			// 		rgb: (#RRGGBB形式的字符串) 覆盖层的颜色，默认为白色#FFFFFF
			// 		opacity: (纯小数) 覆盖层的alpha值，默认为完全透明0.0
			// 		click: (function) 单击事件
			// }
			function getDocumentCover( param ) {
				param = _.extend( {
					doc: document,
					z: 9999,
					rgb: "#FFFFFF",
					opacity: 0,
					click: _.Z
				}, param );
				// 覆盖层对象作为单例绑定到文档对象上
				var c = param.doc.$documentCover;
				if ( c ) {
					return c;
				} else {
					var div = _.div( {
						parent: param.doc.body,
						cssText: _.format( "position:absolute;z-index:%s;left:0px;top:0px;background-color:%s", param.z, param.rgb )
					} );
					var setOpacity = ( function( op ) {
						_.ie && ( div.style.filter = _.format( "alpha(opacity=%s)", Math.floor( op * 100 ) ) );
						_.mozilla && ( div.style.MozOpacity = op );
						return arguments.callee;
					} )( param.opacity );
					var bindEvent = ( function( click ) {
						// 限制覆盖层的事件传播
						_.unbindEvent( div );
						_.bindEvent( div, "click,mousedown,mouseup,keydown,keyup,keypress", function( e ) {
							_.ie && ( e.cancelBubble = true );
							_.mozilla && e.stopPropagation();
						} );
						_.bindEvent( div, "click", click );
						return arguments.callee;
					} )( param.click );
					// 当覆盖层正在使用而有新请求使用覆盖层时，覆盖层信息保存到堆栈中，待请求处理完毕后恢复现场
					var stack = [];
					return ( param.doc.$documentCover = {
						div: div,
						show: function( p ) {
							p = p || {};
							// 新覆盖层高度应比旧覆盖层高
							if ( stack.length && ( p.z || -1 ) < stack[ stack.length - 1 ].z ) {
								p.z = stack[ stack.length - 1 ].z + 1;
							}
							p.z && ( div.style.zIndex = p.z );
							p.rgb && ( div.style.backgroundColor = p.rgb );
							p.opacity && setOpacity( p.opacity );
							p.click && bindEvent( p.click );
							_.extend( div.style, {
								width: Math.max(document.body.clientWidth,document.documentElement.clientWidth) + "px",
								height: Math.max(document.body.clientHeight,document.documentElement.clientHeight) + "px",
								display: "block"
							} );
							stack.push( p );
							return this;
						},
						hide: function() {
							_.extend( div.style, {
								width: "0px",
								height: "0px",
								display: "none"
							} );
							stack.pop();
							if ( stack.length ) {
								param.doc.$documentCover.show( stack.pop() );
							}
							return this;
						}
					} );
				}
			}
			
			function testIEVersion( x ) {
				try {
					return ua.match( /msie\s(\d)/ )[1] == x;
				} catch ( e ) {}
			}

			return {
				ie: /msie/.test( ua ) && !/opera/.test( ua ),
				ie6: testIEVersion(6),
				ie7: testIEVersion(7),
				ie8: testIEVersion(8),
				mozilla: /mozilla/.test( ua ) && !/(compatible|webkit)/.test( ua ),
				id: function( id ) {
					return document.getElementById( id );
				},
				tag: function( tag ) {
					return document.getElementsByTagName( tag );
				},
				frag: function( doc ) {
					return ( doc || document ).createDocumentFragment();
				},
				trim: function( s ) {
					return s.replace( /^\s+|\s+$/g, "" );
				},
				// 用指定的tag创建DOM对象，并将其属性设置为和o相同
				crt: function( tag, o, pnt, css ) {
					var e = _.doc( pnt ).createElement( tag );
					o && _.extend( e, o );
					pnt && pnt.nodeName != "#document" && pnt.appendChild( e );
					css && ( e.style.cssText = css );
					return e;
				},
				// 动态注册CSS。注意：出于性能考虑，不应该使用该方法注册相同的CSS
				css: function( css ) {
					var style = _.crt( "style", { type: "text/css" }, document.documentElement.firstChild );
					if ( _.ie ) return ( this.css = function( css ) {
						style.styleSheet.cssText += css;
					} )( css );
					if ( _.mozilla ) {
						return ( this.css = function( css ) { style.innerHTML += css; } )( css );
					}
				},
				// 查找所提供的对象中DOM对象所属的文档对象，成功找到一个立即返回，若没有找到则在第二个对象中查找，若全部对象中
				// 都没有找到，返回本页面的文档对象
				doc: function(/* e1, e2, e3 */) {
					var es = _.$A( arguments );
					for( var i = 0; i < es.length; i++ ) {
						if ( es[i] ) {
							if ( es[i].nodeName == "#document" ) return es[i];
							if ( es[i].ownerDocument ) return es[i].ownerDocument;
						}
					}
					return document;
				},
				// 创建DOM DIV对象
				div: function( o ) {
					var doc = o ? ( o.doc || _.doc( o.parent ) ) : document;
					var div = doc.createElement( "div" );
					o && ( _.mixin( div, o, "id,className,innerHTML,title" ),
					_.mixin( div.style, o, "cssText" ),
					o.parent && o.parent.appendChild( div ) );
					return div;
				},
				// 用TDF生成表格
				table: function( tdf, pnt ) {
					var div = _.div( {
						innerHTML: parseTable( tdf ),
						doc: pnt && pnt.ownerDocument ? pnt.ownerDocument : document
					} );
					var table = div.firstChild;
					div.removeChild( table );
					pnt && pnt.appendChild( table );
					return {
						table: table,
						tr: function( row ) {
							return table.firstChild.childNodes[row];
						},
						td: function( row, col ) {
							return table.firstChild.childNodes[row].childNodes[col];
						}
					};
				},
				// 复制样式
				// a: DOM元素或者DOM元素数组， k: 要拷贝的样式属性名称，逗号分隔的字符串表示
				// v: DOM对象或者值数组。若是DOM对象，则复制DOM对象的属性到a；若是数组，则值与k的属性名是一一对应关系
				// 例: _.copyStyle( [ dom1, dom2 ], "width,height,left,top", dom3 );  表示复制dom3的width/height/left/top样式属性到dom1和dom2
				// _.copyStyle( dom1, "width,height,left,top", [ 100, 200, 300, 400 ] ); 表示将dom1的width/height/left/top样式属性分别设置为100/200/300/400
				copyStyle: function( a, k, v ) {
					a instanceof Array || ( a = [a] );
					v instanceof Array && typeof k == "string" && ( k = k.split( "," ) );
					if ( v instanceof Array ) {
						for( var i = 0; i < a.length; i++ )
							for( var j = 0; j < k.length; j++ )
								v[j] && ( a[i].style[k[j]] = v[j] );
					} else {
						for( var i = 0; i < a.length; i++ )	_.mixin( a[i].style, v.style, k );
					}
				},
				// 获取指定DOM对象相对指定父DOM对象的坐标。若省略父DOM对象，则返回相对页面的绝对坐标
				xy: function( e, pnt ) {
					var lft = 0, tp = 0;
					do {
						lft += e.offsetLeft - e.scrollLeft, tp += e.offsetTop - e.scrollTop;
					} while( ( e = e.offsetParent ) && ( pnt ? pnt != e : true ) );
					return { x: lft, y: tp };
				},
				// 使指定的DOM元素不可选择
				disableSelect: function( e ) {
					e.onselectstart = _.K( false );
					_.bindEvent( e, "select", function( event ) {
						_.ie && ( event.cancelBubble = true );
						_.mozilla && event.stopPropagation();
					} );
				},
				// disableSelect的反向操作
				enableSelect: function( e ) {
					e.onselectstart = null;
					_.unbindEvent( e, "select" );
				},
				// 在指定的DOM元素上绑定事件。无论IE或者DOM标准的浏览器，都可以在事件处理函数里传入event对象
				// 注意：在解除事件绑定时，必须使用返回的函数作为unbindEvent的第3个参数
				// 例：var handler = _.bindEvent( dom, "click", function( event ) { ... } );    绑定事件
				// _.unbindEvent( dom, "click" );   解除绑定
				bindEvent: function( e, type, g ) {
					// 若DOM数组，分解处理
					if ( e instanceof Array ) {
						return _.map( e, function( e0 ) {
							return _.bindEvent( e0, type, g );
						} );
					}
					// 批量添加事件绑定：var handlers = _.bindEvent( dom, "click,mousedown,mouseup", function() {...} )
					else if ( type.indexOf( "," ) > -1 ) {
						return _.map( type.split( "," ), function( t ) {
							return _.bindEvent( e, t, g );
						} );
					} else {
						var f;
						e.attachEvent && e.attachEvent( type.indexOf( "on" ) ? "on" + type : type, f = function() {
							// FIXME: 在设置覆盖层限制document的事件响应时，window.event对象始终为空，不能正常传入
							// 原因不明，但是拿arguments[0]可以代替
							g && g.call( e, window.event || arguments[0] );
						} );
						e.addEventListener && e.addEventListener( type.indexOf( "on" ) ? type : type.substring( 2 ), f = g, false );
						e.$events = e.$events || {};
						if ( e.$events[ type ] instanceof Array ) {
							e.$events[ type ].push( f );
						} else if ( e.$events[ type ] ) {
							e.$events[ type ] = [ e.$events[ type ], f ];
						} else {
							e.$events[ type ] = f;
						}
						return f;
					}
				},
				// 解除事件绑定
				unbindEvent: function( e, type ) {
					if ( !e || !e.$events ) return e;
					if ( !type ) type = _.unhash( e.$events, "key" );
					type instanceof Array || ( type = type.split( "," ) );
					var f, t;
					for( var i = 0; i < type.length; i++ ) {
						t = type[i];
						a = _.$A( e.$events[ t ] || [] );
						_.map( a, function( f ) {
							e.detachEvent && e.detachEvent( t.indexOf( "on" ) ? "on" + t : t, f );
							e.removeEventListener && e.removeEventListener( t.indexOf( "on" ) ? t : t.substring( 2 ), f, false );
						} );
						e.$events[ t ] = null;
						delete e.$events[ t ];
					}
					return e;
				},
				// 获取指定DOM元素的指定事件处理钩子，若有多个钩子则链接处理
				extractEvent: function( e, type ) {
					if ( !e ) throw new Error( "SueError: 必须指定DOM元素" );
					if ( e.$events && e.$events[ type ] ) {
						return _.link.apply( _, _.$A( e.$events[ type ] ) );
					}
					if ( !/^on/.test( type ) && e[ "on" + type ] ) {
						return _.link.apply( _, _.$A( e[ "on" + type ] ) );
					}
					// 找不到就返回undefined
				},
				// 使指定的DOM对象居于页面正中。若对象宽高不由style决定，那么该方法只在对象可见时有效
				center: function( e ) {
					var doc = _.doc( e );
					var w = e.clientWidth || parseInt( e.style.width ) || 0,
						h = e.clientHeight || parseInt( e.style.height ) || 0,
						pw = doc.documentElement.offsetWidth,
						ph = doc.documentElement.offsetHeight;
					e.style.left = ( pw - w ) / 2 + doc.body.scrollLeft + "px";
					e.style.top = ( ph - h ) / 2 + doc.body.scrollTop + "px";
				},
				// 使指定的DOM元素水平页面居中，垂直屏幕居中
				screenCenter: function( e ) {
					var hOffset = 0,
						vOffset = 0,
						e0 = e;
					while( e0 = e0.offsetParent ) {
						hOffset += e0.scrollLeft;
						vOffset += e0.scrollTop;
					}
					var w = e.clientWidth || parseInt( e.style.width ) || 0,
						h = e.clientHeight || parseInt( e.style.height ) || 0,
						pw = _.doc( e ).documentElement.offsetWidth,
						ph = window.screen.height;
					e.style.left = ( pw - w ) / 2 + hOffset + "px";
					e.style.top = ( ph - h ) / 2 + vOffset + "px";
				},
				// 在页面生成一个覆盖层
				// z: 层的z坐标， rgb: 层的颜色， opacity: 透明度（0～1）， doc: 指定的文档页面
				cover: function( z, rgb, opacity, doc ) {
					z = z || 100;
					opacity = opacity || 0;
					doc = doc || document;
					var div = _.div( {
						parent: doc.body,
						cssText: _.format( "position:absolute;z-index:%s;left:0px;top:0px;width:expression(Math.max(document.body.scrollWidth,document.body.clientWidth,document.documentElement.clientWidth));height:expression(Math.max(document.body.scrollHeight,document.body.clientHeight,document.documentElement.clientHeight));background-color:%s", z, rgb || "#FFF" )
					} );
					_.ie && ( div.style.filter = _.format( "alpha(opacity=%s)", Math.floor( opacity * 100 ) ) );
					_.mozilla && ( div.style.MozOpacity = opacity );
					// 限制覆盖层的事件传播
					_.bindEvent( div, "click,mousedown,mouseup,keydown,keyup,keypress", function( e ) {
						// TODO:
						_.ie && ( e.cancelBubble = true );
						_.mozilla && e.stopPropagation();
					} );
					return {
						z: z,
						div: div,
						remove: function() {
							_.gc( div );
						}
					};
				},
				// 获得页面覆盖层，该覆盖层是依附于页面文档对象的一个单例
				getDocumentCover: function( param ) {
					return getDocumentCover( param );
				},
				// 查找指定名称的UI模版
				loadUIT: function( name, path, macro ) {
					var uit = _.cache( "sue_uit_" + name );
					uit || _.get( {
						url: _.format( "%s%s.uit", path || Sue.config[ "ui_template_path" ], name ),
						// 这是一个同步的AJAX调用
						async: false,
						nocache: false,
						beforeStart: null,
						afterEnd: null,
						callback: function( r ) {
							var p = /@css\s+(.*?)\s*\n/g,
								m;
							// 查找设置模版中的CSS
							while ( m = p.exec( r ) ) _.css( m[1] );
							_.cache( "sue_uit_" + name, uit = r.replace( p, "" ) );
						}
					} );
					// 宏替换
					if ( macro ) {
						for( var p in macro ) {
							uit = uit.replace( new RegExp( "\\$\\{" + p + "\\}", "g" ), macro[p] );
						}
					}
					return uit;
				},
				// 转义HTML
				escapeHTML: function( s ) {
					return s.replace( /[<>&\\\/"']/g, function( c ) {
						return "&#" + c.charCodeAt() + ";";
					} );
				},
				// 逆向转义HTML
				unescapeHTML: function( s ) {
					if ( !s ) return s;
					escaper = escaper || _.div();
					escaper.innerHTML = s;
					s = escaper.innerHTML;
					return s.replace( /\&lt;/g, "<" ).replace( /\&gt;/g, ">" ).replace( /\&amp;/g, "&" );
				},
				// 彻底删除并回收指定DOM对象的内存
				gc: function( e ) {
					if ( !e ) return;
					if ( _.ie ) {
						// IE的垃圾收集一直是个老大难问题。特别是透明滤镜，极耗内存，处理不好内存使用量飙得比火箭还快
						_.unbindEvent( e );
						if ( !garbage || garbage.ownerDocument != _.doc( e ) ) {
							garbage = _.div( {
								parent: _.doc( e ).body,
								cssText: "display:none;position:absolute;width:0px;height:0px"
							} );
						}
						garbage.appendChild( e );
						garbage.innerHTML = "";
						CollectGarbage();
					} else if ( _.mozilla ) {
						e.parentNode.removeChild( e );
					}					
				},
				// 在指定的DOM元素的子孙节点里寻找满足指定函数的节点，可以指定最大个数n，搜索到n个以后将退出搜索
				// 返回节点数组，搜索按照广度优先搜索进行，层次越浅的节点排得越靠前
				find: function( e, f, n ) {
					return bfs( e, f, n, [], [] );
				},
				// 返回指定的DOM节点中指定属性的值为指定值的节点。若节点不止一个，返回节点数组
				select: function( e, attr, n, value ) {
					var r = _.find( e, function( e ) { return e[attr] == value; }, n );
					return r.length == 1 ? r[0] : r;
				},
				// 获取一个uuid
				uuid: function() {
					return u++;
				}
			};
		} )(),
		
		// Ajax 工具函数
		( function() {
			
			// 获得XMLHTTPObject
			var getHTTPObject = _.choose( function() {
				return new XMLHttpRequest();
			}, function() {
				return new ActiveXObject( "Msxml2.XMLHTTP" );
			}, function() {
				return new ActiveXObject( "Microsoft.XMLHTTP" );
			}, function() {
				throw new Error( "SueError: Sorry, your browser cannot support AJAX, please change the browser and try again." );
			} ),
				getDefaultConfig = function() {
					return ( getDefaultConfig = _.K( _.mixin( {}, Sue.config, /^ajax_/, function( p ) { return p.substring( 5 ); } ) ) )();
				};
				
			// Ajax构造器
			function Ajax( cfg ) {
				var o = cfg.o,
					state = "ready", // 保存Ajax状态
					timer, // 计算超时的计时器
					ajax, // Ajax外部控制器
					a = [ null, "ready", "connecting", "loading", "loaded" ];
				cfg.async = cfg.async !== false;
				function ready() {
					if ( o.readyState > 0 ) {
						cfg.onStateChange && cfg.onStateChange( a[ o.readyState ] );
					}
					if ( o.readyState == 4 ) {
						if ( o.status == 200 ) {
							timer && clearTimeout( timer );
							// 若使用JSON作为协议发送数据，则接受数据也将被解析为JSON；否则直接返回文本
							if ( cfg.json ) {
								var json;
								// 这里将返回的数据当作JSON解析为JavaScript对象
								try {
									json = eval( "(" + o.responseText + ")" );
								} catch( e ) {
									// 解析失败。按照Ajax策略的配置决定解决方法
									var strategy = cfg.EvalExceptionStrategy;
									if ( strategy == "giveup" ) return ajax.die();
									if ( strategy == "retry" ) return ajax.run();
									cfg.afterEnd && cfg.afterEnd( cfg );
									throw new Error( _.format( "SueError: Cannot evaluate response text to JSON.\nName: %s\nDescription: %s", e.name, e.description ) );
								}
								//cfg.afterEnd && cfg.afterEnd( cfg );
								if ( cfg.group ) {
									// 批发送，回复单独处理
									var i = 0;
									json = json.result;
									while( ++i in json ) {
										if ( typeof json[i] == "object" && "error" in json[i] ) {
											cfg.onServerException( json[i].error, cfg, i );
										} else {
											cfg.callback && cfg.callback( json[i], i );
										}
									}
								} else {
									// 若error域存在，处理服务端异常
									"error" in json && cfg.onServerException( json.error, cfg );
									// 若result存在，得到正确的数据
									"result" in json && cfg.callback && cfg.callback( json.result );
								}
							} else {
								cfg.callback && cfg.callback( o.responseText );
							}
							cfg.afterEnd && cfg.afterEnd( cfg );
						} else {
							// 非200状态的处理
							cfg.onNot200Status && cfg.onNot200Status( o, cfg );
						}
						cfg = o = cfg.o = null;
					}
				};
				
				cfg.beforeStart && cfg.beforeStart( cfg );
				// 若没有注册回调函数，则不设置定时器
				cfg.callback || ( cfg.timeout = 0 );
				
				( ajax = {
					// 执行Ajax请求
					run: function() {
						if ( state == "ready" ) {
							o.onreadystatechange = ready;
							o.open( cfg.method, cfg.url, cfg.async );
							cfg.method == "POST" && o.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded" );
							cfg.async && cfg.timeout && ( timer = setTimeout( _.bind( cfg.onTimeout || _.Z, this, cfg ), cfg.timeout ) );
							o.send( cfg.param );
							state = "running";
						}
					},
					// 取消
					cancel: function() {
						if ( state == "running" ) {
							o.readyState < 4 && o.abort();
							o.onreadystatechange = null;
							timer && clearTimeout( timer );
							state = "ready";
						}
					},
					// 销毁，归还XMLHTTPObject
					die: function() {
						state == "running" && this.cancel();
						o = null;
						state = "die";
					}
				} ).run();
				return ajax;
			};

			return {
				/* 
				 * 可以设定如下配置: 
				 * url,
				 * json 要传递的JSON串,
				 * nocache GET方式下不缓存，设为true
				 * timeout 超时时间，毫秒为单位
				 * group 是否批发送请求。若设为true，返回的请求将被单独置入回调中处理
				 * callback 回调函数，在返回200状态后执行
				 * async 异步模式设为true，同步设为false
				 * onTimeout 超时处理器，传入当前的config配置对象为参数
				 * onNot200Status 返回状态非200处理器，传入XMLHTTPObject和当前配置对象为参数
				 * onServerException 服务端异常处理器，传入返回的JSON和当前config配置对象作为参数
				 * EvalExceptionStrategy JSON解析错误的处理策略，可选giveup、retry或者throw
				 * }
				 */
				post: function( config ) {
					config = _.extend( {
						method: "POST",
						o: getHTTPObject()
					}, getDefaultConfig(), config );
					config.json && ( config.param = "json=" + encodeURIComponent( _.json( config.json ) ) );
					return Ajax( config );
				},
				get: function( config ) {
					config = _.extend( {
						method: "GET",
						o: getHTTPObject()
					}, getDefaultConfig(), config );
					config.json && ( config.url += "?json=" + encodeURIComponent( _.json( config.json ) ) );
					config.nocache && ( config.url += ( config.url.indexOf( "?" ) == -1 ? "?" : "&" ) + "__SueRandom__=" + new Date().getTime() * Math.random() ); 
					config.param = null;
					return Ajax( config );
				}
			};
		} )() );
		
	} )();
	
	// 快捷引用
	_ = Sue.util.extend( {}, Sue.util );
	
	// /*非sue-main部分，修改portal的一坨bug才加上去修正的*/
	// 由于使用了框架，原有的_.center方法不能正常工作，这里修正
	_.center = Sue.util.center = function( e ) {
		_.screenCenter( e );
		// 100是IE标题栏、菜单栏和地址栏加起来大致的高度
		e.style.top = bi.getBaseIFrameScrollTop() + parseInt( e.style.top ) - 100 + "px";
	}
}