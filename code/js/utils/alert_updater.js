/* jshint esversion: 6 */

define(['rx', 'utils/const', 'utils/utils', 'utils/network', 'utils/storage'], function(rx, consts, utils, network, storage) {

	var subscription = null;

	//array of geolocation [latitude, longitude]
	var coords = [0, 0];

	//this function uses to obtain test coords
	const obrainTestCoords = function(onSuccess, onError) {
		const params = {
			countryCode: 'US',
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};

		const url = utils.createUri(consts.ALERTS_URL, params);
		network.getResourceByURLRx(url).subscribe(
				//on success
				function(data, textStatus, xhr) {
					onSuccess(data.alerts[0].latitude, data.alerts[0].longitude);
				},
				//error
				function(err) {
					console.error('cant fetch resource, response code: ' + err.code + ' and message: ' + err.message);
					onError(err);
				}
		);
	};

	const constructURL = function() {
		const params = {
			geocode: [coords[0], coords[1]].join(','),
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};
		return utils.createUri(consts.ALERTS_URL, params);
	};

	const fetchAndSaveData = function() {
		const onSuccess = function(lat, lon) {
			coords[0] = lat;
			coords[1] = lon;
			console.log('applied new coords, lat: ' + lat + ' lon: ' + lon);

			const url = constructURL();
			console.log('request alerts, url: ' + url);

			network.getResourceByURLRx(url).subscribe(
				//on success
				function(data, textStatus, xhr) {
					console.log('data fetched: ' + JSON.stringify(data));
					storage.alert.add(JSON.stringify(data));
				},
				//error
				function(err) {
					console.error('cant fetch resource, response code: ' + err.code + ' and message: ' + err.message);
				}
			);
		};
		
		
		//implemented for testing purposes 
		obrainTestCoords(
			//on success
				onSuccess,
			//on error
			function(err) {
				console.log('obrainTestCoords::error in testing part: ' + JSON.stringify(err));
			}
		);
	};

	return {
		active: function() {
			console.log('alert::fetchData. alert active');
			if(subscription !== null) {
				return;
			}

			//run for first time
			fetchAndSaveData();
			//and start execution for every ALERT_TIMEOUT_IN_MS
			subscription = rx.Observable.interval(consts.ALERT_TIMEOUT_IN_MS).subscribe(
				function() {
					fetchAndSaveData();
				},
				function(err) {
					console.error('error: ' + err.status);
				}
			);
		},
		inactive: function() {
			console.log('========> alert inactive');
			if (subscription) {
				subscription.dispose();
				subscription = null;
			}
		}
	};
});