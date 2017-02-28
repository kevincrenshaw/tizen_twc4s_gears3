/* jshint esversion: 6 */
define([], function() {
	var destroyable;
	
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			//Localize text for titles
			modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS);
			modifyInnerHtml(page, '.ui-listview a#time div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TIME);
			modifyInnerHtml(page, '.ui-listview a#distance div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
			modifyInnerHtml(page, '.ui-listview a#mapzoom div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM); 
			modifyInnerHtml(page, '.ui-listview a#temperature div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);
			modifyInnerHtml(page, '.ui-listview a#partnerapp div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_PARTNER);
			
			//Update text for subtitles 
			modifyInnerHtml(page, '.ui-listview a#distance div#value',
				storage.settings.units.distance.getMapped());
	
			modifyInnerHtml(page, '.ui-listview a#time div#value',
				storage.settings.units.time.getMapped());
			
			modifyInnerHtml(page, '.ui-listview a#mapzoom div#value',
				storage.settings.units.mapzoom.getMapped());
			
            modifyInnerHtml(page, '.ui-listview a#temperature div#value',
            	storage.settings.units.temperature.getMapped());
            
            modifyInnerHtml(page, '.ui-listview a#partnerapp div#value',
                storage.settings.units.partnerapp.getMapped());
		},
	};
});
