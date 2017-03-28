
function launchApp() {
	var app = window.tizen.application.getCurrentApplication();
	var appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );
	var appControl = new window.tizen.ApplicationControl('', null, null, null, null, null);
	window.tizen.application.launchAppControl(appControl, appId,
		function() {
			console.log("application has been launched successfully");
		},
		function(e) {
			console.error("application launch has been failed. reason: " + e.message);
		},
		null);
};


/**
 * convert date object to a text representation 
 * Params: 
 * 		date - date object
 * 		ampm - use ampm format
 * 
 * Returns: 
 * 		object-array with: 
 * 			first element - 'HH:mm' formatted time 
 * 			second element - 'AM' or 'PM' text for currentTimeUnitSetting === TIME_12H (or
 * 								system time settings is set to 12h), otherwise empty (not null)
 */
function getTimeAsText(date, ampm) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampmStr = '';

	if(ampm) {
		ampmStr = hours >= 12 ? ' PM' : ' AM';
		hours = hours % 12;
		//0 hour should be printed as 12
		hours = hours ? hours : 12;
	}
	minutes = minutes < 10 ? '0' + minutes : minutes;

	return [hours + ':' + minutes, ampmStr];
};

function celsiusToFahrenheit(value) {
	return value * 9.0 / 5.0 + 32;
};

function getFromStore(key, defaultValue) {
	if (tizen.preference.exists(key)) {
		return tizen.preference.getValue(key);
	} else {
		return defaultValue;
	}
}