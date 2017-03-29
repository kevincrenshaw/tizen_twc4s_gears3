/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils'], function(storage, utils) {

	return {
		pagebeforeshow: function(ev) {
			console.log('alerts page::pagebeforeshow');
			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(document, 'span#status', savedAlerts);
			}
		},

		pagebeforehide: function(ev) {
			console.log('alerts page::pagebeforehide');
		},

		onupdatealerts: function(ev) {
			const alerts = storage.alert.get();
			console.log('alerts page::onupdatealerts triggered');
			console.log('alert list is:' + alerts);
			
			const savedAlerts = storage.alert.get();
			if(savedAlerts) {
				utils.modifyInnerHtml(document, 'span#status', savedAlerts);
			}
		}
	};
});