define([], function() {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM,
				'mapzoom-radio',
				storage.settings.units.mapzoom);
		},
	};
});