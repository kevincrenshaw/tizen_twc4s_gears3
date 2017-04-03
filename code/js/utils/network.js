/* jshint esversion: 6 */

define(['utils/fsutils', 'jquery', 'rx'], function(fsutils, $, Rx) {

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

	/**
	 * get resource by given URL
	 * */
	const getResourceByURLRx = function(url, timeout) {
		const timeout = (timeout >= 0) ? timeout : 30000;

		return Rx.Observable.create(
			function(observer) {
				$.ajax({
					url: url,
					success:  function(data, textStatus, xhr) {
						observer.onNext({data: data, textStatus: textStatus, xhr: xhr});
						observer.onCompleted();
					},
					timeout: timeout,
				});
			}
		);
	};

	return {
		downloadImageFile: downloadImageFile,
		downloadFileRx: downloadFileRx,
		getResourceByURLRx: getResourceByURLRx,
	};
});