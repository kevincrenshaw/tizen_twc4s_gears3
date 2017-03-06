/* jshint esversion: 6 */

define(['utils/network', 'utils/utils', 'utils/storage', 'rx'], function(network, utils, storage, Rx) {
	const url = ['http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json'];
	const waitForMillis = 5000; 
	var subscription = null;
	
	const weather = {
		onPageHide : function(page) {
			page.querySelector('#delete-button').removeEventListener("click", this.createLastSessionDeleter(page));
			if (subscription) {
				subscription.dispose();
	            subscription = null;
	        }
		},
		
		onPageShow : function(page) {
			utils.modifyInnerHtml(page, 'span#fetch-indicator', 'waiting for response');
			
			page.querySelector('#delete-button').addEventListener("click", this.createLastSessionDeleter(page));
				
			//try to load last saved sesstion and show it on UI
			var lastSavedSession = storage.weatherSession.getSession();
			if(lastSavedSession) {
				utils.modifyInnerHtml(document, 'span#status', lastSavedSession);					
			}
			//subscribe on periodic tasks
			subscription = Rx.Observable.interval(waitForMillis).subscribe(
				function(x) {
					//perform request
					network.getResourcesByURL(url, { timeout: 0, delay: 0}).subscribe(
						function(response) {
							if(subscription) {
								console.log('response fetched and saved');
								utils.modifyInnerHtml(page, 'span#status', '');
								const result = JSON.stringify(response);
								utils.modifyInnerHtml(page, 'span#status', result);
								storage.weatherSession.addSessionToLocalStorage(result);
							} else {
								console.log('response fetched but no listener found - exit');
							}
						},
						function(error) {
							console.error("error: " + error.status);
							if(subscription) {
								const result = JSON.stringify(error.status);
								utils.modifyInnerHtml(page, 'span#status', result);
							}
						},
						function() {
							if(subscription) {
								var timestamp = new Date();
								utils.modifyInnerHtml(page, 'span#fetch-indicator', 'updated at: ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());											
							}
						});
				},
				function(err) {
					console.error('error: ' + error.status);
				});
			console.log('subscription: ' + JSON.stringify(subscription));
		},
		
		createLastSessionDeleter : function(root) {
			const deleteLastSession = function() {
				storage.weatherSession.removeLastSession();
				utils.modifyInnerHtml(root, 'span#status', '');
			};
			
			return deleteLastSession;
		}
	};
	
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			weather.onPageShow(page);
		},
		
		pagebeforehide: function(ev) {
			const page = ev.target;
			weather.onPageHide(page);
		},
	};
});