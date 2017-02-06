( function () {	
	modifyElement(document, '#settingsUnitsDistancePage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
				
				addGenericHandlerForSettingPageWithRadioButtons(page,
						storage.settings.units.distance,
						function(el) { return el.name === 'distance-radio'; });
			});
	});
} () );
