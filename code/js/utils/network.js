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
	
	const downloadImageFile = function(url, destFileNameWithoutExtension, callback) {
		var downloadListener = {
			oncompleted: function(id) {
				callback(fileName);
			},
			
			onfailed : function(id, error) {
				callback(null);
			}
		};
		
		//get file extension
		var extension = fsutils.getFileExtension(url);
		
		var fileName = null;
		if(extension.length > 0) {
			fileName = destFileNameWithoutExtension + '.' + extension;
		} else {
			fileName = destFileNameWithoutExtension;
		}
		console.log('file will be saved as: ' + fileName);
		
		const request = new tizen.DownloadRequest(url, 'downloads', fileName);
		tizen.download.start(request, downloadListener);
	};

	return {
		getResourcesByURL: getResourcesByURL,
		downloadImageFile: downloadImageFile, 
	};
});