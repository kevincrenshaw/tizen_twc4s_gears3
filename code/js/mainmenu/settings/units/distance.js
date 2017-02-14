( function () {
	modifyElement(document, '#settingsUnitsDistancePage.ui-page', function(page) {
		
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(function() {
			modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
			
			modifyElements(page, 'ul.ui-listview li input[name="distance-radio"]', function(inputElement) {
				modifyInnerHtml(inputElement.parentNode,
						'div#text',
						storage.settings.units.distance.mapping.getLocalizedTextForValue(inputElement.value));
			});
			
			addGenericHandlerForSettingPageWithRadioButtons(page,
					storage.settings.units.distance,
					function(el) { return el.name === 'distance-radio'; });
		});
	});
} () );