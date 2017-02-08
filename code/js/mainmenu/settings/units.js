( function () {		
	modifyElement(document, '#settingsUnitsPage.ui-page', function(page) {			
		//Localize text
		modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS);
		modifyInnerHtml(page, '.ui-listview a#distance span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
		modifyInnerHtml(page, '.ui-listview a#mapzoom span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM);
		modifyInnerHtml(page, '.ui-listview a#temperature span#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);

		//Just to print in log current value
		storage.settings.units.distance.get();
		storage.settings.units.mapzoom.get();
		storage.settings.units.temperature.get();
	});
} () );
