/**
 * 排序对话框的js
 * add by stone_zheng 2009/08/26
 */	
	
var param;	//传入的参数
function window_onload() {
	param = window.dialogArguments;
	param.cancel = true;
	memo.value = "排序排名：";
	memo.value += "\n    通过选择排序的列或者选择排序的条件，重新调整数据行的先后顺序。";
	memo.value += "\n    打破维度层级关系是指具有层次结构的维度在排序后是否保持原有父子关系。";
	memo.value += "\n    前面几行需要输入一个自然数字，比如10，表示显示前10行。";
	memo.value += "\n    前百分比需要输入一个0-100内的数值，返回最顶端的元素，这些元素的累积合计至少为指定的百分比。";
	memo.value += "\n    前总和需要输入一个数值，返回最顶端的元素，这些元素的累积合计至少为指定的值。";
	memo.readOnly = true;
	
	//加载selColumn，用于排序的列
	var c = param.sortColumnsCaption.split( "\2" );
	var v = param.sortColumnsValue.split( "\2" ); 
	for ( var i = 0; i < c.length; i++ ) {
		var oOption = document.createElement("OPTION");
		selColumn.options.add(oOption);
		oOption.innerText = c[i].replace("\1",",");
		oOption.value = v[i];
	}
	selColumn.selectedIndex = param.sortPosition;
	chkUse.checked = param.sort;
	
	txtCount.disabled = true;
	txtPercent.disabled = true;
	txtSum.disabled = true;
	var asc = false;
	var _break = false; 
	var breakDisabled = false;
	switch (param.sortMode) {
		case 1:
			asc = true;
			break;
		case 2:
			break;
		case 3:
			asc = true;
			_break = true;
			break;
		case 4:
			_break = true;
			break;
		case 5:
		case 6:
			_break = true;
			asc = (param.sortMode == 6);  
			sortCount.checked = true;
			breakDisabled = true;
			txtCount.disabled = false;
			txtCount.value = param.sortParam;
			break;
		case 7:
		case 8:
			_break = true;
			asc = (param.sortMode == 8);
			breakDisabled = true;		
			sortPercent.checked = true;
			chkBreak.disabled = true;
			txtPercent.disabled = false;
			txtPercent.value = param.sortParam;
			break;
		case 9:
		case 10:
			_break = true;
			asc = (param.sortMode == 10);
			breakDisabled = true;
			sortSum.checked = true;
			txtSum.disabled = false;
			txtSum.value = param.sortParam;
			break;
		default:
			break;
	}

	if (_break) {
		chkBreak.checked = true;
	}
	
	if (breakDisabled) {
		chkBreak.disabled = true;
	}
	
	if (asc) {
		orderAsc[0].checked = true;
	} else {
		orderAsc[1].checked = true;
	}
	
}

function verify() {

	if( selColumn.selectedIndex == -1 ) {
		alert("请指定用来排序的列!");
		return false;
	}
	
	if( sortCount.checked ) {
		var value = parseInt(txtCount.value) 
		if ( !value || value <= 0 ) {
			alert("请输入正确的排名值(大于0的自然数)!");
			txtCount.focus();
			txtCount.select();
			return false;
		}
	} else if( sortPercent.checked ) {
		var value = parseFloat(txtPercent.value) 
		if ( !value || value <= 0.0 || value > 100.0) {
			alert("请输入正确的百分比(大于0小于100的数值)!");
			txtPercent.focus();
			txtPercent.select();
			return false;
		}
	} else if( sortSum.checked ) {
		var value = parseFloat(txtSum.value) 
		if ( !value ) {
			alert("请输入正确的总和值!");
			txtSum.focus();
			txtSum.select();
			return false;
		}
	}
	return true;
}

function onok() {
	if ( !verify() ) {
		return;
	}
	param.sort = chkUse.checked;
	param.sortPosition = selColumn.selectedIndex;
	
	var asc = (orderAsc[0].checked ? true : false);
	if( sortCount.checked ) {
		param.sortMode = (asc ? 6 : 5);
		param.sortParam = parseInt(txtCount.value);		
	} else if ( sortPercent.checked ) {
		param.sortMode = (asc ? 8 : 7);
		param.sortParam = parseFloat(txtPercent.value);
	} else if ( sortSum.checked ) {
		param.sortMode = (asc ? 10 : 9);
		param.sortParam = parseFloat(txtSum.value);
	} else {
		if ( chkBreak.checked ) {
			param.sortMode = (asc ? 3 : 4);
		} else {
			param.sortMode = (asc ? 1 : 2);
		}
	}
	param.cancel = false;
	window.close();	
}

function sortCountClick() {
	if(sortCount.checked) {
		sortPercent.checked = false;
		sortSum.checked = false;
		chkBreak.disabled = true;
		chkBreak.checked = true;
		txtCount.disabled = false;
		txtPercent.disabled = true;
		txtSum.disabled = true;
	} else {
		chkBreak.disabled = false;
		txtCount.disabled = true;
	}
}

function sortPercentClick() {
	if(sortPercent.checked) {
		sortCount.checked = false;
		sortSum.checked = false;
		chkBreak.disabled = true;
		chkBreak.checked = true;
		txtCount.disabled = true;
		txtPercent.disabled = false;
		txtSum.disabled = true;
	} else {
		chkBreak.disabled = false;
		txtPercent.disabled = true;
	}
}

function sortSumClick() {
	if(sortSum.checked) {
		sortPercent.checked = false;
		sortCount.checked = false;
		chkBreak.disabled = true;
		chkBreak.checked = true;
		txtCount.disabled = true;
		txtPercent.disabled = true;
		txtSum.disabled = false;
	} else {
		chkBreak.disabled = false;
		txtSum.disabled = true;
	}
	
}

function oncancel() {
	window.close();
}
	
