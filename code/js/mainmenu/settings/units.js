( function () {		
	modifyElement(document, '#settingsUnitsPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text for titles
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS);
				modifyInnerHtml(page, '.ui-listview a#time div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TIME);
				modifyInnerHtml(page, '.ui-listview a#distance div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
				modifyInnerHtml(page, '.ui-listview a#mapzoom div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM); 
				modifyInnerHtml(page, '.ui-listview a#temperature div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);
				
				//Update text for subtitles 
				const distanceUnit = storage.settings.units.distance.getMapped();
				modifyInnerHtml(page, '.ui-listview a#distance div#value', distanceUnit);
		
				modifyInnerHtml(page, '.ui-listview a#time div#value',
					storage.settings.units.time.getMapped());
				
				modifyInnerHtml(page, '.ui-listview a#mapzoom div#value',
					storage.settings.units.mapzoom.getMapped());
				
				//Just to print in log current value
				storage.settings.units.mapzoom.get();
				storage.settings.units.temperature.get();
			});
	});
} () );
