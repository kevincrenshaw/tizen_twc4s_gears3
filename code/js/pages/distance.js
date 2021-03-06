/* jshint esversion: 6 */

define(['utils/utils', 'utils/storage'], function(utils, storage) {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			utils.setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_DISTANCE,
				'distance-radio',
				storage.settings.units.distance);
		},
	};
});