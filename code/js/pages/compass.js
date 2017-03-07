define(['utils/network', 'utils/utils', 'utils/storage', 'rx'], function(network, utils, storage, Rx) {
	
	const url = 'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg';
	const waitForMillis = 5000; 
	var subscription = null;
	
	const compass = {
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
				
			//get last saved session
			storage.fileSession.getSession(function(file) {
				if(file) {
					console.log('loaded saved session: ' + file.toURI());
					utils.modifySrc(document, 'img#status', file.toURI());
				} else {
					console.log('no saved session, waiting for a new one');
				}
			});

			//subscribe on periodic tasks
			subscription = Rx.Observable.interval(waitForMillis).subscribe(
				function(x) {
					network.downloadImageFile(url, '__temp_data_file', function(downloadedFileName) {
						if(downloadedFileName) {
							if(subscription) {
								storage.fileSession.addSessionToFile(downloadedFileName, function(newFileURI) {
									utils.modifySrc(page, 'img#status', newFileURI);
									var timestamp = new Date();
									utils.modifyInnerHtml(page, 'span#fetch-indicator', 'updated at: ' + 
											timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds());
								});								
							} else {
								console.log('response fetched but no listener found - exit');
							}
						} else {
							console.error('cant download file');
						}
					});
				},
					
				function(error) {
					console.error('error: ' + error.status);
				});
			console.log('subscription: ' + JSON.stringify(subscription));
		},
		
		createLastSessionDeleter : function(root) {
			const deleteLastSession = function() {
				storage.fileSession.removeLastSession();
				utils.modifySrc(root, 'img#status', null);
			};
			return deleteLastSession;
		},
	};

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			compass.onPageShow(page);
		},
		
		pagebeforehide: function(ev) {
			const page = ev.target;
			compass.onPageHide(page);
		}
	};
});	