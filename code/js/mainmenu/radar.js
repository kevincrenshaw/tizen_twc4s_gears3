( function () {
	const url = 'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg';
	const waitForMillis = 5000; 
	var subscription = null;
	    
	var deleteLastSession = function() {
		storage.radarSession.removeLastSession();
		modifyInnerSrc(document, 'img#status', null);
	};
	
	const radar = {
		onPageHide : function(e) {
			document.getElementById('delete-button').removeEventListener("click", deleteLastSession);
			if (subscription) {
				subscription.dispose();
                subscription = null;
            }
		},
		
		onPageShow : function(e) {
			modifyInnerHtml(document, 'span#fetch-indicator', 'waiting for response');
			document.getElementById('delete-button').addEventListener("click", deleteLastSession);			
			
			//get last saved session
			storage.radarSession.getSession(function(file) {
				if(file) {
					console.log('loaded saved session: ' + file.toURI());
					modifyInnerSrc(document, 'img#status', file.toURI());
				} else {
					console.log('no saved session, waiting for a new one');
				}
			});
			
			//subscribe on periodic tasks
			subscription = Rx.Observable.interval(waitForMillis).subscribe(
				function(x) {
					console.log('step: ' + x);
					
					downloadImageFile(url, '__temp_radar_map', function(downloadedFileName) {
						if(downloadedFileName) {
							storage.radarSession.addSession(downloadedFileName, function(newFileURI) {
								modifyInnerSrc(document, 'img#status', newFileURI);
							});
						} else {
							console.error('cant download file');
						}
					});
				},
				
				function(error) {
					console.error('error: ' + error.status);
				},
				
				function() {
					console.log('completed');
				});
			console.log('subscription: ' + JSON.stringify(subscription));
		},
	};
	
	modifyElement(document, '#radarPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow').subscribe(radar.onPageShow);
		Rx.Observable.fromEvent(page, 'pagebeforehide').subscribe(radar.onPageHide);
	});
} () );
