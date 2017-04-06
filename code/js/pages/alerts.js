/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils'], function(storage, utils) {

	var updateHandler = null;

	function createOnPrefsUpdater(page) {
		return function() {
			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(page, 'span#status', savedAlerts);
				var timestamp = new Date();
				utils.modifyInnerHtml(page, 'span#fetch-indicator', 'updated at: ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());
			} else {
				utils.modifyInnerHtml(page, 'span#status', '');
			}
		};
	}

	const alerts = {
		onPageShow: function(page) {
			updateHandler = createOnPrefsUpdater(page);

			const savedAlerts = storage.alert.get();
			console.log('storage.alert.get() returns: ' + savedAlerts);
			if(savedAlerts) {
				utils.modifyInnerHtml(page, 'span#status', savedAlerts);
			}
			page.querySelector('#delete-button').addEventListener("click", storage.alert.remove);
			storage.alert.setChangeListener(updateHandler);
		},

		onPageHide: function(page) {
			page.querySelector('#delete-button').removeEventListener("click", storage.alert.remove);
			storage.alert.unsetChangeListener(updateHandler);
			updateHandler = null;
		},
	};

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			alerts.onPageShow(page);
		},

		pagebeforehide: function(ev) {
			const page = ev.target;
			alerts.onPageHide(page);
		},
	};
});