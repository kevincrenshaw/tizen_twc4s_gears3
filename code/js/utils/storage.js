/* jshint esversion: 6 */

define(['utils/fsutils'], function(fsutils) {
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
				return locKeyMapping.has(value) && TIZEN_L10N.hasOwnProperty(locKeyMapping.map(value));
			},
			
			map: function(value) {
				return TIZEN_L10N[locKeyMapping.map(value)];
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
	 		'1' : '100',
	 		'2' : '75',
	 		'3' : '50',
	 		'4' : '25'
	 	});
	 	
		return createValueDecoratedMappingObject(mapZoomMapping, function(value) {
			return value + ' ' + getRemappedDistanceLazily().getMapped(); });
	};

	/**
	 * get saved session storage key
	 * */
	const getIndex = function(sessionStorageKey) {
		return parseInt(localStorage.getItem(sessionStorageKey)) || 0;
	};
	
	/**
	 * set saved session storage key
	 * */
	const setIndex = function(sessionStorageKey, index) {
		return localStorage.setItem(sessionStorageKey, index);
	};
	
	/**
	 * increase and save index value
	 * */
	const increaseIndex = function(sessionStorageKey, oldIndexVal, maxIndexVal) {
		const newValue = (oldIndexVal + 1) % maxIndexVal;
		setIndex(sessionStorageKey, newValue);
		return newValue;
	};
	
	/**
	 * decrease and save index value
	 * */
	const decreaseIndex = function(sessionStorageKey, oldIndexVal, maxIndexVal) {
    	const newValue = (oldIndexVal + maxIndexVal - 1) % maxIndexVal;
    	setIndex(sessionStorageKey, newValue);
    	return newValue;
    };
	
    
	const createLocalStorage = function(key, maxSize) {
		const LSIndex = key + '_ls_index';
		const LSValue = key + '_ls_value_';

		const getSession = function() {
			const index = getIndex(LSIndex);
			return localStorage.getItem(LSValue + index);
		};
		
		const addSession = function(value) {
			const index = getIndex(LSIndex);
			const newIndex = increaseIndex(LSIndex, index, maxSize);
			console.log('LS addSession, index: ' + newIndex);
			//save data
			localStorage.setItem(LSValue + newIndex, value);
		};
		
		const removeSession = function() {
			const index = getIndex(LSIndex);
			localStorage.removeItem(LSValue + index);
			console.log('LS removeSession, index: ' + index);
			const newIndex = decreaseIndex(LSIndex, index, maxSize);
			console.log('LS removeSession, newIndex: ' + newIndex);
		};
		
		return {
			getSession: getSession,
			addSession: addSession,
			removeSession: removeSession,
		}
	};
	
	const createFileStorage = function(key, maxSize) {

		const rootDirName = 'wgt-private';
		const fileDataDirName = 'file-data';
		
		const FSIndex = key + '_fs_index';
		const FSFileName = key + '_fs_filename_';
		
		const getSession = function(callback) {
			const index = getIndex(FSIndex);
			const savedFileName = localStorage.getItem(FSFileName + index);
			
			const rootDirectoryName = fsutils.createFullPath(rootDirName, fileDataDirName);
			fsutils.hasSuchFile(rootDirectoryName, savedFileName, fsutils.comparatorFileNamesWithoutExtension, callback);
		};
		
		const addSession = function(filePath, callback) {
			
			const index = getIndex(FSIndex);
			const newIndex = increaseIndex(FSIndex, index, maxSize);
			//extract filename form file path
			const fileName = fsutils.getFileNameFromPath(filePath);
			localStorage.setItem(FSFileName + newIndex, fileName);

			//create data file directory if its not exist
	    	var fileDataDir = fsutils.createFileIfNotExists(rootDirName, fileDataDirName, true, function(result) {
	    		//if all are ready move file from src directory to private data storage
	    		var dstPath = fsutils.createFullPath(rootDirName, fileDataDirName, fileName);
	    		fsutils.moveFile(filePath, dstPath, callback);
	    	});
		};
		
		const removeSession = function() {
			const index = getIndex(FSIndex);
			//get name of last saved file
			const savedFileName = localStorage.getItem(FSFileName + index);
			//remove a name of file from localStorage
			localStorage.removeItem(FSFileName + index);
			
			const rootDirectoryName = fsutils.createFullPath(rootDirName, fileDataDirName);
			//remove file
			fsutils.removeFile(rootDirectoryName, savedFileName);
			const newIndex = decreaseIndex(FSIndex, index, maxSize);
		};
		
		return {
			getSession: getSession,
			addSession: addSession,
			removeSession: removeSession,
		}
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
						'1',
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
		jsonSession : createLocalStorage('json', 4),
		fileSession : createFileStorage('file', 4),
	};
	
	return storage;
});