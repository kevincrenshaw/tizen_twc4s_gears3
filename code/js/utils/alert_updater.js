/* jshint esversion: 6 */

define(['utils/const', 'utils/utils', 'utils/network', 'utils/storage'], function(consts, utils, network, storage) {

	var subscription = null;

	//this function uses to obtain test coords
	const obtainTestCoords = function() {
		const params = {
			countryCode: 'US',
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};

		const url = utils.createUri(consts.ALERTS_URL, params);
		return network.getResourceByURLRx(url).map(
			function(result) {
				return [result.data.alerts[0].latitude, result.data.alerts[0].longitude];
			}
		);
	};

	const constructURL = function(coords) {
		const params = {
			geocode: [coords[0], coords[1]].join(','),
			format: 'json',
			language: 'en-US',
			apiKey: consts.API_KEY,
		};
		return utils.createUri(consts.ALERTS_URL, params);
	};

	const fetchAndSaveData = function() {
		//implemented for testing purposes 
		subscription = obtainTestCoords().subscribe(
			function(lat, lon) {
				const url = constructURL([lat, lon]);
				console.log('request alerts, url: ' + url);

				network.getResourceByURLRx(url, consts.ALERT_TIMEOUT_IN_MS).subscribe(
					//on success
					function(result) {
						storage.alert.add(JSON.stringify(result.data));
					},
					//error
					function(err) {
						console.error('cant fetch resource, response:' + JSON.stringify(err));
					}
				);
			},
			function(err) {
				console.log('obtainTestCoords::error in testing part: ' + JSON.stringify(err));
			});
	};

	return {

		active: function() {
			return subscription !== null;
		},
			
		
		activate: function() {
			if(subscription === null){
				fetchAndSaveData();
			} else {
				console.error('module is in active state');
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