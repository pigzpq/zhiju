/**
 * 序事簿筛选的文本选择框对应的js
 * add by stone_zheng 2009/08/26
 */
 
var param;	//序事簿传入的参数	
function window_onload() {
	param = window.dialogArguments;
	filterValues.style.width = "100%";
	param.cancel = true;
	memo.value = "筛选：";
	memo.value += "\n    不连续的值取值来源于当前整个列表所有筛选条件下(包括本列的筛选条件)的该列的唯一值(相同值只出现一次)，并且最多只选择1000个值。";
	memo.value += "\n    如果你想重新筛选，可以针对已筛选的列取消筛选，然后再重新进入筛选界面。";
	memo.value += "\n    过滤方式可以是选定，也可以是排除。";
	memo.readOnly = true;
	filterColumn.innerHTML = param.filtercolumn;
	filterValues.innerHTML = _checkbox( "filter_list", param.allcolumn, param.columnvalues, false); 
}
	
function checkValue(all) {
	var o = filterValues.children;
    for(var i = 0; i < o.length; i++){ 
        o[i].children[0].checked = all;
    } 
}

function onok() {
	var o = filterValues.children;
	var len = o.length;
	var first = true;
	param.ret = "";
	for( var i = 0; i < len; i++) {
		if( o[i].children[0].checked ) {
			if( first )
				first = false;
			else
				param.ret += "\1";     
			param.ret +=  o[i].children[0].value;
		}
	}
	if( param.ret == "" ) {
		alert( "请至少选择一个过滤项，否则无任何筛选意义!" );
		return;
	}
	param.filterType = (filterMethod.selectedIndex == 0);
	param.cancel = false;
	window.close();	
}

function oncancel() {
	param.ret = null;
	window.close();
}

function HtmlEncode(text) { 
    return text.replace(/&/g, '&amp').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
} 

/**
 *  构建一个带checkbox的多选列表框 
 */
function _checkbox( name, str, defv, exclude ) {
	var arr = str.split("\1"); 
	var ret = "";
	var ck="",bc="";
	for(var i = 0;i < arr.length; i++){ 
    	var thisarr = arr[i].split("\2"); 
    	if ( thisarr[0].length > 0 ) {
        	var t = (thisarr.length == 2) ? thisarr[0] : arr[i]; 
        	var v = (thisarr.length == 2) ? thisarr[1] : arr[i];
        	var find = ("\1" + HtmlEncode(defv).toLowerCase()+"\1").replace(/ \1/g, '\1').indexOf( "\1" + v.toLowerCase() + "\1" ) != -1; 
        	if( (find && !exclude) || (!find && exclude) ) {
        		ck = " checked";
        		cls = "cked";
        	} else {
        		ck = "";
        		cls = "nock";
        	} 
        	var thisstr = "<label class=\"" + cls + "\" for=\"i_" 
        		+ name + "_" + i + "\" id=\"l_" + name + "_" + i + "\">"; 
        	thisstr += "<input class=\"checkbox\" onpropertychange=\"document.getElementById('l_"
        		+ name + "_" + i + "').className=(document.getElementById('i_" 
        		+ name + "_" + i + "').checked)?'cked':'nock';\" onclick=\"document.getElementById('l_"
        		+ name + "_" + i + "').className=(document.getElementById('i_"
        		+ name + "_" + i + "').checked)?'cked':'nock';\" type=\"checkbox\""
        		+ ck + " name=\"" + name + "\" id=\"i_" + name + "_"
        		+ i + "\" value=\"" + HtmlEncode(v) + "\" \/> "; 
        	thisstr += HtmlEncode(t) + "</label>";
        	ret += thisstr;
        } 
    }
    return ret; 
}
