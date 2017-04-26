/* jshint esversion: 6 */

define(['utils/fsutils', 'jquery', 'rx'], function(fsutils, $, Rx) {
	const rootDir = 'downloads';
	const cacheDir = 'stormAppCache';
	const fullCachePath = rootDir + '/' + cacheDir;

	const prepareCache = function(onSuccess, onError) {
		fsutils.createDirectoryIfNotExists(rootDir, cacheDir, onSuccess, onError);
	};

	const clearCache = function(onSuccess, onError) {
		fsutils.removeDir(rootDir, cacheDir, true, onSuccess, onError);
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
				}
			};

			prepareCache(function() {
				const request = new tizen.DownloadRequest(url, fullCachePath, dest);
				tizen.download.start(request, downloadListener);
			}, observer.onError);
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
		prepareCache: prepareCache,
		clearCache: clearCache,
		downloadFileRx: downloadFileRx,
		getResourceByURLRx: getResourceByURLRx,
	};
});