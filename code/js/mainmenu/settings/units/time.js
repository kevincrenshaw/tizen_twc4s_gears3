( function () {	
	modifyElement(document, '#settingsUnitsTimePage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_TIME);				
				modifyElements(page, 'ul.ui-listview li input[name="time-radio"]', function(inputElement) {
					modifyInnerHtml(inputElement.parentNode,
							'div#text',
							storage.settings.units.time.getMappedValue(inputElement.value));
				});
				
				addGenericHandlerForSettingPageWithRadioButtons(page,
						storage.settings.units.time,
						function(el) { return el.name === 'time-radio'; });
			});
	});
} () );
