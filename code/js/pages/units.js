/* jshint esversion: 6 */
define(['utils/utils', 'utils/storage'], function(utils, storage) {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			//Localize text for titles
			utils.modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS);
			utils.modifyInnerHtml(page, '.ui-listview a#time div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TIME);
			utils.modifyInnerHtml(page, '.ui-listview a#distance div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE);
			utils.modifyInnerHtml(page, '.ui-listview a#mapzoom div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM); 
			utils.modifyInnerHtml(page, '.ui-listview a#temperature div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);
			utils.modifyInnerHtml(page, '.ui-listview a#partnerapp div#text', TIZEN_L10N.SETTINGS_MENU_UNITS_PARTNER);
			
			//Update text for subtitles 
			utils.modifyInnerHtml(page, '.ui-listview a#distance div#value',
				storage.settings.units.distance.getMapped());
	
			utils.modifyInnerHtml(page, '.ui-listview a#time div#value',
				storage.settings.units.time.getMapped());
			
			utils.modifyInnerHtml(page, '.ui-listview a#mapzoom div#value',
				storage.settings.units.mapzoom.getMapped());
			
            utils.modifyInnerHtml(page, '.ui-listview a#temperature div#value',
            	storage.settings.units.temperature.getMapped());
            
            utils.modifyInnerHtml(page, '.ui-listview a#partnerapp div#value',
                storage.settings.units.partnerapp.getMapped());
		},
	};
});
