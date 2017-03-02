/* jshint esversion: 6 */
define(['utils/utils'], function(utils) {
	var destroyable;
	
	return {
		pagebeforeshow: function(ev) {	
			const page = ev.target;
			
			utils.modifyInnerHtml(page, '.ui-title', TIZEN_L10N.MAIN_MENU_SETTINGS);
			utils.modifyInnerHtml(page, '.ui-listview a#units div#text', TIZEN_L10N.SETTINGS_MENU_UNITS);
			utils.modifyInnerHtml(page, '.ui-listview a#information div#text', TIZEN_L10N.SETTINGS_MENU_INFORMATION);
		},
	};
});