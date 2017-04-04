/* jshint esversion: 6 */

define(['utils/const', 'utils/utils', 'utils/network', 'utils/storage'], function(consts, utils, network, storage) {

	var subscription = null;

	const constructURL = function(lat, lon) {
		const params = {
			geocode: [lat, lon].join(','),
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};
		return utils.createUri(consts.ALERTS_URL, params);
	};

	const getAlertDataByCoords = function(coords) {
		const url = constructURL(coords[0], coords[1]);
		console.log('request alerts, url: ' + url);
		return network.getResourceByURLRx(url, consts.ALERT_TIMEOUT_IN_MS);
	};

	function filterResponse(result) {
		return result != null && result.data != null && result.data != undefined;
	};

	const fetchAndSaveData = function() {
		subscription = utils.getCurrentPositionRx(consts.GEOLOCATION_TIMEOUT_IN_MS).map(function(pos) {
			return [pos.coords.latitude, pos.coords.longitude];
		})
		.flatMap(getAlertDataByCoords)
		.filter(filterResponse)
		.subscribe(
			//on success
			function(result) {
				storage.alert.add(JSON.stringify(result.data));
			},
			//error
			function(err) {
				console.error('cant fetch resource, response:' + JSON.stringify(err));
			}
		);
	};

	return {
		active: function() {
			return subscription !== null;
		},
		activate: function() {
			if(subscription === null){
				fetchAndSaveData();
			} else {
				console.warn('module is in active state');
			}
		},
		deactivate: function() {
			if (subscription) {
				subscription.dispose();
				subscription = null;
			}
		},
	};
});