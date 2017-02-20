const tryModifyElement = function(root, selector, callback) {
	const element = root.querySelector(selector);
	
	if (!element) {
		return false;
	} else {
		callback(element);
		return true;
	}
};

const modifyElement = function(root, selector, callback) {
	const result = tryModifyElement(root, selector, callback);
	
	if (result === false) {
		console.warn('modifyElement: no element found for selector "' + selector + '"');
	}
	
	return result;
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
 *	title - string to display in head of the page
 *	radioButtonElementName - name (from DOM tree) that every option (radio button) has
 *	setting - storage setting object, for example: storage.settings.units.temperature
 */
const setupSettingPageWithRadioButtons = function(page, title, radioButtonElementName, setting) {
	//Set page title
	modifyInnerHtml(page, '.ui-title', title);
	
	const defaultValue = setting.getDefaultValue();
	
	//Set options label
	modifyElements(page, 'ul.ui-listview li input[name="' + radioButtonElementName + '"]', function(inputElement) {
		const localizedText = setting.getMappedValue(inputElement.value);
		const description = inputElement.value === defaultValue
			? [localizedText, ['(', TIZEN_L10N.SETTINGS_DEFAULT, ')'].join('')].join(' ')
			: localizedText;
		
		modifyInnerHtml(inputElement.parentNode, 'div#text', description);
	});
	
	//Mark correct radio button as checked
	modifyElement(
		page,
		'ul.ui-listview input[value="' + setting.get() + '"]',
		function(el) { el.checked = true; }
	);
	
	//Handle clicks on list view
	modifyElement(page, 'ul.ui-listview', function(listView) {
		Rx.Observable.fromEvent(listView, 'click')
			.map(function(ev) { return ev.target; })
			.filter(function(el) { return function(el) { return el.name === radioButtonElementName; }; })
			.map(function(el) { return el.value; })
			.subscribe(function(value) {
				setting.set(value);
				history.back();
			});
	});
};

/*
 * Parameters:
 *	key
 *		string describing key for storing value for given option
 *	defaultValue
 *		default value for given setting
 *	mappingObject object  (or undefined) with functions:
 *		boolean has(value) - test if value exists in mapping
 *		value map(value) - returns mapping for given value
 */
const createGetterAndSetterForLocalStorageImpl = function(key, defaultValue, mappingObject) {
	if (mappingObject) {
		if (!mappingObject.has(defaultValue)) {
			console.warn('Default value "' + defaultValue + '" for key "' + key + '" cannot be mapped');
		}
	}
	
	const rawValueGetterImpl = function() {
		const value = localStorage.getItem(key) || defaultValue;
		return value;
	};
	
	const result = {
		get: rawValueGetterImpl,

		getMapped: function() {
			return this.getMappedValue(this.get());
		},
		
		getMappedValue: function(value) {
			if (mappingObject) {
				if (mappingObject.has(value)) {
					return mappingObject.map(value);
				} else {
					console.warn('Value "' + value + '" not found in mapping');
				}
			} else {
				console.warn('No mapping');
			}

			return "";
		},
		
		getDefaultValue: function() {
			return defaultValue;
		},
		
		set: function(newValue) {
			if (mappingObject && !mappingObject.has(newValue)) {
				console.warn('New value "' + newValue + '" for key "' + key + '" cannot be mapped');
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
		
		//Create new object with given mapping
		remap: function(newMappingObject) {
			return createGetterAndSetterForLocalStorageImpl(key, defaultValue, newMappingObject);
		},
	};
	
	return result;
};

//May be used as mappingObject in createGetterAndSetterForLocalStorageImpl function
//Simple value to value mapping.
const createValueMapping = function(mapping) {
	return {
		has: function(value) {
			return mapping.hasOwnProperty(value);
		},
		
		map: function(value) {
			return mapping[value];
		},
	};
};

//May be used as mappingObject in createGetterAndSetterForLocalStorageImpl function
//Value to localized text mapping.
const createValueToLocalizationKeyMapping = function(mapping) {
	//Value to localization key mapping
	const locKeyMapping = createValueMapping(mapping);

	return {
		has: function(value) {
			return locKeyMapping.has(value) && TIZEN_L10N.hasOwnProperty(locKeyMapping.map(value))
		},
		
		map: function(value) {
			return TIZEN_L10N[locKeyMapping.map(value)]
		},
	};
};

const createValueDecoratedMappingObject = function(mappingObject, decorator) {
	return {
		has: function(value) {
			return mappingObject.has(value);
		},
		
		map: function(value) {						
			return decorator(mappingObject.map(value));
		},
	};
};

const createMapZoomMappingObject = function() {
	//Do not use this var directly. Use: getRemappedDistanceLazily function
 	var distance = null;
 	
	//It has to be lazy because createMapZoomLocalization function is used during creation of 'storage' object.
	//	Function body uses 'storage' which do not exists at moment of calling createMapZoomLocalization. Thus remapping
	//	has to be postponed until 'storage' exists.
 	const getRemappedDistanceLazily = function() {
		if (!distance) {
			const mapping = {
				'1': 'SETTINGS_MENU_UNITS_MAP_ZOOM_MILES',
				'2': 'SETTINGS_MENU_UNITS_MAP_ZOOM_KILOMETERS',
				'3': 'SETTINGS_MENU_UNITS_MAP_ZOOM_MEGAMETERS',
			};
			
			distance = storage.settings.units.distance.remap(
				createValueToLocalizationKeyMapping(mapping));
		}
		
		return distance;
 	};
 	
 	const mapZoomMapping = createValueMapping({
 		'1' : '25',
 		'2' : '50',
 		'3' : '75',
 		'4' : '100'
 	});
 	
	return createValueDecoratedMappingObject(mapZoomMapping, function(value) {
		return value + ' ' + getRemappedDistanceLazily().getMapped(); });
};

const storage = {
	settings: {
		units: {
			time: createGetterAndSetterForLocalStorageImpl(
					'settings_units_time_key',
					'1',
					createValueToLocalizationKeyMapping({
						'1': 'SETTINGS_MENU_UNITS_TIME_SYSTEM',
						'2': 'SETTINGS_MENU_UNITS_TIME_12h',
						'3': 'SETTINGS_MENU_UNITS_TIME_24h'})),
			distance: createGetterAndSetterForLocalStorageImpl(
					'settings_units_distance_key',
					'1',
					createValueToLocalizationKeyMapping({
						'1': 'SETTINGS_MENU_UNITS_DISTANCE_MILES_DEFAULT',
						'2': 'SETTINGS_MENU_UNITS_DISTANCE_KILOMETERS',
						'3': 'SETTINGS_MENU_UNITS_DISTANCE_MEGAMETERS'})),
			mapzoom: createGetterAndSetterForLocalStorageImpl(
					'settings_units_mapzoom_key',
					'4',
					createMapZoomMappingObject()),
            
			temperature: createGetterAndSetterForLocalStorageImpl(
					'settings_units_temperature_key', 
					'1',
					createValueToLocalizationKeyMapping({
						'1': 'SETTINGS_MENU_UNITS_TEMPERATURE_SYSTEM',
						'2': 'SETTINGS_MENU_UNITS_TEMPERATURE_FAHRENHEIT',
						'3': 'SETTINGS_MENU_UNITS_TEMPERATURE_CELSIUS'})),
						
			partnerapp : createGetterAndSetterForLocalStorageImpl(
					'settings_units_partnerapp_key', 
					'1',
					createValueToLocalizationKeyMapping({
						'1' : 'SETTINGS_MENU_UNITS_PARTNER_APP_STORM_DEFAULT',
						'2' : 'SETTINGS_MENU_UNITS_PARTNER_APP_TWC',
						'3' : 'SETTINGS_MENU_UNITS_PARTNER_APP_TWC_SAMSUNG',
						'4' : 'SETTINGS_MENU_UNITS_PARTNER_APP_TWC_LITE'
					}))
		},
	},
};