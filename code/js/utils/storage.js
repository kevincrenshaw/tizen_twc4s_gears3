/* jshint esversion: 6 */

define(['rx', 'utils/fsutils', 'utils/const'], function(rx, fsutils, consts) {
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
	 * get saved index by key in a tizen.preference
	 * Params:
	 * 		sessionStorageKey - key for getting index data from locale storage
	 * 
	 * Returns:
	 * 		index stored by sessionStorageKey, or 0
	 * */
	const getIndex = function(sessionStorageKey) {
		try {
			return parseInt(tizen.preference.getValue(sessionStorageKey));
		} catch(err) {
			return 0;
		}
	};
	
	/**
	 * set and save index by key in a tizen.preference
	 * Params:
	 * 		sessionStorageKey - key for setting index data to a tizen.preference
	 * 		index - index value to save
	 * 
	 * Returns:
	 * 		nothing
	 * */
	const setIndex = function(sessionStorageKey, index) {
		tizen.preference.setValue(sessionStorageKey, index);
	};
	
	/**
	 * increase and save index value
	 * Params:
	 * 		sessionStorageKey - key for setting index data to a tizen.preference
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
	 * 		sessionStorageKey - key for setting index data to a tizen.preference
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
    
	const createFileStorage = function(key, maxSize) {

		const rootDirName = 'wgt-private';
		const fileDataDirName = 'file-data';
		
		const FSIndex = key + '_fs_index';
		const FSFileName = key + '_fs_filename_';

		const notifier = key + '_notifier';
		tizen.preference.setValue(notifier, 0);

		//Notifies observer (if any) about file addition
		const notify = function() {
			increaseAndStoreIndex(notifier, getIndex(notifier), 1000000);
		};

		const getSavedFileNameAtIndex = function(index) {
			try {
				return tizen.preference.getValue(FSFileName + index);
			} catch(err) {
				return null;
			}
		};

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
			const savedFileName = getSavedFileNameAtIndex(index);

			if(savedFileName) {
				const pathName = fsutils.createFullPath(rootDirName, fileDataDirName, savedFileName);
				fsutils.hasSuchFile(pathName, onSuccess, onError);
			} else {
				onError('get::cant resolve file');
			}
		};

		const getRx = function() {
			return rx.Observable.create(function(observer) {
				const onSuccess = function(file) {
					observer.onNext(file);
					observer.onCompleted();	
				};

				const onError = function(err) {
					observer.onError(err);
				}

				try {
					get(onSuccess, onError);
				} catch (err) {
					onError(err);
				}
			});
		};
		
		/**
		 * check if file storage is empty
		 * 
		 * Returns:
		 * 		true if file storage is empty false otherwise
		 * */
		const empty = function() {
			const index = getIndex(FSIndex);
			const savedFileName = getSavedFileNameAtIndex(index);

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
				tizen.preference.setValue(FSFileName + newIndex, fileName);
				//create data file directory if its not exist
				fsutils.createDirectoryIfNotExists(rootDirName, fileDataDirName, 
					function(result) {
						//if all are ready move file from src directory to private data storage
						const dstPath = fsutils.createFullPath(result.fullPath, fileName);
						fsutils.moveFile(filePath, dstPath, function(fileURI) {
							onSuccess(fileURI);
							notify();
						}, onError);
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

		const addRx = function(filePath) {
			return rx.Observable.create(function(observer) {
				const onSuccess = function(file) {
					observer.onNext(file);
					observer.onCompleted();	
				};

				const onError = function(err) {
					observer.onError(err);
				}

				try {
					add(filePath, { onSuccess:onSuccess, onError:onError });
				} catch (err) {
					onError(err);
				}
			});
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
			const savedFileName = getSavedFileNameAtIndex(index);

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

			const savedFileName = getSavedFileNameAtIndex(index);
			//if we have a record of this file in tizen.preference
			if(savedFileName) {
				//remove a name of file from tizen.preference
				if(tizen.preference.exists(FSFileName + index)) {
					tizen.preference.remove(FSFileName + index);
				}

				const pathName = fsutils.createFullPath(rootDirName, fileDataDirName, savedFileName);
				//remove file
				fsutils.removeFile(pathName, onSuccess, onError);
				decreaseAndStoreIndex(FSIndex, index, maxSize);
			}
		};

		const removeRx = function() {
			return rx.Observable.create(function(observer) {
				const onSuccess = function() {
					observer.onNext();
					observer.onCompleted();	
				};

				const onError = function(err) {
					observer.onError(err);
				}

				try {
					if (!empty()) {
						remove( { onSuccess:onSuccess, onError:onError} );
					} else {
						onSuccess();
					}
				} catch (err) {
					onError(err);
				}
			});
		};

		const setChangeListener = function(listener) {
			tizen.preference.setChangeListener(notifier, listener);
		};
		
		const unsetChangeListener = function() {
			tizen.preference.unsetChangeListener(notifier);
		};
		
		return {
			get: get,
			getRx: getRx,
			add: add,
			addRx: addRx,
			empty: empty,
			remove: remove,
			removeRx: removeRx,
			setChangeListener: setChangeListener,
			unsetChangeListener: unsetChangeListener,
		};
	};
	
	const createSimpleStorage = function(key, initialValue) {
		if (!tizen.preference.exists(key)) {
			tizen.preference.setValue(key, initialValue);
		}
		
		return {
			get: function() {
				return tizen.preference.getValue(key);
			},
			
			set: function(value) {
				tizen.preference.setValue(key, value);
			},
			getAndSet: function(value) {
				const result = tizen.preference.getValue(key);
				tizen.preference.setValue(key, value);
				return result;
			},
			setChangeListener: function(listener) {
				tizen.preference.setChangeListener(key, listener);
			},
			
			unsetChangeListener: function() {
				tizen.preference.unsetChangeListener(key);
			},
		}
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
							'1': 'SETTINGS_MENU_UNITS_TEMPERATURE_FAHRENHEIT',
							'2': 'SETTINGS_MENU_UNITS_TEMPERATURE_CELSIUS'})),
							
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
		file: createFileStorage('file', 1),
		data: createSimpleStorage('data', ''),
		map: createSimpleStorage('map', ''),	//current file path to map (for widget)
		lastUpdate: createSimpleStorage('lastUpdate', 0),	//last successful data update time (as epoch in seconds)
		ampm: createSimpleStorage('ampm', ''),
		pastMap: [],
		futureMap: [],
		navigateTo: createSimpleStorage('navigateTo', ''),
	};
	
	for (var i=0; i<consts.NBR_OF_PAST_MAPS; ++i) {
		storage.pastMap.push({
			file: createFileStorage('pastMap' + i, 1),
			timestamp: createSimpleStorage('pastMapTimestamp' + i, 0),
		});
	}

	for (var i=0; i<consts.NBR_OF_FUTURE_MAPS; ++i) {
		storage.futureMap.push({
			file: createFileStorage('futureMap' + i, 1),
			timestamp: createSimpleStorage('futureMapTimestamp' + i, 0),
		});
	}

	return storage;
});