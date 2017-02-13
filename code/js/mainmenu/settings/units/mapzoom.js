( function () {	
	modifyElement(document, '#settingsUnitsMapZoomPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM);				
				modifyElements(page, 'ul.ui-listview li input[name="mapzoom-radio"]', function(inputElement) {
					modifyInnerHtml(inputElement.parentNode,
							'div#text',
							storage.settings.units.mapzoom.getMappedValue(inputElement.value));
				});
				
				addGenericHandlerForSettingPageWithRadioButtons(page,
						storage.settings.units.mapzoom,
						function(el) { return el.name === 'mapzoom-radio'; });
			});
	});
} () );
