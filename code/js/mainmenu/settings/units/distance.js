( function () {
	modifyElement(document, '#settingsUnitsDistancePage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(function() {
			setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE,
				'distance-radio',
				storage.settings.units.distance);
		});
	});
} () );