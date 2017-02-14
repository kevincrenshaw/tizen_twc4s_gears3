( function () {		
	modifyElement(document, '#settingsUnitsPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS);
				modifyInnerHtml(page, '.ui-listview a#time span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TIME);
				modifyInnerHtml(page, '.ui-listview a#distance span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
				modifyInnerHtml(page, '.ui-listview a#mapzoom span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM);
				modifyInnerHtml(page, '.ui-listview a#temperature span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);
				
				const distanceUnit = storage.settings.units.distance.getMapped();
				modifyInnerHtml(page, '.ui-listview a#distance span#value', distanceUnit);
		
				modifyInnerHtml(page, '.ui-listview a#time span#value',
					storage.settings.units.time.getMapped());
				
				modifyInnerHtml(page, '.ui-listview a#mapzoom span#value',
					storage.settings.units.mapzoom.getMapped());
				
                modifyInnerHtml(page, '.ui-listview a#temperature span#value',
                	storage.settings.units.temperature.mapping.getCurrentValueAsLocalizedText());

				
				//Just to print in log current value
				storage.settings.units.mapzoom.get();
				storage.settings.units.temperature.get();
			});
	});
} () );
