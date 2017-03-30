/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils'], function(storage, utils) {

	var deleteHandler = null;
	var updateHandler = null;
	
	function createAlertsDeleter(page) {
		return function() {
			//we dont want to catch events after manual deleting entry, unsubscribe first
			tizen.preference.unsetChangeListener(storage.alert.getIndexKey(), updateHandler);
			//then delete item
			storage.alert.remove();
			//and subscribe again for catching events again
			tizen.preference.setChangeListener(storage.alert.getIndexKey(), updateHandler);
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
		onPageShow : function(page) {
			deleteHandler = createAlertsDeleter(page);
			updateHandler = createOnPrefsUpdater(page);

			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(document, 'span#status', savedAlerts);
			}
			page.querySelector('#delete-button').addEventListener("click", deleteHandler);
			tizen.preference.setChangeListener(storage.alert.getIndexKey(), updateHandler);
		},

		onPageHide : function(page) {
			page.querySelector('#delete-button').removeEventListener("click", deleteHandler);
			tizen.preference.unsetChangeListener(storage.alert.getIndexKey(), updateHandler);
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