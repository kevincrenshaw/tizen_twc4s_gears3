/* jshint esversion: 6 */

define(['utils/fsutils', 'jquery', 'rx'], function(fsutils, $, rx) {
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
		return rx.Observable.create(function(observer) {
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
				try {
					tizen.download.start(request, downloadListener);
				} catch(err) {
					observer.onError(err);
				}
			}, function(err) {
				observer.onError(err);
			});
		});
	};

	/**
	 * get resource by given URL
	 * Thanks to subject the data is downloaded once and then shared between observers.
	 * */
	const getResourceByURLRx = function(url, timeout) {
		const timeoutVal = (timeout >= 0) ? timeout : 30000;

		var subject = new rx.AsyncSubject();

		$.ajax({
			url: url,
			success:  function(data, textStatus, xhr) {
				subject.onNext({data: data, textStatus: textStatus, xhr: xhr});
				subject.onCompleted();
			},
			error: function(jqXHR) {
				subject.onError(jqXHR);
			},
			timeout: timeoutVal,
		});

		return subject;
	};

	return {
		clearCache: clearCache,
		downloadFileRx: downloadFileRx,
		getResourceByURLRx: getResourceByURLRx,
	};
});
