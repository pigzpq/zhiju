// 交互式仪表板脚本引擎
// 2009-3-25 laikun
var sliders=null;//保存滑动条变量
SubScriptEngine = (function() {
	sliders=new Array();
	var ScriptEngineConstructor = arguments.callee;
	
	function mixin( dest /*, src(s) */ ) {
		for( var i = 1; i < arguments.length; i++ ) {
			var src = arguments[i];
			for( var p in src ) {
				dest[p] = src[p];
			}
		}
		return dest;
	}
	
	function clone( o ) {
		return mixin( {}, o );
	}
	
	function getIID() {
		return +new Date + Math.random();
	}
	
	function Z() {}
	
	function next( f, g ) {
		return function() {
			f();
			g();
		}
	}
		
	function makeType( param ) {
		param = mixin( {
			args: [],
			superType: new Type,
			proto: {},
			description: "没有描述"
		}, param || {} );
		var superType = param.superType,
			superConstructor = superType.constructor,
			args = superConstructor.args.concat( param.args ),
			superPrototype = superConstructor.prototype,
			cloneSuperType = clone( superType );
		function T() {
			for( var p in cloneSuperType ) {
				p in superPrototype || ( this[p] = cloneSuperType[p] );
			}
			for( var i = 0; i < args.length; i++ ) {
				this[args[i]] = arguments[i];
			}
			this.description = param.description;
			param.init && param.init.call( this );
			this.iid = getIID();
			nameManager && nameManager.register( this );
		}
		mixin( T, {
			args: args,
			superType: superType
		} );
		T.prototype = mixin( superType, param.proto, {
			constructor: T
		} );
		return T;
	}
	
	function toPropertyObject( instance, name ) {
		var type, order;
		if ( instance instanceof Type ) {
			type = "type";
			order = 1;
		} else if ( instance instanceof Array ) {
			type = "array";
			order = 0;
		} else if ( instance.isMethod ) {
			type = "method";
			order = 2;
		} else {
			return;
		}
		return {
			name: instance.name || name || "",
			type: type,
			order: order,
			description: instance.description || ""
		}
	}
	
	function Type() {}
	mixin( Type, {
		description: "仪表板脚本系统类型类，所有类型的超类",
		args: [ "name" ]
	} );
	Type.prototype = {
		constructor: Type,
		properties: function() {
			var a = [];
			for( var p in this ) {
				// 下划线开头属于私有属性
				if ( p.charAt( 0 ) != "_" ) {
					var o = toPropertyObject( this[p], p );
					o && a.push( o );
				}
			}
			// 顺序：数组->类型->属性->方法。类型相同按名称排序
			a.sort( function( o1, o2 ) {
				var z = o1.order - o2.order;
				if ( z ) {
					return z;
				}
				return o1.name > o2.name
					? 1
					: o1.name < o2.name
						? -1
						: 0;
			} );
			return a;
		},
		changeName: function( newName ) {
			nameManager.unregister( this.iid );
			this.name = newName;
			nameManager.register( this );
		}
	};
	
	function makeFunc( param ) {
		function F() {
			var func = arguments.callee;
			if ( SubScriptEngineInstance.Runtime.debugMode() ) {
				var args = [].concat( func.args );
				// 判定是否变长参数类型（变长参数用写到数组中的类型构造函数确定，长度范围是非负整数）
				var lastArg = args[ args.length - 1 ];
				if ( lastArg instanceof Array ) {
					args.pop();
					for( var i = 0, len = arguments.length - args.length; i < len; i++ ) {
						args.push( lastArg[0] );
					}
				}
				if ( args.length != arguments.length ) {
					throw new SubScriptEngineError( this.name + "的" + func.name + "方法参数错误" );
				} else {
					for( var i = 0; i < args.length; i++ ) {
						if ( arguments[i] === undefined || arguments[i]["constructor"] !== args[i] && !(arguments[i] instanceof args[i]) ) {
							throw new SubScriptEngineError( this.name + "的" + func.name + "方法参数错误" );
						}
					}
				}
				if ( func._debug ) {
					return func._debug.apply( this, Array.prototype.slice.call( arguments ) );
				}
			} else {
				return func.f.apply( this, Array.prototype.slice.call( arguments ) );
			}
		}
		mixin( F, {
			name: "匿名",
			description: "没有关于此方法的说明",
			args: [],
			returnType: undefined,
			f: function() {
				throw new SubScriptEngineError( "方法未实现" );
			},
			isMethod: true
		}, param );
		return F;
	}
	
	var Types = {};
		
	Types.Dashboard = makeType( {
		description: "仪表板",
		init: function() {
			this.Datasources = [];
			this.Pages = [];
			mixin( this.Datasources, {
				iid: getIID(),
				name: "Datasources",
				description: "数据源集合"
			} );
			mixin( this.Pages, {
				iid: getIID(),
				name: "Pages",
				description: "页集合",
				currentPageIndex: 0
			} );
			nameManager.register( this.Datasources );
			nameManager.register( this.Pages );
		}
	} );
	
	Types.Datasource = makeType( {
		description: "数据源",
		proto: {
			addFilter: makeFunc( {
				name: "addFilter",
				description: "为数据源加入过滤器，此方法将<strong>永久</strong>影响数据源的输出。<br/>方法原型：void addFilter(String filter1, String filter2, ..., String filterN);<br/>例：ds.addFilter(\"state_name = 'China'\");",
				// 变长形参（字符串）
				args: [ [ String ] ],
				f: function() {
					this.rt.ajax( {
						id: this.name,
						datasourceCommand: "addFilter",
						filter: Array.prototype.slice.call( arguments )
					} );
				}				
			} )
		}
	} );
	
	Types.Page = makeType( {
		description: "页",
		proto: {
			_events: [ {
				name: "load",
				caption: "载入（onload）"
			} ],
			bindEvent: makeFunc( {
				name: "bindEvent",
				description: "在页上绑定事件触发。<br/>方法原型：void bindEvent(String type, Function callback);<br/>例：Page.bindEvent(\"load\", function() { alert(\"Page is loaded successfully.\"); });",
				args: [ String, Function ],
				f: function( type, callback ) {
					this.$events = this.$events || {};
					if ( type == "load" ) {
						callback();
					}
				},
				_debug: function( type, callback ) {
					callback();
				}
			} )
		},
		init: function() {
			this.Layout = new Types.Layout( "Layout" );
		}
	} );
	
	Types.Layout = makeType( {
		description: "布局",
		init: function() {
			this.Cells = [];
			mixin( this.Cells, {
				iid: getIID(),
				name: "Cells",
				description: "单元格集合",
				getAnonymousCell: function( createNew ) {
					if ( !this.length && createNew || this.length && this[0].name != Constants.DEFAULT_ANONYMOUS_CELL_NAME ) {
						var cell = new Types.Cell( Constants.DEFAULT_ANONYMOUS_CELL_NAME );
						this.unshift( cell );
						return cell;
					} else if ( !this.length ) {
						return null;
					} else if ( this[0].name == Constants.DEFAULT_ANONYMOUS_CELL_NAME ) {
						return this[0];
					}
				}
			} );
			nameManager.register( this.Cells );
			this.HiddenArea = [];
			mixin( this.HiddenArea, {
				iid: getIID(),
				name: "HiddenArea",
				description: "隐藏组件区域"
			} );
			nameManager.register( this.HiddenArea );
		}
	} );
	
	Types.Dial = makeType( {
		description: "组件",
		proto: {
			show: makeFunc( {
				name: "show",
				description: "使组件可见。<br/>方法原型：void show();<br/>例：chart.show();",
				f: function() {
					if ( this.rt.td ) {
						this.rt.td.style.visibility = "visible";
					}
				}
			} ),
			hide: makeFunc( {
				name: "hide",
				description: "使组件隐藏。<br/>方法原型：void hide();<br/>例：chart.hide();",
				f: function() {
					if ( this.rt.td ) {
						this.rt.td.style.visibility = "hidden";
					}
				}				
			} )
		}
	} );
	
	Types.Cell = makeType( {
		description: "单元格",
		proto: {
			setValue: makeFunc( {
				name: "setValue",
				description: "将指定的组件设置在单元格中。<br/>方法原型：void setValue(Dial dial);<br/>例：cell.setValue(table);",
				args: [ Types.Dial ],
				f: function( dial ) {
					this.removeValue();
					var dial2 = clone( dial );
					dial2.iid = getIID();
					this._instanceName = dial2.name;
					this[ dial2.name ] = dial2;
					nameManager.register( dial2 );
					this.rt.setDial( dial2 );
				}
			} ),
			getValue: makeFunc( {
				name: "getValue",
				description: "获取单元格中的组件对象，若单元格中没有组件，返回null。<br/>方法原型：Dial getValue();<br/>例：var table = cell.getValue();",
				returnType: Types.Dial,
				f: function() {
					var instanceName = this._instanceName;
					return instanceName ? this[ instanceName ] : null;
				}
			} ),
			removeValue: makeFunc( {
				name: "removeValue",
				description: "移除单元格中的组件对象，若单元格中没有组件，则该方法不执行任何操作。<br/>方法原型：void removeValue();<br/>例：cell.removeValue();",
				f: function() {
					var instanceName = this._instanceName;
					if ( instanceName ) {
						var instance = this[ instanceName ];
						delete this[ instanceName ];
						delete this._instanceName;
						nameManager.unregister( instance.iid );
						this.rt.td.innerHTML = "";
					}
				}
			} )
		}
	} );
	
	Types.Dial.Text = makeType( {
		description: "文本组件",
		superType: new Types.Dial
	} );

	Types.Dial.Picture = makeType( {
		description: "图片组件",
		superType: new Types.Dial
	} );
	
	Types.Dial.Piece = makeType( {
		description: "片段组件",
		superType: new Types.Dial
	} );
	
	Types.Dial.Piece.StaticPiece = makeType( {
		description: "静态片段组件",
		superType: new Types.Dial.Piece
	} );
	
	Types.Dial.Piece.DynamicPiece = makeType( {
		description: "动态片段组件",
		superType: new Types.Dial.Piece
	} );
	
	Types.Dial.Table = makeType( {
		description: "列表组件",
		superType: new Types.Dial,
		proto: {
			refresh: makeFunc( {
				name: "refresh",
				description: "使用指定的过滤器刷新列表，指定的过滤器对数据源输出的影响只限于本次刷新操作。<br/>方法原型：void refresh(String filter1, String filter2, ..., String filterN);<br/>table.refresh(\"state_name = 'China'\");",
				// 变长形参（字符串）
				args: [ [ String ] ],
				f: function() {
					this.rt.ajax( {
						command: "refresh",
						filter: Array.prototype.slice.call( arguments )
					} );
				}
			} )
		}
	} );
	
	Types.Dial.Chart = makeType( {
		description: "图表组件",
		superType: new Types.Dial,
		proto: {
			refresh: makeFunc( {
				name: "refresh",
				description: "使用指定的过滤器刷新图表，指定的过滤器对数据源输出的影响只限于本次刷新操作。<br/>方法原型：void refresh(String filter1, String filter2, ..., String filterN);<br/>chart.refresh(\"state_name = 'China'\");",
				// 变长形参（字符串）
				args: [ [ String ] ],
				f: function() {
					this.rt.ajax( {
						command: "refresh",
						filter: Array.prototype.slice.call( arguments )
					} );
				}
			} )
		}
	} );
	
	Types.Dial.Input = makeType( {
		description: "交互组件",
		superType: new Types.Dial,
		proto: {
			bindEvent: makeFunc( {
				name: "bindEvent",
				description: "在交互组件上绑定事件触发。<br/>方法原型：void bindEvent(String type, Function callback);<br/>例：select.bindEvent(\"change\", function() { alert(\"select is changed.\"); });",
				args: [ String, Function ],
				f: function( type, callback ) {
					var e = this.rt.targetDOM;
					if ( e.attachEvent ) {
						e.attachEvent( "on" + type, callback );
					} else if ( e.addEventListener ) {
						e.addEventListener( type, callback, false );
					} else {
						e[ "on" + type ] = callback;
					}
					e.$events = e.$events || {};
					e.$events[ type ] = next( e.$events[ type ] || Z, callback );
				},
				_debug: function( type, callback ) {
					callback();
				}
			} ),
			trigger: makeFunc( {
				name: "trigger",
				description: "触发交互组件中绑定的指定类型的事件。若指定类型的事件有多个，则这些事件将被依序全部触发。<br/>方法原型：void trigger(String type);</br/>例：select.trigger(\"change\");",
				args:[ String ],
				f: function( type ) {
					var e = this.rt.targetDOM;
					e.$events = e.$events || {};
					( e.$events[ type ] || Z )();
				}
			} )
		}
	} );
	
	Types.Dial.Input.Select = makeType( {
		description: "下拉框交互组件",
		superType: new Types.Dial.Input,
		proto: {
			_events: [ {
				name: "change",
				caption: "改变（onchange）"
			} ],
			getSelectedIndex: makeFunc( {
				name: "getSelectedIndex",
				description: "获取下拉框当前选中条目的索引。<br/>方法原型：Number getSelectedIndex();<br/>例：var index = select.getSelectedIndex();",
				returnType: Number,
				f: function() {
					return this.rt.targetDOM.selectedIndex;
				}
			} ),
			setSelectedIndex: makeFunc( {
				name: "setSelectedIndex",
				description: "设定下拉框当前索引值。<br/>方法原型：void setSelectedIndex(Number index);<br/>例：select.setSelectedIndex(0);",
				args: [ Number ],
				f: function( index ) {
					this.rt.targetDOM.selectedIndex = index;
				}
			} ),
			getSelectedValue: makeFunc( {
				name: "getSelectedValue",
				description: "获取下拉框当前选中条目的值。<br/>方法原型：String getSelectedValue();<br/>例：var value = select.getSelectedValue();",
				returnType: String,
				f: function() {
					var e = this.rt.targetDOM;
					return e.options[ e.selectedIndex ].value;
				}
			} )
		}
	} );
	
	Types.Dial.Input.Button = makeType( {
		description: "按钮交互组件",
		superType: new Types.Dial.Input,
		proto: {
			_events: [ {
				name: "click",
				caption: "点击（onclick）"
			} ]
		}
	} );
	
	Types.Dial.Input.Checkbox = makeType( {
		description: "复选框交互组件",
		superType: new Types.Dial.Input,
		proto: {
			_events: [ {
				name: "click",
				caption: "勾选（onclick）"
			} ],
			getChecked: makeFunc( {
				name: "getChecked",
				description: "获取当前复选框状态。<br/>方法原型：boolean getChecked();<br/>例：var isChecked = checkbox.getChecked();",
				returnType: Boolean,
				f: function() {
					return this.rt.targetDOM.checked;
				}
			} ),
			setChecked: makeFunc( {
				name: "setChecked",
				description: "设置当前复选框状态。<br/>方法原型：void setChecked(false||true);<br/>例：checkbox.setChecked(false);",
				args: [ Boolean ],
				f: function(checked) {
					return this.rt.targetDOM.checked=checked;
				}
			} )
		}
	} );
	
	Types.Dial.Input.Radio = makeType( {
		description: "单选按钮交互组件",
		superType: new Types.Dial.Input,
		proto: {
			_events: [ {
				name: "click",
				caption: "单选（onclick）"
			} ],
			getSeletedIndex: makeFunc( {
				name: "getSeletedIndex",
				description: "获取单选按钮选中项序号。<br/>方法原型：Number getSeletedIndex();<br/>例：var index= radioGroup.getSeletedIndex();",
				returnType: Number,
				f: function() {
					var group_name=this.rt.targetDOM.name;
					var radio_group=document.getElementsByName(group_name);
					for(var i=0;i<radio_group.length;i++){
						if(radio_group[i].checked){
							return i;
						}
					}
				}
			} ),
			setSeletedIndex: makeFunc( {
				name: "setSeletedIndex",
				description: "设置单选按钮选中项。<br/>方法原型：void setSeletedIndex(index);<br/>例：radioGroup.setSeletedIndex(0);",
				args: [ Number ],
				f: function(index) {
					var group_name=this.rt.targetDOM.name;
					var radio_group=document.getElementsByName(group_name);
					radio_group[index].checked=true;
				}
			} ),
			getSeletedValue: makeFunc( {
				name: "getSeletedValue",
				description: "获取单选按钮选中项值。<br/>方法原型：String getSeletedValue();<br/>例：radioGroup.getSeletedValue();",
				returnType: String,
				f: function() {
					var group_name=this.rt.targetDOM.name;
					var radio_group=document.getElementsByName(group_name);
					for(var i=0;i<radio_group.length;i++){
						if(radio_group[i].checked){
							return radio_group[i].value;
						}
					}
				}
			} ),
			getItemCount: makeFunc( {
				name: "getItemCount",
				description: "获取单选按钮条目个数。<br/>方法原型：Number getItemCount();<br/>例：radioGroup.getItemCount();",
				returnType: Number,
				f: function() {
					var group_name=this.rt.targetDOM.name;
					var radio_group=document.getElementsByName(group_name);
					return radio_group.length;
				}
			} )
		}
	} );
	//滑动条
	Types.Dial.Input.Slider = makeType( {
		description: "滑动条交互组件",
		superType: new Types.Dial.Input,
		proto: {
			_events: [ {
				name: "mouseup",
				caption: "鼠标放开（onmouseup）"
			} ],
             getMaxValue  : makeFunc( {
				name: "getMaxValue",
				description: "获取滑动条最大值。<br/>方法原型：Number getMaxValue();<br/>例：var maxValue= slider1.getMaxValue();",
				returnType: Number,
				f: function() {
					var base_div=this.rt.targetDOM.id;
					var slider_id=base_div.substr("base_div_".length,base_div.length);
					for(var i=0;i<sliders.length;i++){
						var slider=sliders[i];
						if(slider.name==slider_id){
							return slider.maxValue;
						}
					}
					return 0;
				}
			} ),
			getMinValue : makeFunc( {
				name: "getMinValue",
				description: "获取滑动条最小值。<br/>方法原型：Number getMinValue();<br/>例：var minValue= slider1.getMinValue();",
				returnType: Number,
				f: function(index) {
					var base_div=this.rt.targetDOM.id;
					var slider_id=base_div.substr("base_div_".length,base_div.length);
					for(var i=0;i<sliders.length;i++){
						var slider=sliders[i];
						if(slider.name==slider_id){
							return slider.minValue;
						}
					}
					return 0;
				}
			} ),
			getValue: makeFunc( {
				name: "getValue",
				description: "获取滑动条当前值。<br/>方法原型：Number getValue();<br/>例：var value=slider1.getValue();",
				returnType: Number,
				f: function() {
					var base_div=this.rt.targetDOM.id;
					var slider_id=base_div.substr("base_div_".length,base_div.length);
					for(var i=0;i<sliders.length;i++){
						var slider=sliders[i];
						if(slider.name==slider_id){
							return slider.value;
						}
					}
					return 0;
				}
			} ),
			setValue : makeFunc( {
				name: "setValue",
				description: "设置滑动条当前值。<br/>方法原型：setValue();<br/>例：slider1.setValue();",
				args: [ Number ],
				f: function(value) {
					var base_div=this.rt.targetDOM.id;
					var slider_id=base_div.substr("base_div_".length,base_div.length);
					for(var i=0;i<sliders.length;i++){
						var slider=sliders[i];
						if(slider.name==slider_id){
							slider.setValue(slider,value,"reset");
						}
					}
				}
			} ),
			getDistance  : makeFunc( {
				name: "getDistance",
				description: "获取滑动条间隔值。<br/>方法原型：Number getDistance();<br/>例 var distance=slider1.getDistance();",
				returnType: Number,
				f: function() {
					var base_div=this.rt.targetDOM.id;
					var slider_id=base_div.substr("base_div_".length,base_div.length);
					for(var i=0;i<sliders.length;i++){
						var slider=sliders[i];
						if(slider.name==slider_id){
							return slider.distance;
						}
					}
					return 0;
				}
			} )
			
		}
	} );
	Types.Dial.URL = makeType( {
		description: "网页组件",
		superType: new Types.Dial
	} );
	
	Types.Dial.KPI = makeType( {
		description: "KPI组件",
		superType: new Types.Dial
	} );
	//bruce_sha 2010-01-14
	Types.Dial.KPIMonitor = makeType( {
		description: "指标监控组件",
		superType: new Types.Dial
	} );
	
	function NameManager() {
		this.namehash = {};
		this.iidhash = {};
	}
	NameManager.prototype = {
		lookupName: function( name ) {
			return this.namehash[ name ];
		},
		lookupIID: function( iid ) {
			return this.iidhash[ iid ];
		},
		lookup: function( f ) {
			var a = [];
			for( var p in this.iidhash ) {
				f( this.iidhash[p] ) && a.push( this.iidhash[p] );
			}
			return a;
		},
		register: function( instance ) {
			this.iidhash[ instance.iid ] = instance;
			if ( !this.namehash[ instance.name ] ) {
				this.namehash[ instance.name ] = [ instance ];
			} else {
				this.namehash[ instance.name ].push( instance );
			}
		},
		unregister: function( iid ) {
			var instance = this.iidhash[ iid ];
			delete this.iidhash[ iid ];
			var instances = this.namehash[ instance.name ];
			if ( instances.length == 1 ) {
				delete this.namehash[ instance.name ];
			} else {
				var index = _.indexOf( instances, instance );
				instances.splice( index, 1 );
			}
		},
		getConstructContextScript: function( scriptEngineRefString ) {
			var a = [];
			for( var p in this.namehash ) {
				if ( p != Constants.DEFAULT_ANONYMOUS_CELL_NAME ) {
					a.push( p + " = " + scriptEngineRefString + ".Runtime.NameManager.lookupName(\"" + p + "\")[0]" );
				}
			}
			return "var " + a.join( ",\n\t" ) + ";";
		}
	};	
	var nameManager = new NameManager;
	
	function ScriptManager( iidhash ) {
		this.iidhash = iidhash || {};
	}
	ScriptManager.prototype = {
		getScript: function( o ) {
			var iid = o instanceof Type ? o.iid : o;
			return this.iidhash[ iid ];
		},
		setScript: function( o, script ) {
			var iid = o instanceof Type ? o.iid : o;
			this.iidhash[ iid ] = script;
		},
		clone: function() {
			return new ScriptManager( clone( this.iidhash ) );
		},
		exportAll: function() {
			var a = [];
			for( var iid in this.iidhash ) {
				a.push( {
					instance: nameManager.lookupIID( iid ),
					script: this.iidhash[ iid ]
				} );
			}
			return a;
		}
	};
	
	function SubScriptEngineError( message ) {
		this.name = "SubScriptEngineError";
		this.message = message;
	}
	SubScriptEngineError.prototype = new Error;
	
	function Runtime() {
		this.NameManager = nameManager;
		this.ScriptManager = new ScriptManager;
		this.Dashboard = new Types.Dashboard( "Dashboard" );
		this.Dashboard.Pages.push( new Types.Page( "Page" ) );
	}
	Runtime.prototype = {
		
		toPropertyObject: toPropertyObject,
		
		isType: function( x ) {
			return x instanceof Type;
		},
		
		isArray: function( x ) {
			return x instanceof Array;
		},
		
		getCurrentPage: function() {
			var pages = this.Dashboard.Pages;
			return pages[ pages.currentPageIndex ];
		},
		
		getCurrentCells: function() {
			return this.getCurrentPage().Layout.Cells;
		},
		
		getCurrentHiddenArea: function() {
			return this.getCurrentPage().Layout.HiddenArea;
		},
		
		debugMode: function( inDebugMode ) {
			if ( typeof inDebugMode == "boolean" ) {
				this.__debugMode__ = inDebugMode;
			}
			return !!this.__debugMode__;
		},
		
		evalDial: function( type, name ) {
			var instance = null;
			var dial = Types.Dial;
			switch ( type ) {
				case "text":
					instance = new dial.Text( name );
					break;
				case "picture":
					instance = new dial.Picture( name );
					break;
				case "piece":
					instance = new dial.Piece( name );
					break;
				case "table":
					instance = new dial.Table( name );
					break;
				case "chart":
					instance = new dial.Chart( name );
					break;
				case "select":
					instance = new dial.Input.Select( name );
					break;
				case "button":
					instance = new dial.Input.Button( name );
					break;
				case "checkbox":
					instance = new dial.Input.Checkbox( name );
					break;
				case "radiobox":
					instance = new dial.Input.Radio( name );
					break;
				case "slider":
					instance = new dial.Input.Slider( name );
					break;
				case "url":
					instance = new dial.URL( name );
					break;
				case "kpi":
					instance = new dial.KPI( name );
					break;
					//bruce_sha 2010-01-14
				case "KPIMonitor":
					instance = new dial.KPIMonitor( name );
					break;					
			}
			return instance;
		}
	};
	
	var Constants = {
		DEFAULT_ANONYMOUS_CELL_NAME: "[Anonymous Cell]"
	};
	
	function SubScriptEngine() {
		this.Runtime = new Runtime;
	}
	SubScriptEngine.prototype = {
		Constants: Constants,
		Types: Types,
		Error: SubScriptEngineError,
		anotherInstance: ScriptEngineConstructor
	};
	
	var SubScriptEngineInstance = new SubScriptEngine;
	
	return SubScriptEngineInstance;
})();