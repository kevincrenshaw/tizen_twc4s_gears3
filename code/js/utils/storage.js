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
	
	//json section
	const jsonStorageSession = 'json_stored_session_';
	const jsonStorageSessionIndex = 'json_stored_session_index';
	const jsonStorageMaxSize = 1;
	
	//file section
	const fileStorageSession = 'file_stored_session_';
	const fileStorageSessionIndex = 'file_stored_session_index';
	const fileStorageMaxSize = 1;
	const rootDirName = 'wgt-private';
	const fileDataDirName = 'file-data';
	const fileFilePrefix = 'file-data-';
	
	const getJsonSession = function(index) {
		console.log('getJsonSession:: ' + index);
        return localStorage.getItem(jsonStorageSession + index);
    };
    
    const getFiletSession = function(index, callback) {
    	const imageFileName = fileFilePrefix + index;
		const rootDirectoryName = fsutils.createFullPath(rootDirName, fileDataDirName);
		
		fsutils.hasSuchFile(rootDirectoryName, imageFileName, fsutils.comparatorFileNamesWithoutExtension, callback);
    };

    const addJsonSession = function(index, value) {
        localStorage.setItem(jsonStorageSession + index, value);
    };
    
    const addFileSession = function(index, downloadedFileName, callback) {
    	const newFileName = fileFilePrefix + index + '.' + fsutils.getFileExtension(downloadedFileName);
    	//create data file directory if its not exist
    	var fileDataDir = fsutils.createFileIfNotExists(rootDirName, fileDataDirName, true, function(result) {
        	//if all are ready move file from downloads directory to data file
        	var srcPath = fsutils.createFullPath('downloads', downloadedFileName);
        	var dstPath = fsutils.createFullPath(rootDirName, fileDataDirName, newFileName);
        	fsutils.moveFile(srcPath, dstPath, callback);
        });
    };
   
    const removeLastJsonSession = function(index) {
    	localStorage.removeItem(jsonStorageSession + index);
    };
    
    const removeLastFileSession = function(index) {
		const imageFileName = fileFilePrefix + index;
		const rootDirectoryName = fsutils.createFullPath(rootDirName, fileDataDirName);
		fsutils.removeFile(rootDirectoryName, imageFileName);
	};

	const createSessionObject = function(sessionStorageKey, maxSize, getSessionCallback, addSessionCallback, removeLastSessionCallback) {
		
		const getIndex = function() {
			return parseInt(localStorage.getItem(sessionStorageKey)) || 0;
		};
		
		const increaseIndex = function() {
			const newValue = (getIndex() + 1) % maxSize;
			localStorage.setItem(sessionStorageKey, newValue);
    	};
    	
    	const decreaseIndex = function() {
	    	const newValue = (getIndex() + maxSize - 1) % maxSize;
	    	localStorage.setItem(sessionStorageKey, newValue);
	    };
	    
	    const getSession = function(callback) {
	    	console.log('get session, index: ' +  getIndex());
	    	return getSessionCallback(getIndex(), callback);
	    };
	    
	    const addSessionToLocalStorage = function(value) {
	    	increaseIndex();
	    	console.log('addSession.index: ' + getIndex());
	    	addSessionCallback(getIndex(), value);
	    };
	    
	    const addSessionToFile = function(downloadedFileName, callback) {
	    	increaseIndex();
	    	console.log('addSession.index: ' + getIndex());
	    	addSessionCallback(getIndex(), downloadedFileName, callback);
	    };

	    const removeLastSession = function() {
	    	console.log('removeLastSession.index: ' + getIndex());
	    	removeLastSessionCallback(getIndex());
	    	decreaseIndex();
	    };

		return {
			getSession: getSession,
			addSessionToLocalStorage: addSessionToLocalStorage,
			addSessionToFile: addSessionToFile,
			removeLastSession: removeLastSession,
		};
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
		jsonSession : createSessionObject(jsonStorageSessionIndex, jsonStorageMaxSize, getJsonSession, addJsonSession, removeLastJsonSession),
		fileSession : createSessionObject(fileStorageSessionIndex, fileStorageMaxSize, getFiletSession, addFileSession, removeLastFileSession),
	};
	
	return storage;
});