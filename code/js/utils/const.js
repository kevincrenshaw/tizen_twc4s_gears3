/* jshint esversion: 6 */

define([], function() {
	const settings = {
		units: {
			temperature: {
				SYSTEM: 1,
				FAHRENHEIT: 2,
				CELSIUS: 3,
			},
			time: {
				SYSTEM: 1,
				TIME_12H: 2,
				TIME_24H: 3,
			},
		},
	};
	
	const ONE_MINUTE_IN_MS = 1000 * 60;
	const BASE_V2_URL ='https://api.weather.com/v2/';
	const BASE_V3_URL = 'https://api.weather.com/v3/';

	return {
		settings: settings,
		API_KEY: 'ce21274b08780261ce553b0b9166a9ae',
		GEOLOCATION_TIMEOUT_IN_MS: ONE_MINUTE_IN_MS * 5,
		ALERT_TIMEOUT_IN_MS: ONE_MINUTE_IN_MS * 5,
		ALERTS_URL: BASE_V3_URL + 'alerts/headlines',
		MAPS_URL: BASE_V2_URL + 'maps/dynamic',
	};
});