/**
 * 范围筛选对话框对应的js
 * add by stone_zheng 2009/06/26
 */

var param;		//序事簿传入的参数
var dateMax;	//最小范围日期控件实例
var dateMin;	//最大范围日期控件实例
function window_onload() {
	param = window.dialogArguments;
	param.cancel = true;
	memo.value = "筛选：";
	memo.value += "\n    通过设置当前列的取值范围，减少列表的数据量，请选择适当的取值范围。";
	memo.value += "\n    过滤方式可以是选定，也可以是排除。";
	memo.value += "\n    选择最小值，表示不关注值的下限，同理选择最大值，表示不关注值的上限。";
	memo.value += "\n    输入的值是被包含的，也就是说条件是大于等于或者是小于等于。";
	memo.readOnly = true;
	//显示当前过滤列名
	filterColumn.innerHTML = param.filtercolumn;
	
	//装载过滤方式
	if(param.filterValue)
		filterMethod.selectedIndex = (param.filterValue.type ? 0 : 1);
	rangeMin[1].checked = true;
	rangeMax[1].checked = true;
	if (param.columnType == "number" ) {
		divMin.innerHTML = '<input id="inputMin" type="text" size="25" MAXLENGTH="12"></input>';
		divMax.innerHTML = '<input id="inputMax" type="text" size="25" MAXLENGTH="12"></input>';
		inputMin.disabled = true;
		inputMax.disabled = true;
		if( param.filterValue && param.filterValue.condition ) {
			var len = param.filterValue.condition.length;
			for(var i = 0 ; i < len ; i++ ) {
				if (param.filterValue.condition[i].operator == ">=") {
					rangeMin[0].checked = true;
					inputMin.value = param.filterValue.condition[i].value;
					inputMin.disabled = false; 
				}else if (param.filterValue.condition[i].operator == "<=") {
					rangeMax[0].checked = true;
					inputMax.value = param.filterValue.condition[i].value;
					inputMax.disabled = false; 
				}
			}
		}
	} else if( param.columnType == "date" ) {
		if( param.filterValue && param.filterValue.condition ) {
			var len = param.filterValue.condition.length;
			for(var i = 0 ; i < len ; i++ ) {
				if (param.filterValue.condition[i].operator == ">=") {
					rangeMin[0].checked = true;
					var d = new Date(param.filterValue.condition[i].year,param.filterValue.condition[i].month-1,param.filterValue.condition[i].day);
					dateMin = showDatePicker( divMin, d );
					dateMin.f7.setDisabled(false);
				}else if (param.filterValue.condition[i].operator == "<=") {
					var d = new Date(param.filterValue.condition[i].year,param.filterValue.condition[i].month-1,param.filterValue.condition[i].day);
					rangeMax[0].checked = true;
					dateMax = showDatePicker( divMax, d );
					dateMax.f7.setDisabled(false);
				}
			}
		}
		if(!dateMin) {
			dateMin = showDatePicker( divMin, new Date() );
			dateMin.f7.setDisabled(true);
		}
		if(!dateMax) {
			dateMax = showDatePicker( divMax, new Date() );
			dateMax.f7.setDisabled(true);
		}
	}
}
	
function showDatePicker( divParent, date ) {
	var dp = Sue.ui.ext.datePicker( {
		date: date,
		click: function() {
			o.value = f7.input.value = _.format( "%s-%s-%s", dp.y, dp.m, dp.d );
			o.date = new Date( dp.y, dp.m - 1, dp.d );
			o.y = dp.y; o.m = dp.m; o.d = dp.d;
		},
		dragable: false
	} );
	
	var f7 = Sue.ui.ext.f7( {
		parent: divParent,
		readonly: true
	} );
	
	var o = {
		type: "date",
		value: null,
		f7: f7,
		date: date,
		y: date.getYear(),	
		m: date.getMonth() + 1,
		d: date.getDate()
	};
	bi.updateToPortalStyleButton( dp.panel.root );
	_.bindEvent( f7.btn, "click", function() {
		displayF7Panel( dp.panel, f7.root );
	} );
	o.value = f7.input.value = _.format( "%s-%s-%s", date.getYear(), date.getMonth() + 1, date.getDate() );
	
	return o;

}
	
function displayF7Panel( panel, f7root ) {
	var xy = _.xy( f7root ),
		lft = xy.x + 1, tp = xy.y + f7root.clientHeight;
	_.copyStyle( panel.root, "left,top", [ lft + "px", tp + "px" ] );
	panel.show();
	var delta = tp + panel.root.clientHeight - document.body.scrollTop - document.body.clientHeight + 0;
	// 若panel底边越界，则panel上调至与底边平齐
	if ( delta > 0 ) {
		panel.root.style.top = parseInt(panel.root.style.top) - delta;
	}
}

function minClick() {
	if (param.columnType == "date") {
		//日期控件的处理
		if( rangeMin[1].checked ) {
			dateMin.f7.setDisabled(true);
		}
		else if( rangeMin[0].checked ) {
			dateMin.f7.setDisabled(false);
		}
	} else if (param.columnType == "number" ) {
		//文本输入框的处理
		if( rangeMin[1].checked ) {
			inputMin.disabled = true;
		}
		else if ( rangeMin[0].checked ) {
			inputMin.disabled = false;
		}
	}
}
	
function maxClick() {
	if (param.columnType == "date") {
		//日期控件的处理
		if( rangeMax[1].checked ) {
			dateMax.f7.setDisabled(true);
		}
		else if( rangeMax[0].checked ) {
			dateMax.f7.setDisabled(false);
		}
	} else if (param.columnType == "number" ) {
		//文本输入框的处理
		if( rangeMax[1].checked ) {
			inputMax.disabled = true;
		}
		else if ( rangeMax[0].checked ) {
			inputMax.disabled = false;
		}
	}
}

//对日期进行校验
function verify() {
	if (param.columnType == "date") {
		//检查起始时间在是否大于终时间
		if( rangeMin[0].checked && rangeMax[0].checked ) {
			if( compareDate(dateMax,dateMin) < 0 ) {
				alert("结束日期小于起始日期，您输入的范围不正确，请重新输入！");
				return false;
			}
		}	
	}
	return true;
}

function compareDate(max, min) {
	if( max.y != min.y )
	   return max.y - min.y ;
	if( max.m != min.m )
	   return max.m - min.m ;
	if( max.d != min.d )
	   return max.d - min.d;
	return 0;	//相等
}
	
function onok() {
	if(!verify())
		return;
	if(!param.filterValue) { 
		param.filterValue = {};
	}
	
	param.filterValue.type = (filterMethod.selectedIndex == 0);
	
	param.filterValue.condition = new Array();
	var counter = 0;
	var value;
	if( rangeMin[0].checked ) {
		if(param.columnType == "number") {
			value = parseFloat(inputMin.value);
			if(!value) {
				alert("请输入正确的最小值!");
				inputMin.focus();
				return false;
			}
			param.filterValue.condition[counter] = {
						operator: ">=",
						value: value
					}
			counter++;
		} else if (param.columnType == "date") {
			param.filterValue.condition[counter] = {
						operator: ">=",
						value: "{" + dateMin.value + "}",
						date: dateMin.date,
						year: dateMin.y,
						month: dateMin.m,
						day: dateMin.d
					}
			counter++;
		}	
	}
	if( rangeMax[0].checked ) {
		if(param.columnType == "number") {
			value = parseFloat(inputMax.value);
			if(!value) {
				alert("请输入正确的最大值!");
				inputMax.focus();
				return false;
			}
			param.filterValue.condition[counter] = {
						operator:"<=",
						value:value
					}
			counter++;
		} else if (param.columnType == "date") {
			param.filterValue.condition[counter] = {
						operator: "<=",
						value: "{" + dateMax.value + "}",
						date: dateMax.date,
						year: dateMax.y,
						month: dateMax.m,
						day: dateMax.d
					}
			counter++;
		}
	}
	if(counter == 0) {
		alert("请输入过滤范围，如果要取消当前的过滤条件，请退出后在过滤菜单选择取消过滤!")
		return;
	}
	param.cancel = false;
	window.close();	
}
	
function oncancel() {
	window.close();
}
