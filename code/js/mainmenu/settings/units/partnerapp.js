( function () {
	modifyElement(document, '#settingsUnitsPartnerPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(function() {
			setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_PARTNER,
				'partner-app-radio', 
				storage.settings.units.partnerapp);
		});
	});
} () );