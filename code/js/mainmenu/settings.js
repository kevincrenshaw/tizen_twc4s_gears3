( function () {	
	modifyElement(document, '#settingsPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				modifyInnerHtml(document, '#settingsPage.ui-page .ui-title', TIZEN_L10N.MAIN_MENU_SETTINGS);
				modifyInnerHtml(document, '#settingsPage.ui-page .ui-listview a#units span#text', TIZEN_L10N.SETTINGS_MENU_UNITS);
				modifyInnerHtml(document, '#settingsPage.ui-page .ui-listview a#timeformat span#text', TIZEN_L10N.SETTINGS_MENU_TIMEFORMAT);
				modifyInnerHtml(document, '#settingsPage.ui-page .ui-listview a#information span#text', TIZEN_L10N.SETTINGS_MENU_INFORMATION);
				
				//Just to print in log current value
				storage.settings.timeformat.get();
			});
	});
} () );
