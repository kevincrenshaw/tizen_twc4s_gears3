/* jshint esversion: 6 */

const radarModules = [
	'utils/storage',
	'utils/map',
	'utils/network',
	'utils/const',
	'utils/utils',
	'rx'
];

define(radarModules, function(storage, map, network, consts, utils, rx) {
	var subscription;
	
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

		return createUri('https://api.weather.com/v2/maps/dynamic', params);
	};

	const getCurrentConditionsUri = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.API_KEY,
		};
		
		return createUri('https://api.weather.com/v1/geocode/' + latitude + '/' + longitude + '/observations/current.json', options);
	};
	
	const createTemperatureTextAccordingToSettings = function(tempValueInCelsius) {
		const temperatureSetting = parseInt(storage.settings.units.temperature.get());
		const separator = '';
		
		switch (temperatureSetting) {
		case consts.settings.units.temperature.SYSTEM:
			console.warn('temperature system setting not supported yet, falling back to Celsius');
			//break missing intentionally
		case consts.settings.units.temperature.CELSIUS:
			return [tempValueInCelsius, TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE_CELSIUS].join(separator);
			
		case consts.settings.units.temperature.FAHRENHEIT:
			return [Math.round(utils.celsiusToFahrenheit(tempValueInCelsius)),
				TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE_FAHRENHEIT].join(separator);
			
		default:
			console.warn('temperature setting value = ' + temperatureSetting);
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
			storage.file.get(function(file) {
				if (file) {
					observer.onNext(file);
					observer.onCompleted();
				} else {
					//No file in storage (not an error)
					observer.onCompleted();
				}
			});
		});
	};
	
	const getCurrentPositionRx = function(timeout) {
		return rx.Observable.create(function(observer) {
			const onSuccess = function(pos) {
				observer.onNext(pos);
				observer.onCompleted();
			};
			
			const onError = function(err) {
				//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
				//1: 'PERMISSION_DENIED',
				//2: 'POSITION_UNAVAILABLE',
				//3: 'TIMEOUT',
				observer.onError(err);
			};
			
			navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: timeout });
		});
	};
	
	const createUiManager = function(root) {
		const textSelector = '#text';
		const textWrapperSelector = '#textWrapper';
		const mapSelector = '#map';
		const headerSelector = '#header';
		const temperatureSelector = '#temperature';
		
		const textElement = root.querySelector(textSelector);
		const textWrapperElement = root.querySelector(textWrapperSelector);
		const mapElement = root.querySelector(mapSelector);
		const headerElement = root.querySelector(headerSelector);
		const temperatureElement = root.querySelector(temperatureSelector);
		
		const setVisibilityImpl = function(element, elementSelector) {
			return function(isVisible) {
				if (element) {
					element.style.visibility = isVisible ? 'visible' : 'hidden';
				} else {
					if (elementSelector) {
						console.warn('visibility: element "' + elementSelector + '" not found');
					} else {
						console.warn('visibility: element not found');
					}
				}
			}
		};
		
		return {
			map: {
				setVisibility: setVisibilityImpl(mapElement, mapSelector),
				
				set: function(uri) {
					if (mapElement) {
						mapElement.src = uri;
					} else {
						console.warn('element with selector ' + mapSelector + ' not found');
					}
				},
			},
			
			header: {
				setVisibility: setVisibilityImpl(headerElement, headerSelector),
				setTemperature: function(value) {
					if (temperatureElement) {
						temperatureElement.innerHTML = value;
					} else {
						console.warn('element with selector ' + temperatureSelector + ' not found');						
					}
				},
			},
		};
	};
	
	return {
		pagebeforehide: function(ev) {
			if (subscription) {
				subscription.dispose();
				subscription = null;
			}
		},
		
		pagebeforeshow: function(ev) {
			const page = ev.target;
			const ui = createUiManager(page);
			
			const displayData = function(mapFilePath, weather) {
				const tempInCelsius = extractTempertatureFromCurrentConditions(weather);			
				const tempText = createTemperatureTextAccordingToSettings(tempInCelsius);
				
				ui.map.set(mapFilePath)
				ui.header.setTemperature(tempText);
				ui.map.setVisibility(true);
				ui.header.setVisibility(true);
			};
			
			const displayCachedData = function(mapFile) {
				const weather = JSON.parse(storage.json.get());
				console.log('displayCachedData: mapFile=' + mapFile.toURI() + ', weather=' + weather);
				
				if (weather) {
					displayData(mapFile.toURI(), weather);
				} else {
					console.warn('No weather data despite we have map file');
				}
			};
			
			//Attempts to get current location, fetch data for location and then display it
			const tryGetNewData = function() {
				console.log('getting current position...');
				
				if (!subscription) {
					subscription = getCurrentPositionRx(consts.GEOLOCATION_TIMEOUT_IN_MS).map(function(pos) {
						return [pos.coords.latitude, pos.coords.longitude];
					}).subscribe(currentPositionAvailable, function(err) {
						console.warn('getCurrentPositionRx: ' + JSON.stringify(err));
					});
				} else {
					console.warn('Subscription for current location already exists');
				}
			};
			
			//Called when geolocation has current positon
			const currentPositionAvailable = function(coords) {
				const latitude = coords[0];
				const longitude = coords[1];
				
				const mapZoom = parseInt(storage.settings.units.mapzoom.get());
				const distance = parseInt(storage.settings.units.distance.get());
				const lod = map.getMapLod(mapZoom, distance);
				
				console.log('currentPositionAvailable: mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude + ', lod=' + lod);
				
				const mapImgUri = getMapImgUri(latitude, longitude, lod);
				console.log('mapImgUri: ' + mapImgUri);
				
				const currentConditionsUri = getCurrentConditionsUri(latitude, longitude);
				console.log('currentConditionsUri: ' + currentConditionsUri);
				
				const epoch = (new Date).getTime();
				const uniqueFileName = [['map', epoch, utils.guid()].join('_'), '.jpg'].join('');
				console.log('uniqueFileName: ' + uniqueFileName);
				
				const mapStoreObs = network.downloadFileRx(mapImgUri, uniqueFileName)
					.flatMap(storageFileAddRx);
				
				const weatherStoreObs = network.getResourcesByURL([currentConditionsUri]).map(function(data) {
					storage.json.add(JSON.stringify(data));
					return data;
				});
				
				rx.Observable.zip([mapStoreObs, weatherStoreObs]).subscribe(function(data) {
					const mapFilePath = data[0];
					const weather = data[1];
					
					console.log('Map and weather data downloaded successfully');
					displayData(mapFilePath, weather);
				}, function(err) {
					//It may happen download will fail, just warning
					console.warn('Download/store problem: ' + JSON.stringify(err));
				});
			};
			
			storageFileGetRx().subscribe(displayCachedData, function(err) {
				console.error('storageFileGetRx: ' + JSON.stringify(err));
			}, tryGetNewData);
		},
	};
});