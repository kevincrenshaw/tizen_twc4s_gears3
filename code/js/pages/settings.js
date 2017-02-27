/* jshint esversion: 6 */
define([], function() {
	return {
		pagebeforeshow: function(e) {			
			modifyInnerHtml(e.target, '.ui-title', TIZEN_L10N.MAIN_MENU_SETTINGS);
			modifyInnerHtml(e.target, '.ui-listview a#units div#text', TIZEN_L10N.SETTINGS_MENU_UNITS);
			modifyInnerHtml(e.target, '.ui-listview a#information div#text', TIZEN_L10N.SETTINGS_MENU_INFORMATION);
		},
	};
});