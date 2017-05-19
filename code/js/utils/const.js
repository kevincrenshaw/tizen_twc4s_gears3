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
	
	const ONE_MINUTE_IN_SEC = 60;
	const ONE_SEC_IN_MS = 1000;
	const ONE_MINUTE_IN_MS = ONE_SEC_IN_MS * ONE_MINUTE_IN_SEC;
	const SEPARATOR = '/';
	
	function getApiBaseUrl(version) {
		return 'https://api.weather.com/v' + version;
	}

	return {
		settings: settings,
		API_KEY: 'ce21274b08780261ce553b0b9166a9ae',
		DATA_DOWNLOAD_TIMEOUT_IN_MS: ONE_MINUTE_IN_MS * 5,
		ALERT_TIMEOUT_IN_MS: ONE_MINUTE_IN_MS * 5,
		DATA_UPDATE_TIMEOUT_IN_SEC: ONE_MINUTE_IN_SEC * 15,
		ALERTS_URL: [getApiBaseUrl(3), 'alerts', 'headlines'].join(SEPARATOR),
		MAPS_URL: [getApiBaseUrl(2), 'maps', 'dynamic'].join(SEPARATOR),
		WEATHER_URL: [getApiBaseUrl(1), 'geocode'].join(SEPARATOR),
		TIMESTAMP_URL: [getApiBaseUrl(3), 'TileServer', 'series', 'productSet'].join(SEPARATOR),
		RADAR_ALERTS_MAX_NBR: 9,
		RADAR_DEEPLINK: 'android-app://com.twc.radar/radar/gps',
		ALERT_DEEPLINK: 'android-app://com.twc.radar/radar/gpsAlerts',
		SEPARATOR: SEPARATOR,
		COORDINATES_MAX_AGE_IN_MS: 5 * ONE_SEC_IN_MS,
		NBR_OF_DOWNLOAD_ERRORS_LEADING_TO_RETRY: 2,
		NBR_OF_SECOND_TO_WAIT_BETWEEN_RETRIES: 5,
		NBR_OF_PAST_MAPS: 4,
		NBR_OF_FUTURE_MAPS: 3,
	};
});