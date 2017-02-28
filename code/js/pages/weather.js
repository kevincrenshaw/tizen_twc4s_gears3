define(['utils/network'], function(network) {
	const url = ['http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json'];
	const waitForMillis = 5000; 
	var subscription = null;
	
	const createLastSessionDeleter = function(root) {
		const deleteLastSession = function() {
			storage.weatherSession.removeLastSession();
			modifyInnerHtml(root, 'span#status', '');
		};
		
		return deleteLastSession;
	};
	
	const radar = {
		onPageHide : function(page) {
			page.querySelector('#delete-button').removeEventListener("click", createLastSessionDeleter(page));
			if (subscription) {
				subscription.dispose();
	            subscription = null;
	        }
		},
		
		onPageShow : function(page) {
			modifyInnerHtml(page, 'span#fetch-indicator', 'waiting for response');
			
			page.querySelector('#delete-button').addEventListener("click", createLastSessionDeleter(page));
				
			//try to load last saved sesstion and show it on UI
			var lastSavedSession = storage.weatherSession.getSession();
			if(lastSavedSession) {
				modifyInnerHtml(document, 'span#status', lastSavedSession);					
			}
			//subscribe on periodic tasks
			subscription = Rx.Observable.interval(waitForMillis).subscribe(
				function(x) {
					//perform request
					network.getResourcesByURL(url, { timeout: 0, delay: 0}).subscribe(
						function(response) {
							if(subscription) {
								console.log('response fetched and saved');
								modifyInnerHtml(page, 'span#status', '');
								const result = JSON.stringify(response);
								modifyInnerHtml(page, 'span#status', result);
								storage.weatherSession.addSession(result);
							} else {
								console.log('response fetched but no listener found - exit');
							}
						},
						function(error) {
							console.error("error: " + error.status);
							if(subscription) {
								const result = JSON.stringify(error.status);
								modifyInnerHtml(page, 'span#status', result);
							}
						},
						function() {
							if(subscription) {
								var timestamp = new Date();
								modifyInnerHtml(page, 'span#fetch-indicator', 'updated at: ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());											
							}
						});
				},
				function(err) {
					console.error('error: ' + error);
				},
				function() {
					console.log('completed');
				});
			console.log('subscription: ' + JSON.stringify(subscription));
		}
	};
	
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			radar.onPageShow(page);
		},
		
		pagebeforehide: function(ev) {
			const page = ev.target;
			radar.onPageHide(page);
		},
	};
});