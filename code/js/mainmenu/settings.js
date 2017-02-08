( function () {	
	modifyElement(document, '#settingsPage.ui-page', function(page) {
		modifyInnerHtml(page, '.ui-title', TIZEN_L10N.MAIN_MENU_SETTINGS);
		modifyInnerHtml(page, '.ui-listview a#units span#text', TIZEN_L10N.SETTINGS_MENU_UNITS);
		modifyInnerHtml(page, '.ui-listview a#timeformat span#text', TIZEN_L10N.SETTINGS_MENU_TIMEFORMAT);
		modifyInnerHtml(page, '.ui-listview a#information span#text', TIZEN_L10N.SETTINGS_MENU_INFORMATION);
		
		//Just to print in log current value
		storage.settings.timeformat.get();
	});
} () );
