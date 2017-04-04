/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils'], function(storage, utils) {

	var deleteHandler = null;
	var updateHandler = null;
	
	function createAlertsDeleter(page) {
		return function() {
			storage.alert.remove();
			utils.modifyInnerHtml(page, 'span#status', '');
		};
	}

	function createOnPrefsUpdater(page) {
		return function() {
			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(page, 'span#status', savedAlerts);
				var timestamp = new Date();
				utils.modifyInnerHtml(page, 'span#fetch-indicator', 'updated at: ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());
			}
		};
	}

	const alerts = {
		onPageShow: function(page) {
			deleteHandler = createAlertsDeleter(page);
			updateHandler = createOnPrefsUpdater(page);

			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(page, 'span#status', savedAlerts);
			}
			page.querySelector('#delete-button').addEventListener("click", deleteHandler);
			storage.alert.setChangeListener(updateHandler);
		},

		onPageHide: function(page) {
			page.querySelector('#delete-button').removeEventListener("click", deleteHandler);
			storage.alert.unsetChangeListener(updateHandler);
			deleteHandler = null;
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