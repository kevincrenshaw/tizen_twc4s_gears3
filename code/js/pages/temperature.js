/* jshint esversion: 6 */

define(['utils/utils', 'utils/storage'], function(utils, storage) {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			utils.setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE,
				'temperature-radio',
				storage.settings.units.temperature);
		},
	};
});