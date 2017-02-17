( function () {	
	modifyElement(document, '#settingsPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				//Localize
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.MAIN_MENU_SETTINGS);
				modifyInnerHtml(page, '.ui-listview a#units div#text', TIZEN_L10N.SETTINGS_MENU_UNITS);
				modifyInnerHtml(page, '.ui-listview a#information div#text', TIZEN_L10N.SETTINGS_MENU_INFORMATION);
			});
	});
} () );
