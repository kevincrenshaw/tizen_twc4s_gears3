( function () {	
	modifyElement(document, '#settingsUnitsMapZoomPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(function() {
			setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM,
				'mapzoom-radio',
				storage.settings.units.mapzoom);
		});
	});
} () );
