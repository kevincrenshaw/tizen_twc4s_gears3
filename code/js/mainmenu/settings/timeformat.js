( function () {	
	modifyElement(document, '#settingsTimeFormatPage.ui-page', function(page) {
		//Localize text
		modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_TIMEFORMAT);
		
		addGenericHandlerForSettingPageWithRadioButtons(page,
				storage.settings.timeformat,
				function(el) { return el.name === 'timeformat-radio'; });
	});
} () );
