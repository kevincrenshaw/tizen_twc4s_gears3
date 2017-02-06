const modifyElement = function(root, selector, callback) {
	const element = root.querySelector(selector);
	
	if (!element) {
		console.warn('modifyElement: no element found for selector "' + selector + '"');
		return false;
	}
	
	return callback(element);
};

const modifyInnerHtml = function(root, selector, text) {
	return modifyElement(root, selector, function(el) {
		el.innerHTML = text;
		return true;
	});
};

const createGetterAndSetterForLocalStorageImpl = function(key, defaultValue) {	
	return {
		get: function() {
			const value = localStorage.getItem(key) || defaultValue;
			console.log('localStorage["' + key + '"]="' + value + '"');
			return value;
		},
		
		set: function(newValue) {
			const oldValue = this.get();
			localStorage.setItem(key, newValue);
			console.log('localStorage["' + key + '"] value change: "' + oldValue + '" -> "' + newValue + '"');
		},
	};
};

const storage = {
	settings: {
		timeformat: createGetterAndSetterForLocalStorageImpl('settings_timeformat_key', 1),
		
		units: {
			distance: createGetterAndSetterForLocalStorageImpl('settings_units_distance_key', 1),
			mapzoom: createGetterAndSetterForLocalStorageImpl('settings_units_mapzoom_key', 1),
			temperature: createGetterAndSetterForLocalStorageImpl('settings_units_temperature_key', 1),
		},
	},
};