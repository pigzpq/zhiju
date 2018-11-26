//肤色样式（公用部分请勿修改）
function setSkin()
  {
    // 读取cookie，获得色彩方案
	var cookie = document.cookie;
	var portalColorSchemeName = "";
	try {
		portalColorSchemeName = cookie.match( /BI_COLOR_SCHEME_NAME\=(\w+);/ )[1];
	} catch ( e ) {		
	}
	// 设置色彩方案
  if(portalColorSchemeName=="blue"){	
	document.styleSheets["bi_skin"].rules[0].style.backgroundColor="#E0EAF5"; //topDivcss
	document.styleSheets["bi_skin"].rules[1].style.border="solid 1px #3F91d0";//divcss
	document.styleSheets["bi_skin"].rules[2].style.border="solid 1px #3F91d0";//inputcss
	document.styleSheets["bi_skin"].rules[4].style.backgroundColor="#e7f3f8";//trcss_2
	document.styleSheets["bi_skin"].rules[5].style.	backgroundImage="url(../img/ui-web/table/command_bg_blue.gif)";//headercss
  }else if(portalColorSchemeName=="orange"){
    document.styleSheets["bi_skin"].rules[0].style.backgroundColor="#fefaf8";
	document.styleSheets["bi_skin"].rules[1].style.border="solid 1px #F09334";
	document.styleSheets["bi_skin"].rules[2].style.border="solid 1px #F09334";
	document.styleSheets["bi_skin"].rules[4].style.backgroundColor="#fdf9f4";
	document.styleSheets["bi_skin"].rules[5].style.backgroundImage="url(../img/ui-web/table/command_bg_orange.gif)";
  }else if(portalColorSchemeName=="green"){
  	document.styleSheets["bi_skin"].rules[0].style.backgroundColor="#EEF8F0";
	document.styleSheets["bi_skin"].rules[1].style.border="solid 1px #2B873A";
	document.styleSheets["bi_skin"].rules[2].style.border="solid 1px #2B873A";
	document.styleSheets["bi_skin"].rules[4].style.backgroundColor="#effeea";
	document.styleSheets["bi_skin"].rules[5].style.backgroundImage="url(../img/ui-web/table/command_bg_green.gif)";
  }else if(portalColorSchemeName=="red"){
  	document.styleSheets["bi_skin"].rules[0].style.backgroundColor="#fefaf8";
	document.styleSheets["bi_skin"].rules[1].style.border="solid 1px #982812";
	document.styleSheets["bi_skin"].rules[2].style.border="solid 1px #982812";
	document.styleSheets["bi_skin"].rules[4].style.backgroundColor="#fff3ed";
	document.styleSheets["bi_skin"].rules[5].style.backgroundImage="url(../img/ui-web/table/command_bg_red.gif)";
  }

}