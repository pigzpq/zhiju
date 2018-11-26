/**
 * Framework Sue DEFAULT Configure
 * @author Casey Lai
 * @since 2008-3-11
 */

if ( this.Sue && !Sue.config ) {
	
	Sue.config = {
		
		ajax_timeout                 : 300000,
		ajax_onTimeout               : function( cfg ) {
			bi.portalDialog( "请求超时。可能服务器繁忙或者网络连接存在问题。" );
			cfg.afterEnd && cfg.afterEnd( cfg );
		},
		ajax_onServerException       : function( e ) {
			bi.portalDialog( e.message );
		},
		ajax_beforeStart             : function( cfg ) {
			// 请求开始前锁屏，显示进度条
			cfg.callback && ( cfg.bar = bi.progressBar() );
			document.body.style.cursor = "wait";
		},
		ajax_afterEnd                : function( cfg ) {
			cfg.bar && cfg.bar.remove();
			delete cfg.bar;
			document.body.style.cursor = "auto";
			bi.tryResetBaseIFrameHeight();
		},
		//ajax_url                   : null,
		//ajax_json                  : {},
		//ajax_async                 : true,
		//ajax_nocache               : false,
		//ajax_callback              : null,
		//ajax_onStateChange         : null,
		//ajax_onNot200Status        : null,
		//ajax_evalExceptionStrategy : "throw",
		
		ui_template_path             : "../uit/",
		
		ui_tree_icon_path            : "../img/ui-web/tree/",
		ui_menu_icon_path            : "../img/ui-web/menu/",
		ui_menubar_icon_path         : "../img/ui-web/menubar/",
		ui_button_icon_path          : "../img/ui-web/button/",
		ui_table_icon_path           : "../img/ui-web/table/",
		ui_menu_zindex               : 50,
		ui_menubar_zindex            : 50,
		ui_ext_dialog_zindex         : 9999, // 模态对话框，层次设置为最高
		ui_ext_filter_icon_path      : "../img/ui-web/ext/filter/",
		ui_ext_datepicker_icon_path  : "../img/ui-web/ext/datepicker/",
		ui_ext_tabbedpanel_icon_path : "../img/ui-web/ext/tabbedpanel/",
		ui_ext_dialog_icon_path      : "../img/ui-web/ext/dialog/",
		ui_ext_pageflipper_icon_path : "../img/ui-web/ext/pageflipper/",
		bi_progress_picture_path     : "../img/ui-web/progress.gif",
		bi_message_box_path          : "../js/msgbox.htm",
		bi_message_table_icon_prefix : "../img/ui-web/message_table_",
		
		// 色彩方案配置
		colorScheme: {
			blue: {
				name: "blue",
				1: "#3086CB", 2: "#5393CB",	3: "#EAF2F8", 4: "#8DB2D3",	5: "#0062AB",
				6: "#D2E4F3", 7: "#EDF7FF",	8: "#0063AB", 9: "#003E6B",	10: "#107DB6",
				11: "#015094", 12: "#FFDFB2", 13: "#CBE8FF", 14: "#E0EAF5",	15: "#0F498C",
				16: "#4586C6", 17: "#0061AA", 18:"#DBE5EE", 19: "#4194D0", 20: "#EAF2F8"
			},
			red: {
				name: "red",
				1: "#B19092", 2: "#B19092",	3: "#FCF1EC", 4: "#B19092",	5: "#840707",
				6: "#EED9CE", 7: "#FDF7EE", 8: "#AF0101", 9: "#5F0707",	10: "#BF554F",
				11: "#000000", 12: "#FBBA9C", 13: "#FFD3C3", 14: "#FEFAF8",	15: "#933131",
				16: "#000000", 17: "#5F0707", 18:"#F2EAE6", 19: "#D37F72", 20: "#FEFAF6"
			},
			orange: {
				name: "orange",
				1: "#ECBB88", 2: "#A88F79", 3: "#F0F0F0", 4: "#B19984",	5: "#525252",
				6: "#F1E1D3", 7: "#FDF7EE",	8: "#A26018", 9: "#5F3707",	10: "#DA7820",
				11: "#525252", 12: "#F8C596", 13: "#F1DFCB", 14: "#FEFAF8",	15: "#A26018",
				16: "#000000", 17: "#A26018", 18:"#F7F0E8", 19: "#D3A272", 20: "#F4F4F4"
			},
			green: {
				name: "green",
				1: "#A8C1A9", 2: "#9FB2A2",	3: "#E4F0E9", 4: "#9FB2A2",	5: "#014A0E",
				6: "#CAE9C9", 7: "#E6F3E7",	8: "#268831", 9: "#015513",	10: "#348841",
				11: "#007A1A", 12: "#BCDBBB", 13: "#CFEEB3", 14: "#EEF8F0",	15: "#015513",
				16: "#007A1A", 17: "#015513", 18:"#DFEBE4", 19: "#51A659", 20: "#F3FAF6"
			}
		},
		setColorScheme: function( schemeName ) {
			var colorScheme = Sue.config.colorScheme[ schemeName ];
			if ( !colorScheme ) {
				throw new Error( "SueError: Unknown color scheme" );
			}
			Sue.config.cs = colorScheme;
		}
	};
	
	// 读取cookie，获得色彩方案
	var cookie = document.cookie;
	var portalColorSchemeName = "";
	try {
		portalColorSchemeName = cookie.match( /BI_COLOR_SCHEME_NAME\=(\w+);/ )[1];
	} catch ( e ) {		
	}
	// 设置一个默认的色彩方案
	Sue.config.cs = Sue.config.colorScheme[ portalColorSchemeName || "blue" ];
}