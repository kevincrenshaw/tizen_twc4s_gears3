/* jshint esversion: 6 */

define(['utils/storage', 'utils/map', 'utils/network', 'utils/utils'], function(storage, map, network, utils) {
	const createUri = function(base, params) {
		params = params || {};
		const paramsArr = [];
		
		Object.keys(params).forEach(function(key) {
			paramsArr.push([key, params[key]].join('='));
		});
		
		return base + (paramsArr.length > 0 ? '?' + paramsArr.join('&') : '');
	};
	
	const displayMapForLocation = function(ui, latitude, longitude) {						
		const mapZoom = parseInt(storage.settings.units.mapzoom.get());
		const distance = parseInt(storage.settings.units.distance.get());
		const lod = map.getMapLod(mapZoom, distance);
		const lodLatitude = map.getAllowedPrecisionAccordingToLod(latitude, lod);
		const lodLongitude = map.getAllowedPrecisionAccordingToLod(longitude, lod);

		console.log('mapZoom=' + mapZoom + ', distance=' + distance + ', latitude=' + latitude + ', longitude=' + longitude);
		console.log('lod=' + lod + ', lodLatitude=' + lodLatitude + ', lodLatitude=' + lodLatitude);
			
		const params = {
			geocode: [lodLatitude, lodLongitude].join(','),
			w: 400,
			h: 400,
			lod: lod,
			product: 'satrad',
			apiKey: 'ce21274b08780261ce553b0b9166a9ae',
		};

		const link = createUri('https://api.weather.com/v2/maps/dynamic', params);
		console.log(link);

		//generate new file name
		const fileName = new Date().getTime() + '-' + utils.guid() + '.tmp';
		
		network.downloadImageFile(link, fileName,
			function(downloadedFileName) {
				const handler = {
					onSuccess : function(fileURI) {
						ui.text.setVisibility(false);
						ui.map.set(fileURI);
					},
					onError : function(error) {
						console.error('cant apply file, error: ' + error.message);
					}
				};

				storage.file.add(downloadedFileName, handler);
			},
			function(error) {
				console.error('cant download file, error: ' + error);
			}
		);
	};
	
	const createUiManager = function(root) {
		const textSelector = '#text';
		const textWrapperSelector = '#textWrapper';
		const mapSelector = '#map';
		
		const textElement = root.querySelector(textSelector);
		const textWrapperElement = root.querySelector(textWrapperSelector);
		const mapElement = root.querySelector(mapSelector);
		
		return {
			text: {
				set: function(text) {
					if (textElement) {
						textElement.innerHTML = text;
					} else {
						console.warn('element with selector ' + textSelector + ' not found');
					}
				},

				setVisibility: function(flag) {
					if (textWrapperElement) {
						textWrapperElement.style.visibility = flag ? 'visible' : 'hidden';
					} else {
						console.warn('element with selector ' + textWrapperSelector + ' not found');
					}
				},
			},

			map: {
				set: function(uri) {
					if (mapElement) {
						mapElement.src = uri;
					} else {
						console.warn('element with selector ' + mapSelector + ' not found');
					}
				}
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
			storage.file.get(function(file) {
				if(file) {
					console.log('last session: ' + file.toURI());
					ui.map.set(file.toURI());
				} else {
					ui.text.set('checking location...');
					ui.text.setVisibility(true);
				}
				navigator.geolocation.getCurrentPosition(success, error, { timeout: 30000 });
			});
		},
	};
});