/* jshint esversion: 6 */

//	var urls = [
//			'http://jsonplaceholder.typicode.com/posts/1',
//			'http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json',
//			'http://jsonplaceholder.typicode.com/posts/3',
//			'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg' ];

define(['utils/fsutils', 'jquery', 'rx'], function(fsutils, $, Rx) {
	
	const getResourcesByURL = function(urls, options) {
		options = options || {};

		const timeout = options.timeout || 30000;
		const delay = options.delay || 0;
		
		var requestedStream = Rx.Observable
			.from(urls)
			.delay(new Date(Date.now() + delay));

		var response = requestedStream.flatMap(function(requestedUrl) {
			return Rx.Observable
				.fromPromise($.get(requestedUrl))
				.timeout(timeout);
		});

		return response;
	};
	
	/**
	 * download file by given url
	 * Params:
	 * 		url - resource url
	 * 		fileName - new file name of saved resource
	 * 		onSuccess(filePath) - will be called if resource is downloaded. send full path to a downloaded file
	 * 		onError(error) - called if download finished with error
	 * Returns
	 * 		nothing
	 * */
	const downloadImageFile = function(url, fileName, onSuccess, onError) {
		var downloadListener = {
			oncompleted: function(id, fullPath) {
				onSuccess(fullPath);
			},
			
			onfailed : function(id, error) {
				onError(error);
			}
		};
		
		const request = new tizen.DownloadRequest(url, 'downloads', fileName);
		tizen.download.start(request, downloadListener);
	};

	
	const downloadFileRx = function(url, dest) {		
		return Rx.Observable.create(function(observer) {
			const downloadListener = {
				oncompleted: function(id, fullPath) {
					observer.onNext(fullPath);
					observer.onCompleted();
				},
				
				onfailed : function(id, error) {
					observer.onError(error);
				},
			};
			
			const request = new tizen.DownloadRequest(url, '', dest);
			tizen.download.start(request, downloadListener);
		});
	};

	return {
		getResourcesByURL: getResourcesByURL,
		downloadImageFile: downloadImageFile,
		downloadFileRx: downloadFileRx,
	};
});