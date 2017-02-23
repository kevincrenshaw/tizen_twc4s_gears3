( function () {
	
	const url = ['http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json'];
	const waitForMillis = 5000; 
	var subscription = null;

	var radar = {
			onPageHide : function(e) {
				if (subscription) {
					subscription.dispose();
					subscription = null;
				}
			},

			onPageShow : function(e) {
				modifyInnerHtml(document, 'span#fetch-indicator', 'waiting for response');
				
				//try to load last saved sesstion and show it on UI
				var lastSavedSession = storage.weatherSession.getSession();
				if(lastSavedSession) {
					modifyInnerHtml(document, 'span#status', lastSavedSession);					
				}
				
				subscription = Rx.Observable.interval(waitForMillis).subscribe(
						function(x) {
							//create network request listener
							var fetchObserver = Rx.Observer.create(
									function(response) {
										if(subscription) {
											console.log('response fetched and saved');
											modifyInnerHtml(document, 'span#status', '');
											const result = JSON.stringify(response);
											modifyInnerHtml(document, 'span#status', result);
											storage.weatherSession.setSession(result);
										} else {
											console.log('response fetched but no listener found - exit');
										}
									},
									function(error) {
										console.error("error: " + error.status);
										if(subscription) {
											const result = JSON.stringify(error.status);
											modifyInnerHtml(document, 'span#status', result);
										}
									},
									function() {
										if(subscription) {
											var timestamp = new Date();
											modifyInnerHtml(document, 'span#fetch-indicator', 'updated at: ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());											
										}
									});
							
							console.log('next: ' + x);
							getResourcesByURL(url, fetchObserver, { timeout: 0, delay: 0});
						},
						function(err) {
							console.log('error: ' + error);
						},
						function() {
							console.log('completed');
						});
	
				console.log('subscription: ' + JSON.stringify(subscription));
			},
	};
	
	document.getElementById('delete-button').addEventListener("click", function() {
		storage.weatherSession.removeLastSession();
		modifyInnerHtml(document, 'span#status', '');
	});
	
	modifyElement(document, '#weatherPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(radar.onPageShow);
		Rx.Observable.fromEvent(page, 'pagebeforehide').subscribe(radar.onPageHide);
	});
} () );

