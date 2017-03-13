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
	var updateInterval;
	
    //every 1 second update interval
    const updateInterval = 1000;
	
    var intervalUpdaterId = null;

	const createUri = function(base, params) {
		params = params || {};
		const paramsArr = [];
		
		Object.keys(params).forEach(function(key) {
			paramsArr.push([key, params[key]].join('='));
		});
		
		return base + (paramsArr.length > 0 ? '?' + paramsArr.join('&') : '');
	};
	
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
		return createUri(uriBase, params);
	};

	const getCurrentConditionsUri = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.API_KEY,
		};
		
		const uriBase = ['https://api.weather.com', 'v1', 'geocode', latitude, longitude, 'observations', 'current.json'].join('/');
		return createUri(uriBase, options);
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
			console.warn('unexpected temperature setting value "' + temperatureSetting + '"');
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
			
			//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
			//1: 'PERMISSION_DENIED',
			//2: 'POSITION_UNAVAILABLE',
			//3: 'TIMEOUT',			
			navigator.geolocation.getCurrentPosition(onSuccess, observer.onError, { timeout: timeout });
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
				},
				refresh: {
					btn: {
						enable: enableImpl(element.header.refresh.btn),
						onClick: onClickImpl(element.header.refresh.btn),
					},

					text: setInnerHtmlImpl(element.header.refresh.text),
				},
				time: {
					text: setInnerHtml(element.header.time.value),
					unit: setInnerHtml(element.header.time.unit),
				},
			},
		};
	};
	
	const updateUI = function(ui) {
		if(ui) {
			const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
			const currentTimeRepr = utils.getTimeAsText(new Date(), storage.settings.units.time.get(), systemUses12hFormat);
			const timeText = currentTimeRepr[0];
			const timeUnit = currentTimeRepr[1];
			//apply on ui
			ui.header.time.text(timeText);
			ui.header.time.unit(timeUnit);			
        } else {
            console.warn('updateUI. there is no ui to update');
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
			if (updateInterval) {
				clearInterval(updateInterval);
				updateInterval = null;
			}
		},
		
		pagebeforeshow: function(ev) {
			const page = ev.target;
			const ui = createUiManager(page);
			
			ui.map.visible(false);
			ui.header.visible(false);
			ui.header.refresh.btn.enable(false);
			
			const displayData = function(mapFilePath, jsonStorageObject) {
				const weather = jsonStorageObject.external;
				
				const tempInCelsius = extractTempertatureFromCurrentConditions(weather);
				const tempTextualRepr = getTemperatureAndUnitAsText(
					tempInCelsius,
					storage.settings.units.temperature.get());
				
				const tempText = [tempTextualRepr[0], '°'].join('');
				const unitText = tempTextualRepr[1];
				//time
				updateUI(ui);
                if(intervalUpdaterId === null) {
                    intervalUpdaterId = setInterval(updateUI, updateInterval, ui);                    
                }
				
				const createWeatherDownloadTimeUpdater = function(baseEpochInSeconds) {
					return function() {
						const diffInSeconds = utils.getNowAsEpochInSeconds() - baseEpochInSeconds;
						const locArr = utils.timeDiffToValueAndLocalizationKey(diffInSeconds);
						
						if (locArr[0] === null) {
							locArr[0] = '';
						}
						
						if (locArr[1] in TIZEN_L10N) {
							locArr[1] = TIZEN_L10N[locArr[1]];
						}
						
						const text = locArr.join(' ').trim();
						ui.header.refresh.text(text + ' [' + diffInSeconds + ']');
					}
				};
				
				if (updateInterval) {
					clearInterval(updateInterval);
					updateInterval = null;
				}

				const baseEpochInSeconds = jsonStorageObject.internal.downloadTimeEpochInSeconds;
				const weatherDownloadTimeUpdater = createWeatherDownloadTimeUpdater(baseEpochInSeconds);
				weatherDownloadTimeUpdater();
				updateInterval = setInterval(weatherDownloadTimeUpdater, 1000);
				
				ui.map.src(mapFilePath);
				ui.header.temperature.text(tempText);
				ui.header.temperature.unit(unitText);
				ui.header.refresh.btn.enable(true);
				ui.map.visible(true);
				ui.header.visible(true);
			};
			
			const displayCachedData = function(mapFile) {
				const jsonStorageObject = JSON.parse(storage.json.get());
				
				console.log('displayCachedData: mapFile=' + mapFile.toURI());
				
				if (weather) {
					displayData(mapFile.toURI(), jsonStorageObject);
				} else {
					console.warn('No weather data despite we have map file');
				}
			};
			
			//Attempts to get current location, fetch data for location and then display it
			const tryGetNewData = function() {
				console.log('getting current position...');
				
				if (currentPositionSubscription) {
					currentPositionSubscription.dispose();
					currentPositionSubscription = null;
				}
				
				ui.header.refresh.btn.enable(false);
				
				const baseObs = getCurrentPositionRx(consts.GEOLOCATION_TIMEOUT_IN_MS).map(function(pos) {
					return [pos.coords.latitude, pos.coords.longitude];
				});
				
				currentPositionSubscription = baseObs.flatMap(currentPositionAvailableRx).subscribe(function(data) {
					const mapFilePath = data[0];
					const jsonStorageContent = data[1];
					
					console.log('Map and weather data downloaded successfully');
					displayData(mapFilePath, jsonStorageContent);
				}, function(err) {
					//It may happen download will fail, just warning
					console.warn('Download/store problem: ' + JSON.stringify(err));
					ui.header.refresh.btn.enable(true);
				});
			};
			
			//Called when geolocation has current positon
			const currentPositionAvailableRx = function(coords) {
				const latitude = coords[0];
				const longitude = coords[1];
				
				const mapZoom = parseInt(storage.settings.units.mapzoom.get());
				const distance = parseInt(storage.settings.units.distance.get());
				const lod = map.getMapLod(mapZoom, distance);
				
				console.log('currentPositionAvailableRx: mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude + ', lod=' + lod);
				
				const mapImgUri = getMapImgUri(latitude, longitude, lod);
				console.log('mapImgUri: ' + mapImgUri);
				
				const currentConditionsUri = getCurrentConditionsUri(latitude, longitude);
				console.log('currentConditionsUri: ' + currentConditionsUri);
				
				const epoch = utils.getNowAsEpochInMiliseconds();
				const uniqueFileName = [['map', epoch, utils.guid()].join('_'), '.jpg'].join('');
				console.log('uniqueFileName: ' + uniqueFileName);
				
				const mapStoreObs = network.downloadFileRx(mapImgUri, uniqueFileName)
					.flatMap(storageFileAddRx);
				
				const weatherStoreObs = network.getResourcesByURL([currentConditionsUri])
				.filter(function(data) {
					return data && data.metadata && data.metadata.status_code === 200;
				})
				.map(function(data) {
					const storageContent = storage.json.get();
					const storageObject = storageContent ? JSON.parse(storageContent) : { internal: {}, external:null, };
					
					storageObject.internal.downloadTimeEpochInSeconds = utils.getNowAsEpochInSeconds();
					storageObject.external = data;

					storage.json.add(JSON.stringify(storageObject));
					return storageObject;
				});
				
				return rx.Observable.zip([mapStoreObs, weatherStoreObs]);
			};
			
			storageFileGetRx().subscribe(displayCachedData, function(err) {
				console.error('storageFileGetRx: ' + JSON.stringify(err));
				ui.header.refresh.btn.enable(true);
			}, tryGetNewData);
			
			ui.header.refresh.btn.onClick(tryGetNewData);
		},
	};
});