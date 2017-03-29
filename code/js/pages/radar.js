/* jshint esversion: 6 */

const radarModules = [
	'utils/storage',
	'utils/map',
	'utils/network',
	'utils/const',
	'utils/utils',
	'utils/dom',
	'rx'
];

define(radarModules, function(storage, map, network, consts, utils, dom, rx) {
	var currentPositionSubscription;
	var intervalUpdaterId = null;
	var ui;
	var lastRefreshEpochTime;

	var snapshotTimeRepr = null;
	var currentTimeRepr = null;

	const getMapImgUri = function(latitude, longitude, lod, options) {
		options = options || {};
		
		const latByLod = map.getAllowedPrecisionAccordingToLod(latitude, lod);
		const longByLod = map.getAllowedPrecisionAccordingToLod(longitude, lod);
		
		console.log('getMapImgUri: lod={value=' + lod + ', lat:' + latitude + '->' + latByLod + ', long:' + longitude + '->' + longByLod + '}');
		
		const params = {
			geocode: [latByLod, longByLod].join(','),
			w: options.width || 400,
			h: options.height || 400,
			lod: lod,
			product: options.product || 'satrad',
			apiKey: consts.API_KEY,
		};

		const uriBase = ['https://api.weather.com', 'v2', 'maps', 'dynamic'].join('/');
		return utils.createUri(uriBase, params);
	};

	const getCurrentConditionsUri = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.API_KEY,
		};
		
		const uriBase = ['https://api.weather.com', 'v1', 'geocode', latitude, longitude, 'observations', 'current.json'].join('/');
		return utils.createUri(uriBase, options);
	};
	
	/*
	 * Converts temperature into textual representation.
	 * Parameters:
	 *		tempValueInCelsius - current temperature in Celsius
	 *		currentTemperatureUnitSetting - current temperature unit setting, for instance value returned by:
	 *			storage.settings.units.temperature.get()
	 *
	 * Result:
	 * 		Return array of two elements. First one is temperature converted to Celsius/Fahrenheit units. Second is
	 * 		textual representation of temperature unit.
	 */
	const getTemperatureAndUnitAsText = function(tempValueInCelsius, currentTemperatureUnitSetting) {
		switch (parseInt(currentTemperatureUnitSetting)) {
		case consts.settings.units.temperature.SYSTEM:
			console.warn('temperature system setting not supported yet, falling back to Celsius');
			/* falls through */
		case consts.settings.units.temperature.CELSIUS:
			return [tempValueInCelsius, 'C'];
			
		case consts.settings.units.temperature.FAHRENHEIT:
			return [Math.round(utils.celsiusToFahrenheit(tempValueInCelsius)), 'F'];
			
		default:
			console.warn('unexpected temperature setting value "' + currentTemperatureUnitSetting + '"');
		}
	};
	
	const extractTempertatureFromCurrentConditions = function(weather) {
		return weather.observation.metric.temp;
	};
	
	const storageFileAddRx = function(filePath) {
		return rx.Observable.create(function(observer) {
			const onSuccess = function(fileUri) {
		 		observer.onNext(fileUri);
		 		observer.onCompleted();
			};

			storage.file.add(filePath, { onSuccess:onSuccess, onError:observer.onError });
		});
	};
	
	const storageFileGetRx = function() {
		return rx.Observable.create(function(observer) {
			if (storage.file.empty()) {
				observer.onCompleted();
			} else {
				storage.file.get(function(file) {
					observer.onNext(file);
					observer.onCompleted();
				}, observer.onError);
			}
		});
	};
	
	const getCurrentPositionRx = function(timeout) {
		return rx.Observable.create(function(observer) {
			const onSuccess = function(pos) {
				observer.onNext(pos);
				observer.onCompleted();
			};

			//Seems navigator.geolocation.getCurrentPosition replaces "this" for 2nd parameter. observer.onError relay
			//on "this" so it throws when "this" is replaced. Use wrapper to avoid this.
			const onError = function(err) {
				observer.onError(err);
			};
			
			//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
			//1: 'PERMISSION_DENIED',
			//2: 'POSITION_UNAVAILABLE',
			//3: 'TIMEOUT',			
			navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: timeout });
		});
	};
	
	const createUiManager = function(root) {
		const element = {
			map: dom.queryWrappedElement(root, '#map'),
			header: {
				container: dom.queryWrappedElement(root, '#header'),
				temperature: {
					value: dom.queryWrappedElement(root, '#temperatureBox #value'),
					unit: dom.queryWrappedElement(root, '#temperatureBox #unit'),
					at: dom.queryWrappedElement(root, '#temperatureBox #at'),
					time: dom.queryWrappedElement(root, '#temperatureBox #time'),
					ampm: dom.queryWrappedElement(root, '#temperatureBox #ampm'),
				},
				time : {
					value: dom.queryWrappedElement(root, '#timeBox #value'),
					unit: dom.queryWrappedElement(root, '#timeBox #unit'),
				},
				refresh: {
					btn: dom.queryWrappedElement(root, '#refreshBox #btn'),
					text: dom.queryWrappedElement(root, '#refreshBox #text'),
				},
			},
		};
		
		const visibilityImpl = function(wrappedElement) {
			return function(isVisible) {
				wrappedElement.apply(function(el) {
					el.style.visibility = isVisible ? 'visible' : 'hidden';
				});
			};
		};
		
		const setSrcImpl = function(wrappedElement) {
			return function(uri) {
				wrappedElement.apply(function(el) {
					el.src = uri;
				});
			};
		};
		
		const setInnerHtmlImpl = function(wrappedElement) {
			return function(text) {
				wrappedElement.apply(function(el) {
					el.innerHTML = text;
				});
			};
		};
		
		const enableImpl = function(wrappedElement) {
			return function(isEnabled) {
				wrappedElement.apply(function(el) {
					el.disabled = isEnabled ? false : true;
				});
			};
		};
		
		const onClickImpl = function(wrappedElement) {
			return function(handler) {
				wrappedElement.apply(function(el) {
					el.onclick = handler;
				});
			};
		};
		
		return {
			map: {
				visible: visibilityImpl(element.map),
				src: setSrcImpl(element.map),
			},
			
			header: {
				visible: visibilityImpl(element.header.container),
				temperature: {
					text: setInnerHtmlImpl(element.header.temperature.value),
					unit: setInnerHtmlImpl(element.header.temperature.unit),
					at: setInnerHtmlImpl(element.header.temperature.at),
					time: setInnerHtmlImpl(element.header.temperature.time),
					ampm: setInnerHtmlImpl(element.header.temperature.ampm),
				},
				refresh: {
					btn: {
						enable: enableImpl(element.header.refresh.btn),
						onClick: onClickImpl(element.header.refresh.btn),
					},

					text: setInnerHtmlImpl(element.header.refresh.text),
				},
				time: {
					text: setInnerHtmlImpl(element.header.time.value),
					unit: setInnerHtmlImpl(element.header.time.unit),
				},
			},
		};
	};
	
	const saveSnapshotTime = function(time) {
		tizen.preference.setValue('snapshot_time', time);
	};
	
	const saveTimeAmPm = function(ampm) {
		const ampm_key = 'time_ampm';
		if(ampm) {
			tizen.preference.setValue(ampm_key, ampm);			
		} else {
			if(tizen.preference.exists(ampm_key)) {
				tizen.preference.remove(ampm_key);				
			}
		}
	};
	
	/**
	 * update ui function. all periodic update UI processes should be place here
	 * */
	const updateUI = function(ui) {
		if(ui) {
			const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
			this.currentTimeRepr = utils.getTimeAsText(new Date(), storage.settings.units.time.get(), systemUses12hFormat);

			//apply on ui
			ui.header.time.text(this.currentTimeRepr[0]);
			ui.header.time.unit(this.currentTimeRepr[1]);
			if(this.snapshotTimeRepr) {
				ui.header.temperature.time(this.snapshotTimeRepr[0]);
				ui.header.temperature.ampm(this.snapshotTimeRepr[1]);
				ui.header.temperature.at(TIZEN_L10N.RADAR_AT);
			}
        } else {
            console.warn('updateUI. there is no ui to update');
        }
	};
	
	const diffCategoryToLocalizationKey = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};
	
	//Attempts to get current location, fetch data for location and then display it
	const tryGetNewData = function() {
		console.log('getting current position...');

		if (currentPositionSubscription) {
			currentPositionSubscription.dispose();
			currentPositionSubscription = null;
		}

		ui.header.refresh.btn.enable(false);

		currentPositionSubscription = getCurrentPositionRx(consts.GEOLOCATION_TIMEOUT_IN_MS).map(function(pos) {
			return [pos.coords.latitude, pos.coords.longitude];
		})
		.flatMap(downloadWeatherDataAndMap)
		.flatMap(storeWeatherDataAndMap)
		.subscribe(function(data) {
			const currentWeatherData = data[0];
			const mapFilePath = data[1];
			console.log('Map and weather data downloaded successfully');
			displayData(mapFilePath, currentWeatherData);
		}, function(err) {
			//It may happen download will fail, just warning
			console.warn('Download/store problem: ' + JSON.stringify(err));
			ui.header.refresh.btn.enable(true);
		});
	};

	/*
	 * For given coords tries to get current condition data (json) and download map (without stroing it
	 * in storage)
	 *
	 * Parameters:
	 * 		coords - array of exactly two elements [latitude, longitude]
	 *
	 * Result:
	 * 		Returns observable that emits array of exactly two elements:
	 * 			- current weather respresented as object (json returned by TWC API described
	 * 				here http://goo.gl/TO9kYm)
	 * 			- path to downloaded map (_not_ stored in our storage)
	 */
	const downloadWeatherDataAndMap = function(coords) {
		const latitude = coords[0];
		const longitude = coords[1];

		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());
		const lod = map.getMapLod(mapZoom, distance);

		console.log('downloadWeatherDataAndMap: mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude + ', lod=' + lod);

		const currentConditionsUri = getCurrentConditionsUri(latitude, longitude);
		console.log('currentConditionsUri: ' + currentConditionsUri);

		const mapImgUri = getMapImgUri(latitude, longitude, lod);
		console.log('mapImgUri: ' + mapImgUri);

		const epoch = utils.getNowAsEpochInMiliseconds();
		const uniqueFileName = [['map', epoch, utils.guid()].join('_'), '.jpg'].join('');
		console.log('uniqueFileName: ' + uniqueFileName);

		return network.getResourcesByURL([currentConditionsUri])
			.filter(function(weatherData) {
				return weatherData && weatherData.metadata && weatherData.metadata.status_code === 200;
			})
			.flatMap(function(weatherData) {
				//By now we have current conditions json data
				//Try to download map
				return network.downloadFileRx(mapImgUri, uniqueFileName)
					.map(function(mapFilePath) {
						//Return both downloaded map file path and current weather data
						return [weatherData, mapFilePath];
					});
			});
	};

	/*
	 * Stores given data (current weather object and map) in storage.json and storage.file.
	 *
	 * Parameters:
	 * 		data - array of exactly two elements [weatherDataObjec, filePathToMap]
	 *
	 * Result:
	 * 		Returns observable that emits array of exactly two elements:
	 * 			- saved data from storage (current weather data stored in 'external' attribute)
	 * 			- full file path to image data (map) in storage
	 */
	const storeWeatherDataAndMap = function(data) {
		const weatherData = data[0];
		const mapFilePath = data[1];

		return storageFileAddRx(mapFilePath).map(function(mapFilePathInStorage) {
			//Json storage for weather data does not have rx version. Just store it when map is stored
			//successfully.
			const newStorageObject = {
				internal: {
					downloadTimeEpochInSeconds: utils.getNowAsEpochInSeconds(),
					mapFilePath: mapFilePathInStorage, //store map file path for given weather data
				},
				external: weatherData,
			};

			storage.json.add(JSON.stringify(newStorageObject));
			return [newStorageObject, mapFilePathInStorage];
		});
	};

	const displayCachedData = function(mapFile) {
		const jsonStorageObject = JSON.parse(storage.json.get());

		console.log('displayCachedData: mapFile=' + mapFile.toURI());

		if (jsonStorageObject) {
			displayData(mapFile.toURI(), jsonStorageObject);
		} else {
			console.warn('No weather data despite we have map file');
		}
	};

	const displayData = function(mapFilePath, jsonStorageObject) {
		const weather = jsonStorageObject.external;
		const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		const tempInCelsius = extractTempertatureFromCurrentConditions(weather);
		const tempTextualRepr = getTemperatureAndUnitAsText(
			tempInCelsius,
			storage.settings.units.temperature.get());

		const tempText = [tempTextualRepr[0], '°'].join('');
		const unitText = tempTextualRepr[1];

		//Store path to map file for widget
		tizen.preference.setValue('current_map_image_path', mapFilePath);

		const weatherDownloadTimeUpdater = function() {
			const diffInSeconds = utils.getNowAsEpochInSeconds() - lastRefreshEpochTime;
			const diffCategory = utils.getCategoryForTimeDiff(diffInSeconds);

			if (diffCategory in diffCategoryToLocalizationKey) {
				const localizationKey = diffCategoryToLocalizationKey[diffCategory];
				if (localizationKey in TIZEN_L10N) {
					const localizedText = TIZEN_L10N[localizationKey];

					var textToDisplay;

					if (diffCategory === 1) {
						textToDisplay = localizedText;
					} else {
						textToDisplay = [utils.formatTimeDiffValue(diffInSeconds, diffCategory),
						                 localizedText].join(' ');
					}

					ui.header.refresh.text(textToDisplay);
				} else {
					console.warn('Key "' + localizationKey + '" not available in localization');
				}
			} else {
				console.warn('Diff category "' + diffCategory + '" cannot be mapped to localization key');
			}
		};

		//snapshot time
		const shapshotTimeInMillis = weather.observation.obs_time * 1000;
		this.snapshotTimeRepr = utils.getTimeAsText(new Date(shapshotTimeInMillis), storage.settings.units.time.get(), systemUses12hFormat);

		updateUI(ui);

		saveSnapshotTime(this.snapshotTimeRepr[0]);
		saveTimeAmPm(this.currentTimeRepr[1]);

		//refresh time
		lastRefreshEpochTime = jsonStorageObject.internal.downloadTimeEpochInSeconds;
		weatherDownloadTimeUpdater();

		if(intervalUpdaterId === null) {
			intervalUpdaterId = setInterval(
				function() {
					updateUI(ui);
					weatherDownloadTimeUpdater();
				},
				1000 //every 1 second update interval
			);
		}

		const weatherData = {
			map: mapFilePath,
			temperature: {
				valueInCelsius: tempInCelsius,
			}
		};
		
		//Store information for widget
		tizen.preference.setValue('weather_data', JSON.stringify(weatherData));

		ui.map.src(mapFilePath);
		ui.header.temperature.text(tempText);
		ui.header.temperature.unit(unitText);
		ui.header.refresh.btn.enable(true);
		ui.map.visible(true);
		ui.header.visible(true);
	};


	const visibilitychange = function() {
		if(document.hidden !== true) {
			tryGetNewData();
		}
	};

	return {
		pagebeforehide: function(ev) {
			if (currentPositionSubscription) {
				currentPositionSubscription.dispose();
				currentPositionSubscription = null;
			}

			if(intervalUpdaterId) {
				clearInterval(intervalUpdaterId);
				intervalUpdaterId = null;
			}
			document.removeEventListener('visibilitychange', visibilitychange);
			ui = null;
		},

		pagebeforeshow: function(ev) {
			const page = ev.target;
			ui = createUiManager(page);

			document.addEventListener('visibilitychange', visibilitychange);

			lastRefreshEpochTime = utils.getNowAsEpochInSeconds();

			var lastRefreshEpochTime = utils.getNowAsEpochInSeconds();

			ui.map.visible(false);
			ui.header.visible(false);
			ui.header.refresh.btn.enable(false);

			storageFileGetRx().subscribe(displayCachedData, function(err) {
				console.error('storeWeatherDataAndMap: ' + JSON.stringify(err));
				ui.header.refresh.btn.enable(true);
			}, tryGetNewData);
			
			ui.header.refresh.btn.onClick(tryGetNewData);
		},
	};
});