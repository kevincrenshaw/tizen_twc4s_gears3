/* jshint esversion: 6 */

define(['utils/utils', 'utils/const', 'utils/storage', 'utils/map', 'utils/network', 'rx'], function(utils, consts, storage, map, network, rx) {
	var subscription;

	//Flag to state wheather hard update is started. It may happen that hard update will be stopped by putting app in
	//background. Then when app wokes up soft update will not trigger hard update if there been successful update not
	//so long ago. To remmember that hard update was not completed successfuly we use this flag.
	var hardUpdateInProgress = false;

	//Handler called when update completes (successful or error)
	var updateCompleteHandler;

	/*
	 * Attempts to get current location, fetch data for given location and store it in storage.data.
	 *
	 * Returns:
	 *		True if data download started, false if there is already update in progress.
	 */
	const tryGetNewData = function() {
		if (subscription) {
			return false;
		}

		console.log('getting current position...');

		subscription = utils.getCurrentPositionRx(consts.DATA_DOWNLOAD_TIMEOUT_IN_MS).map(function(pos) {
			return [pos.coords.latitude, pos.coords.longitude];
		})
		.flatMap(function(coords) {
			return rx.Observable.zip(
				getWeatherObject(coords),
				getAlertObject(coords),
				rx.Observable.just(coords));
		})
		.flatMap(function(data) {
			const weatherData = data[0];
			const alertData = data[1];
			const coords = data[2];

			return rx.Observable.zip(
				getMap(coords),
				rx.Observable.just(weatherData),
				rx.Observable.just(alertData));
		})
		.finally(function() {
			subscription = null;

			if (updateCompleteHandler) {
				try {
					updateCompleteHandler();
				} catch (err) {
					console.error('Data download update complete handler error: ' + JSON.stringify(err));
				}
			}
		})
		.timeout(consts.DATA_DOWNLOAD_TIMEOUT_IN_MS)
		.subscribe(function(data) {
			const mapFilePath = data[0];
			const weatherData = data[1];
			const alertData = data[2];

			const newStorageObject = {
				weather: weatherData,
				alerts: alertData,
			};

			storage.lastUpdate.set(utils.getNowAsEpochInSeconds());
			storage.map.set(mapFilePath);
			storage.data.set(JSON.stringify(newStorageObject));

			hardUpdateInProgress = false;

			console.log('new data received');
		}, function(err) {
			console.warn('download data failed: ' + JSON.stringify(err));
		});

		return true;
	};

	/*
	 * Downloads weather object for given coords.
	 * 
	 * Returns:
	 *		Rx observable that emits weather object on success (json returned by TWC API described http://goo.gl/TO9kYm).
	 */
	const getWeatherObject = function(coords) {
		const latitude = coords[0];
		const longitude = coords[1];

		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());
		const lod = map.getMapLod(mapZoom, distance);

		console.log('weather data: mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude + ', lod=' + lod);

		const weatherUrl = getWeatherUrl(latitude, longitude);
		console.log('weatherUrl=' + weatherUrl);

		return network.getResourceByURLRx(weatherUrl)
			.filter(function(result) {
				return result.data && result.data.metadata && result.xhr.status === 200;
			})
			.map(function(result) {
				return result.data;
			});
	};

	/*
	 * Downloads alert object for given coords.
	 * 
	 * Returns:
	 *		Rx observable that emits alert object on success.
	 */
	const getAlertObject = function(coords) {
		const alertsUrl = getAlertsUrl(coords[0], coords[1]);
		console.log('alertsUrl=' + alertsUrl);

		return network.getResourceByURLRx(alertsUrl, consts.ALERT_TIMEOUT_IN_MS)
			.map(function(result) {
				return result.data || {};
			});
	};

	/*
	 * Creates weather url.
	 * 
	 * Returns:
	 *		Weather url as string.
	 */
	const getWeatherUrl = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.API_KEY,
		};

		const uriBase = [consts.WEATHER_URL, latitude, longitude, 'observations', 'current.json'].join('/');
		return utils.createUri(uriBase, options);
	};

	/*
	 * Creates alerts url.
	 * 
	 * Returns:
	 *		Alerts url as string.
	 */
	const getAlertsUrl = function(latitude, longitude) {
		const params = {
			geocode: [latitude, longitude].join(','),
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};

		return utils.createUri(consts.ALERTS_URL, params);
	};

	/*
	 * Creates map url.
	 * 
	 * Returns:
	 *		Map url as string.
	 */
	const getMapImgUrl = function(latitude, longitude, lod, options) {
		options = options || {};
		
		const latByLod = map.getAllowedPrecisionAccordingToLod(latitude, lod);
		const longByLod = map.getAllowedPrecisionAccordingToLod(longitude, lod);
		
		const params = {
			geocode: [latByLod, longByLod].join(','),
			w: options.width || 400,
			h: options.height || 400,
			lod: lod,
			product: options.product || 'satrad',
			apiKey: consts.API_KEY,
		};

		return utils.createUri(consts.MAPS_URL, params);
	};

	/*
	 * Download & store map for given coords.
	 *
	 * Params:
	 * 		coords - array of two elements (latitude, longitude)
	 * 
	 * Returns:
	 *		Rx observable
	 */
	const getMap = function(coords) {
		const latitude = coords[0];
		const longitude = coords[1];

		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());		
		const lod = map.getMapLod(mapZoom, distance);
		
		const mapImgUrl = getMapImgUrl(latitude, longitude, lod);
		console.log('getMap: lat=' + latitude + ', lon=' + longitude + ', lod=' + lod + ', mapImgUrl=' + mapImgUrl);

		const epoch = utils.getNowAsEpochInMiliseconds();
		const uniqueFileName = ['map', epoch, utils.guid()].join('_') + '.jpg';
		console.log('uniqueFileName: ' + uniqueFileName);

		return network.downloadFileRx(mapImgUrl, uniqueFileName).flatMap(function(downloadedFilePath) {
			return storageFileAdd(downloadedFilePath);
		});
	};

	/*
	 * Add file to storage in Rx way
	 */
	const storageFileAdd = function(filePath) {
		return rx.Observable.create(function(observer) {
			const onSuccess = function(fileUri) {
		 		observer.onNext(fileUri);
		 		observer.onCompleted();
			};

			storage.file.add(filePath, { onSuccess:onSuccess, onError:observer.onError });
		});
	};

	/*
	 * Returns time of last successful update.
	 * 
	 * Result:
	 *		Last succesful update time as epoch in seconds
	 *		 or
	 *		undefined if there was no update.
	 */
	const getLastUpdateTimeOrUndefined = function() {
		const dataText = storage.data.get();

		if (dataText) {
			try {
				const data = JSON.parse(dataText);
				const downloadTimeEpochInSeconds = storage.lastUpdate.get();

				if (downloadTimeEpochInSeconds) {
					return parseInt(downloadTimeEpochInSeconds);
				}
			} catch(err) {
				console.error(JSON.stringify(err));
			}
		}
		
		return undefined;
	};

	/*
	 * Tests if last successful update was performed enough time ago.
	 * 
	 * Result:
	 * 		Return true if update may be performed due to time requirement, false otherwise.
	 */
	const timeForUpdate = function() {
		const lastUpdateTime = getLastUpdateTimeOrUndefined();

		if (lastUpdateTime) {
			const now = utils.getNowAsEpochInSeconds();

			const delta = now > lastUpdateTime ? now - lastUpdateTime : 0;
			console.log('last data update happened ' + delta + ' second(s) ago');

			return delta >= consts.DATA_UPDATE_TIMEOUT_IN_SEC;
		} else {
			return true;
		}
	};

	return {
		/*
		 * Start data (weather, alerts, map) update process if not already started.
		 * 
		 * Result:
		 * 		Return true if update process started, false otherwise (update proces already running)
		 */
		updateInProgress: function() {
			if (subscription) {
				return true;
			}

			return false;
		},

		/*
		 * Start data (weather, alerts, map) update process if not already started.
		 * 
		 * Result:
		 * 		Return true if update process started, false otherwise (update proces already running)
		 */
		hardUpdate: function() {
			hardUpdateInProgress = true;
			
			if (!this.updateInProgress()) {
				tryGetNewData();
				return true;
			}

			return false;
		},

		/*
		 * If last data (weather, alerts, map) update process was at least consts.DATA_UPDATE_TIMEOUT_IN_SEC seconds
		 *		ago then starts update again.
		 * 
		 * Result:
		 * 		Return true if its time to start update, false otherwise. True result mean that new update starts or
		 *		there is already update in progress.
		 */
		softUpdate: function() {
			if (timeForUpdate() || hardUpdateInProgress) {
				this.hardUpdate();
				return true;
			}
			
			return false;
		},

		/*
		 * Stops update proces (if any). May be safely called multiple times.
		 */
		stopUpdate: function() {
			if (subscription) {
				subscription.dispose();
				subscription = null;
			}
		},

		setOnUpdateCompleteHandler: function(handler) {
			updateCompleteHandler = handler;
		},

		removeOnUpdateCompleteHandler: function() {
			updateCompleteHandler = null;
		},
	};
});