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

/*
 * Params:
 * 	page - page with list view
 *	getterAndSetterObj - object with at least two functions 'get' and 'set' to read/write setting value.
 *		For example: storage.settings.units.temperature
 *	clickTargetVerifier - because click event listener is added to entire list view (ul) this function is used to
 *		filter out events not targeting radio buttons. If this function returns false event is suppressed.
 */
const addGenericHandlerForSettingPageWithRadioButtons = function(
		page,
		getterAndSetterObj,
		clickTargetVerifier) {
	
	//Mark correct radio button as checked
	modifyElement(
		page,
		'ul.ui-listview input[value="' + getterAndSetterObj.get() + '"]',
		function(el) { el.checked = true; }
	);
	
	//Handle clicks on list view
	modifyElement(page, 'ul.ui-listview', function(listView) {
		Rx.Observable.fromEvent(listView, 'click')
			.map(function(ev) { return ev.target; })
			.filter(function(el) { return clickTargetVerifier(el); })
			.map(function(el) { return el.value; })
			.subscribe(function(value) {
				getterAndSetterObj.set(value);
				history.back();
			});
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
			
			if (newValue !== oldValue) {
				localStorage.setItem(key, newValue);
				console.log('localStorage["' + key + '"] value change: "' + oldValue + '" -> "' + newValue + '"');
				return true;
			} else {
				return false;
			}
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