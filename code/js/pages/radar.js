/* jshint esversion: 6 */

define(['utils/storage', 'utils/map', 'utils/network', 'utils/const', 'utils/utils', 'rx'], function(storage, map, network, consts, utils, Rx) {
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
		
		console.log('lod={value=' + lod + ', lat=' + latByLod + ', long=' + longByLod + '}');
		
		const params = {
			geocode: [latByLod, longByLod].join(','),
			w: options.width || 400,
			h: options.height || 400,
			lod: lod,
			product: options.product || 'satrad',
			apiKey: consts.apiKey,
		};

		return createUri('https://api.weather.com/v2/maps/dynamic', params);
	};

/*
const link = createUri('https://api.weather.com/v2/maps/dynamic', params);
		console.log(link);

		//generate new file name
		const fileName = new Date().getTime() + '-' + utils.guid() + '.tmp';
		
		network.downloadImageFile(link, fileName,
			function(downloadedFileName) {
				const options = {
					onSuccess : function(fileURI) {
						ui.text.setVisibility(false);
						ui.map.set(fileURI);
					},
					onError : function(error) {
						console.error('cant apply file, error: ' + error.message);
					}
				};

				storage.file.add(downloadedFileName, options);
			},
			function(error) {
				console.error('cant download file, error: ' + error);
			}
		});
*/	

	const getCurrentConditionsJsonUri = function(latitude, longitude) {
		const options = {
			language: 'en-US',
			units: 'm', //'e' for imperial
			apiKey: consts.apiKey,
		};
		
		return createUri('https://api.weather.com/v1/geocode/' + latitude + '/' + longitude + '/observations/current.json', options);
	};
	
	const createTemperatureTextAccordingToSettings = function(tempValueInCelsius) {
		const temperatureSetting = parseInt(storage.settings.units.temperature.get());
		const separator = '';
		
		if (temperatureSetting == consts.settings.units.temperature.SYSTEM) {
			console.warn('temperature system setting not supported yet, falling back to Celsius')
			temperatureSetting = consts.settings.units.temperature.CELSIUS;
		}
		
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
	
	const displayMapForLocation = function(ui, latitude, longitude) {						
		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());
		const lod = map.getMapLod(mapZoom, distance);
		
		ui.text.setVisibility(false);
		console.log('mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude + ', lod=' + lod);
		
		const mapImgUri = getMapImgUri(latitude, longitude, lod);
		const currentConditionsJsonUri = getCurrentConditionsJsonUri(latitude, longitude);
		
		console.log('mapImgUri = ' + mapImgUri);
		console.log('currentConditionsJsonUri = ' + currentConditionsJsonUri);
		
		const mapImageObservable =
			ui.map.set(mapImgUri);
		
		const currentConditionsJsonObservable = 
			network.getResourcesByURL([currentConditionsJsonUri]);
		
		Rx.Observable.zip([mapImageObservable, currentConditionsJsonObservable]).subscribe(function(result) {
			const currentConditionsJson = result[1];
			const tempInCelsius = currentConditionsJson.observation.metric.temp;			
			const tempText = createTemperatureTextAccordingToSettings(tempInCelsius);
			
			ui.header.setTemperature(tempText);
			ui.map.setVisibility(true);
			ui.header.setVisibility(true);
		}, function(err) {
			console.log('error: ' + JSON.stringify(err));
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
			text: {
				set: function(text) {
					if (textElement) {
						textElement.innerHTML = text;
					} else {
						console.warn('element with selector ' + textSelector + ' not found');
					}
				},

				setVisibility: setVisibilityImpl(textWrapperElement, textWrapperSelector),
			},

			map: {
				setVisibility: setVisibilityImpl(mapElement, mapSelector),
				
				set: function(uri) {
					return Rx.Observable.create(function(observer) {
						if (mapElement) {
							mapElement.onload = function() {
								observer.onNext(uri);
								observer.onCompleted();
							};
							
							mapElement.onError = function(err) {
								observer.onError(err);
							};
							
							mapElement.src = uri;
						} else {
							//TODO change error type
							observer.onError('element missing');
						}
					});
				}
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
		pagebeforeshow: function(ev) {
			const page = ev.target;
			const ui = createUiManager(page);
			
			const success = function(pos) {
				displayMapForLocation(ui, pos.coords.latitude, pos.coords.longitude);
			};
			
			const error = function(err) {
				//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
				//1: 'PERMISSION_DENIED',
				//2: 'POSITION_UNAVAILABLE',
				//3: 'TIMEOUT',
				
				ui.text.set('error: code=' + err.code);
				console.error('error: ' + err.message);
				ui.text.setVisibility(true);
			};
			
			//get last saved session
			storage.file.get(
				function(file) {
					console.log('last session: ' + file.toURI());
					ui.map.set(file.toURI());
					navigator.geolocation.getCurrentPosition(success, error, { timeout: 30000 });
				},
				function(err) {
					ui.text.set('checking location...');
					ui.text.setVisibility(true);
					navigator.geolocation.getCurrentPosition(success, error, { timeout: 30000 });
				});
		},
	};
});