( function () {	
	modifyElement(document, '#settingsUnitsTemperaturePage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(function() {
			setupSettingPageWithRadioButtons(
					page,
					TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE,
					'temperature-radio',
					storage.settings.units.temperature);
			});
	});
} () );
