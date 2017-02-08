( function () {	
	modifyElement(document, '#settingsUnitsTemperaturePage.ui-page', function(page) {
		//Localize text
		modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);
		
		addGenericHandlerForSettingPageWithRadioButtons(page,
				storage.settings.units.temperature,
				function(el) { return el.name === 'temperature-radio'; });
	});
} () );
