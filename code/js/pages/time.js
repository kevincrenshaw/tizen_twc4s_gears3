/* jshint esversion: 6 */

define(['utils/utils', 'utils/storage'], function(utils, storage) {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			utils.setupSettingPageWithRadioButtons(
				page,
				TIZEN_L10N.SETTINGS_MENU_UNITS_TIME,
				'time-radio',
				storage.settings.units.time);
		},

		pagebeforehide: function(ev) {
			console.log('stored time format:' + storage.settings.units.time.get());
			utils.saveIfSystemUsesAMPMTimeFormat();
		},
	};
});