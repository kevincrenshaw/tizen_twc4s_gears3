const modifyElement = function(root, selector, callback) {
	const element = root.querySelector(selector);
	
	if (!element) {
		console.warn('modifyElement: no element found for selector "' + selector + '"');
		return false;
	}
	
	return callback(element);
};

const modifyElements = function(root, selector, callback) {
	const elements = root.querySelectorAll(selector);
	
	for (i=0; i<elements.length; ++i) {
		if (callback(elements[i], i, elements) === true) {
			//Stop iteration on demand
			break;
		}
	}
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

const createGetterAndSetterForLocalStorageImpl = function(key, defaultValue, valueToLocKeyMapping) {
	if (valueToLocKeyMapping) {
		if (!valueToLocKeyMapping.hasOwnProperty(defaultValue)) {
			console.warn('Default value "' + defaultValue + '" for key "' + key + '" not present in mapping');
		}
	}
	
	const rawValueGetterImpl = function() {
		const value = localStorage.getItem(key) || defaultValue;
		return value;
	};
	
	const result = {
		get: rawValueGetterImpl,
		
		set: function(newValue) {
			if (valueToLocKeyMapping && !valueToLocKeyMapping.hasOwnProperty(newValue)) {
				console.warn('New value "' + newValue + '" for key "' + key + '" not present in mapping');
				return false;
			} 
			
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
	
	if (valueToLocKeyMapping) {
		result.mapping = {};
		
		result.mapping.valueExists = function(value) {
			return valueToLocKeyMapping.hasOwnProperty(value);
		}
		
		result.mapping.getLocalizedTextForValue = function(value) {
			if (this.valueExists(value)) {
				const locKey = valueToLocKeyMapping[value];
				
				if (TIZEN_L10N.hasOwnProperty(locKey)) {
					return TIZEN_L10N[locKey];
				} else {
					console.warn('Localization for key "' + locKey + '" not available');
					return "";
				}
			} else {
				console.warn('Value "' + value + '" for key "' + key + '" not present in mapping');
				return "";
			}
		};
		
		result.mapping.getCurrentValueAsLocalizedText = function() {
			return this.getLocalizedTextForValue(rawValueGetterImpl());
		}
	}
	
	return result;
};

const storage = {
	settings: {
		units: {
			time: createGetterAndSetterForLocalStorageImpl('settings_units_time_key', '1', {
				'1': 'SETTINGS_MENU_UNITS_TIME_SYSTEM',
				'2': 'SETTINGS_MENU_UNITS_TIME_12h',
				'3': 'SETTINGS_MENU_UNITS_TIME_24h',
			}),
			distance: createGetterAndSetterForLocalStorageImpl('settings_units_distance_key', '1'),
			mapzoom: createGetterAndSetterForLocalStorageImpl('settings_units_mapzoom_key', '1'),
			temperature: createGetterAndSetterForLocalStorageImpl('settings_units_temperature_key', '1'),
		},
	},
};