/* jshint esversion: 6 */

define(['utils/utils', 'utils/const', 'utils/storage', 'utils/map', 'utils/network', 'rx'], function(utils, consts, storage, map, network, rx) {
	var workInProgress = false;
	var subscription;

	/*
	 * Attempts to get current location, fetch data for location and then display it
	 */
	const tryGetNewData = function() {
		console.log('getting current position...');

		if (subscription) {
			subscription.dispose();
			subscription = null;
		}

		workInProgress = true;

		subscription = utils.getCurrentPositionRx(consts.GEOLOCATION_TIMEOUT_IN_MS).map(function(pos) {
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
			workInProgress = false;
		})
		.subscribe(function(data) {
			const mapFilePath = data[0];
			const weatherData = data[1];
			const alertData = data[2];

			const newStorageObject = {
				internal: {
					downloadTimeEpochInSeconds: utils.getNowAsEpochInSeconds(),
					mapFilePath: mapFilePath, //store map file path for given weather data
				},

				external: {
					weather: weatherData,
					alerts: alertData,
				},
			};

			storage.data.set(JSON.stringify(newStorageObject));

			console.log('new data received');
		}, function(err) {
			console.warn('download data failed: ' + JSON.stringify(err));
		});
	};

	/*
	 * For given coords tries to get current weather data object
	 *
	 * Parameters:
	 * 		coords - array of exactly two elements [latitude, longitude]
	 *
	 * Result:
	 *		Returns observable that emits current weather respresented as object (json returned by TWC API described
	 *		http://goo.gl/TO9kYm)
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

	const getAlertObject = function(coords) {
		const alertsUrl = getAlertsUrl(coords[0], coords[1]);
		console.log('alertsUrl=' + alertsUrl);

		return network.getResourceByURLRx(alertsUrl, consts.ALERT_TIMEOUT_IN_MS)
			.map(function(result) {
				return result.data || {};
			});
	};

	const getWeatherUrl = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.API_KEY,
		};

		const uriBase = ['https://api.weather.com', 'v1', 'geocode', latitude, longitude, 'observations', 'current.json'].join('/');
		return utils.createUri(uriBase, options);
	};

	const getAlertsUrl = function(latitude, longitude) {
		const params = {
			geocode: [latitude, longitude].join(','),
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};

		return utils.createUri(consts.ALERTS_URL, params);
	};

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

	const getMap = function(coords) {
		const latitude = coords[0];
		const longitude = coords[1];

		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());		
		const lod = map.getMapLod(mapZoom, distance);
		
		const mapImgUrl = getMapImgUrl(latitude, longitude, lod);
		console.log('getMap: lat=' + latitude + ', lon=' + longitude + ', lod=' + lod + ', mapImgUrl=' + mapImgUrl);

		const epoch = utils.getNowAsEpochInMiliseconds();
		const uniqueFileName = [['map', epoch, utils.guid()].join('_'), '.jpg'].join('');
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

	return {
		inProgress: function() {
			if (subscription) {
				return workInProgress;
			} else {
				return false;
			}
		},

		start: function() {
			if (!this.inProgress()) {
				tryGetNewData();
			} else {
				console.warn('updater already working');
			}
		},

		stop: function() {
			subscription.dispose();
			subscription = null;
			workInProgress = false;
		},
	};
});