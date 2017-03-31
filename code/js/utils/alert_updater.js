/* jshint esversion: 6 */

define(['utils/const', 'utils/utils', 'utils/network', 'utils/storage'], function(consts, utils, network, storage) {

	var active = false;

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

			const url = constructURL();
			console.log('request alerts, url: ' + url);

			network.getResourceByURLRx(url, consts.ALERT_TIMEOUT_IN_MS).subscribe(
				//on success
				function(data, textStatus, xhr) {
					storage.alert.add(JSON.stringify(data));
				},
				//error
				function(err) {
					console.error('cant fetch resource, response code: ' + err.code + ' and message: ' + err.message);
				}
			);
		};

		//implemented for testing purposes 
		obrainTestCoords(onSuccess,
			//on error
			function(err) {
				console.log('obrainTestCoords::error in testing part: ' + JSON.stringify(err));
			}
		);
	};

	return {
		active: function() {
			if(active === false) {
				active = true;
				fetchAndSaveData();
			}
		},
		inactive: function() {
			if(active === true) {
				active = false;
			}
		},
	};
});