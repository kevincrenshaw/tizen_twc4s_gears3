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
	const createGetterAndSetterForStorageImpl = function(key, defaultValue, mappingObject) {
		if (mappingObject) {
			if (!mappingObject.has(defaultValue)) {
				console.warn('Default value "' + defaultValue + '" for key "' + key + '" cannot be mapped');
			}
		}
	
		const rawValueGetterImpl = function() {			
			if (tizen.preference.exists(key)) {
				return tizen.preference.getValue(key);
			} else {
				return defaultValue;
			}
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
					tizen.preference.setValue(key, newValue);
					console.log('storage["' + key + '"] value change: "' + oldValue + '" -> "' + newValue + '"');
					return true;
				} else {
					return false;
				}
			},
			
			//Create new object with given mapping
			remap: function(newMappingObject) {
				return createGetterAndSetterForStorageImpl(key, defaultValue, newMappingObject);
			},
		};
	
		return result;
	};
	
	//May be used as mappingObject in createGetterAndSetterForStorageImpl function
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
	
	//May be used as mappingObject in createGetterAndSetterForStorageImpl function
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
	 * get saved index by key in a localStorage
	 * Params:
	 * 		sessionStorageKey - key for getting index data from locale storage
	 * 
	 * Returns:
	 * 		index stored by sessionStorageKey, or 0
	 * */
	const getIndex = function(sessionStorageKey) {
		return parseInt(localStorage.getItem(sessionStorageKey)) || 0;
	};
	
	/**
	 * set and save index by key in a localStorage
	 * Params:
	 * 		sessionStorageKey - key for setting index data to a localStorage
	 * 		index - index value to save
	 * 
	 * Returns:
	 * 		nothing
	 * */
	const setIndex = function(sessionStorageKey, index) {
		localStorage.setItem(sessionStorageKey, index);
	};
	
	/**
	 * increase and save index value
	 * Params:
	 * 		sessionStorageKey - key for setting index data to a localStorage
	 * 		oldIndexVal - old index value
	 * 		maxIndexVal - max for an index value
	 * 
	 * Returns:
	 * 		new index value (increased)
	 * */
	const increaseAndStoreIndex = function(sessionStorageKey, oldIndexVal, maxIndexVal) {
		const newValue = (oldIndexVal + 1) % maxIndexVal;
		setIndex(sessionStorageKey, newValue);
		return newValue;
	};
	
	/**
	 * decrease and save index value
	 * Params:
	 * 		sessionStorageKey - key for setting index data to a localStorage
	 * 		oldIndexVal - old index value
	 * 		maxIndexVal - max for an index value
	 * 
	 * Returns:
	 * new index value (decreased)
	 * */
	const decreaseAndStoreIndex = function(sessionStorageKey, oldIndexVal, maxIndexVal) {
    	const newValue = (oldIndexVal + maxIndexVal - 1) % maxIndexVal;
    	setIndex(sessionStorageKey, newValue);
    	return newValue;
    };
	
    
	const createLocalStorage = function(key, maxSize) {
		const LSIndex = key + '_ls_index';
		const LSValue = key + '_ls_value_';

		const get = function() {
			const index = getIndex(LSIndex);
			return localStorage.getItem(LSValue + index);
		};
		
		const add = function(value) {
			const index = getIndex(LSIndex);
			const newIndex = increaseAndStoreIndex(LSIndex, index, maxSize);
			localStorage.setItem(LSValue + newIndex, value);
		};
		
		const remove = function() {
			const index = getIndex(LSIndex);
			localStorage.removeItem(LSValue + index);
			decreaseAndStoreIndex(LSIndex, index, maxSize);
		};
		
		return {
			get: get,
			add: add,
			remove: remove,
		};
	};
	
	const createFileStorage = function(key, maxSize) {

		const rootDirName = 'wgt-private';
		const fileDataDirName = 'file-data';
		
		const FSIndex = key + '_fs_index';
		const FSFileName = key + '_fs_filename_';
		
		
		/**
		 * get file from FS storage
		 * Params:
		 * 		onSuccess(file) will be called if file was obtained successfully
		 * 		onError(error) will be called if something went wrong
		 * Returns:
		 * 		nothing
		 * */
		const get = function(onSuccess, onError) {
			const index = getIndex(FSIndex);
			const savedFileName = localStorage.getItem(FSFileName + index);
			if(savedFileName) {
				const pathName = fsutils.createFullPath(rootDirName, fileDataDirName, savedFileName);
				fsutils.hasSuchFile(pathName, onSuccess, onError);
			} else {
				onError('cant get resolve file');
			}
		};
		
		/**
		 * check if file storage is empty
		 * 
		 * Returns:
		 * 		true if file storage is empty false otherwise
		 * */
		const empty = function() {
			const index = getIndex(FSIndex);
			const savedFileName = localStorage.getItem(FSFileName + index);
			return (!savedFileName);
		};

		const add = function(filePath, options) {
			
			options = options || {};
			const onSuccess = options.onSuccess || function(fileURI) {
				console.log('file: ' + fileURI + ' was added to a storage');
			};
			
			const onError = options.onError || function(error) {
				console.warn('file wasnt added to a storage, error' + error.message);
			};
			
			const index = getIndex(FSIndex);
			const newIndex = increaseAndStoreIndex(FSIndex, index, maxSize);
			
			const proceed = function() {
				//extract filename form file path
				const fileName = fsutils.getFileNameFromPath(filePath);
				localStorage.setItem(FSFileName + newIndex, fileName);
				//create data file directory if its not exist
		    	fsutils.createDirectoryIfNotExists(rootDirName, fileDataDirName, 
		    		function(result) {
		    			//if all are ready move file from src directory to private data storage
		    			const dstPath = fsutils.createFullPath(result.fullPath, fileName);
		    			fsutils.moveFile(filePath, dstPath, onSuccess, onError);
		    		},
		    		onError
		    	);
			};
			
			//at first we have to remove old file saved by current + 1 position
			removeAtIndex(newIndex, 
				function() {
					proceed();
				},
				function(error) {
					console.warn('cant remove file at given index, error: ' + error);
					proceed();
				}
			);
		};
		
		/**
		 * remove file at given index
		 * Params:
		 * 		index - used to obtain filename
		 * 		onResult() - called when file was deleted or if deleting completed with fail 
		 * Rerturns:
		 * 		nothing
		 * */
		const removeAtIndex = function(index, onSuccess, onError) {
			//get name of saved file at index
			const savedFileName = localStorage.getItem(FSFileName + index);
			if(savedFileName) {
				//create full path to a file
				const pathName = fsutils.createFullPath(rootDirName, fileDataDirName, savedFileName);
				console.log('removed file: ' + pathName + ' at index: ' + index);
				fsutils.removeFile(pathName, onSuccess, onError);
			} else {
				onSuccess();
			}
		};
		
		const remove = function(options) {
			options = options || {};
			const onSuccess = options.onSuccess || function() {
				console.log('file was deleted');
			};
			
			const onError = options.onError || function(error) {
				console.warn('file wasnt deleted, error: ' + error);
			};
			
			const index = getIndex(FSIndex);
			//get name of last saved file
			const savedFileName = localStorage.getItem(FSFileName + index);
			//if we have a record of this file in localStorage
			if(savedFileName) {
				//remove a name of file from localStorage
				localStorage.removeItem(FSFileName + index);
				const pathName = fsutils.createFullPath(rootDirName, fileDataDirName, savedFileName);
				//remove file
				fsutils.removeFile(pathName, onSuccess, onError);
				decreaseAndStoreIndex(FSIndex, index, maxSize);
			}
		};
		
		return {
			get: get,
			add: add,
			empty: empty,
			remove: remove,
		};
	};
	
	const storage = {
		settings: {
			units: {
				time: createGetterAndSetterForStorageImpl(
						'settings_units_time_key',
						'1',
						createValueToLocalizationKeyMapping({
							'1': 'SETTINGS_MENU_UNITS_TIME_SYSTEM',
							'2': 'SETTINGS_MENU_UNITS_TIME_12h',
							'3': 'SETTINGS_MENU_UNITS_TIME_24h'})),
				distance: createGetterAndSetterForStorageImpl(
						'settings_units_distance_key',
						'1',
						createValueToLocalizationKeyMapping({
							'1': 'SETTINGS_MENU_UNITS_DISTANCE_MILES_DEFAULT',
							'2': 'SETTINGS_MENU_UNITS_DISTANCE_KILOMETERS',
							'3': 'SETTINGS_MENU_UNITS_DISTANCE_MEGAMETERS'})),
				mapzoom: createGetterAndSetterForStorageImpl(
						'settings_units_mapzoom_key',
						'1',
						createMapZoomMappingObject()),

				temperature: createGetterAndSetterForStorageImpl(
						'settings_units_temperature_key', 
						'1',
						createValueToLocalizationKeyMapping({
							'1': 'SETTINGS_MENU_UNITS_TEMPERATURE_SYSTEM',
							'2': 'SETTINGS_MENU_UNITS_TEMPERATURE_FAHRENHEIT',
							'3': 'SETTINGS_MENU_UNITS_TEMPERATURE_CELSIUS'})),
							
				partnerapp : createGetterAndSetterForStorageImpl(
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
		json : createLocalStorage('json', 4),
		file : createFileStorage('file', 4),
		compass: createFileStorage('compass', 4),
		alert: createLocalStorage('alert', 4),
	};
	
	return storage;
});