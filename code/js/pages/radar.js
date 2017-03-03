define(['utils/utils'], function(utils) {
	
	//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
	const errorCodeToTextMapping = {
		1: 'PERMISSION_DENIED',
		2: 'POSITION_UNAVAILABLE',
		3: 'TIMEOUT',
	};
	
	//var attemptCounter = 1;
	
	const displayMapForLocation = function(ui, latitude, longitude) {
		ui.text.setVisibility(false);
		
		const width = 400;
		const height = 400;
		const product = 'satrad';
		const apiKey = 'ce21274b08780261ce553b0b9166a9ae';
		
		const lod = 5;
		const lat = utils.getAllowedPrecisionAccordingToLOD(latitude, lod);
		const lon = utils.getAllowedPrecisionAccordingToLOD(longitude, lod);
		
		//ui.map.set('https://api.weather.com/v2/maps/dynamic?geocode=51.105,17.020&h=400&w=400&lod=14&product=satrad&apiKey=ce21274b08780261ce553b0b9166a9ae')
		//const link = 'https://api.weather.com/v2/maps/dynamic?geocode='+lat+','+lon+'&w='+width+'&h='+height+'&lod='+lod+'&product='+product+'&apiKey=' + apiKey;
		
		const link = 'https://api.weather.com/v2/maps/dynamic?geocode=51.5,17.0&w=400&h=400&lod=5&product=satrad&apiKey=ce21274b08780261ce553b0b9166a9ae';
		console.log(link);
		
		ui.map.set(link);
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
						textWrapperElement.style['visibility'] = flag ? 'visible' : 'hidden';
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
				
				var desc = '';
				
				desc += 'lat=' + pos.coords.latitude + ', ';
				desc += 'lon=' + pos.coords.longitude + ', ';
				desc += 'alt=' + pos.coords.altitude + ', ';
				desc += 'acc=' + pos.coords.accuracy + ', ';
				desc += 'altacc=' + pos.coords.altitudeAccuracy + ', ';
				desc += 'head=' + pos.coords.heading + ', ';
				desc += 'speed=' + pos.coords.speed + '';
				
				//utils.modifyInnerHtml(page, '#text', 'success<br>' + desc);
				displayMapForLocation(ui, pos.coords.latitude, pos.coords.longitude);
			};
			
			const error = function(err) {
				var desc = 'unknown';
				
				if (errorCodeToTextMapping.hasOwnProperty(err.code)) {
					desc = errorCodeToTextMapping[err.code]; 
				}
				
				//ui.text.set('error: code=' + err.code + '<br>(' + desc + ')<br>[' + attemptCounter + ']');
				ui.text.set('error: code=' + err.code);
				ui.text.setVisibility(true);
				//attemptCounter++;
			};
			
			
			ui.text.set('checking location...');
			ui.text.setVisibility(true);
			//navigator.geolocation.getCurrentPosition(success, error, { timeout: 30000 });
			
			displayMapForLocation(ui, 51.1030809, 17.0208901);
		},
	};
});