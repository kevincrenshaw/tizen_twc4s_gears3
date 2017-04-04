window.onload = function() {
	var intervalUpdaterId = null;

	var currentTimeRepr = {};
	var snapshotTimeRepr = {};
	var weatherData;
	
	var ampm = '';
	
	var ui = null;
	
	//run for first time when widget is added to a widget board
	handleVisibilityChange();
	
	/**
	 * triggered on page visible state 
	 * */
	function onpageshow() {
		console.log('on page show');
		ui = createUi(document);
		
		ui.map.addEventListener('click', launchApp);
		ui.footer.alert.container.addEventListener('click', launchAlerts);
		
		if(tizen.preference.exists('time_ampm')) {
			ampm = tizen.preference.getValue('time_ampm');
		}
		
		if(tizen.preference.exists('snapshot_time')) {
			snapshotTimeRepr[0] = tizen.preference.getValue('snapshot_time');
			snapshotTimeRepr[1] = ampm;
		}
		
		if (tizen.preference.exists('weather_data')) {
			weatherData = tizen.preference.getValue('weather_data');
			console.log('weatherData = ' + weatherData);
			weatherData = JSON.parse(weatherData);
		}

		ui.footer.alert.value(0);
	}
	
	/**
	 * triggered on page hidden state 
	 * */
	function onpagehide() {
		console.log('on page hide');
		if(ui) {
			ui.map.removeEventListener('click', launchApp);
			ui.footer.alert.container.removeEventListener('click', launchAlerts);
			ui.map = null;
			ui = null;
		}
	}
	
	function isCelsiusSelected() {
		if (parseInt(getFromStore('settings_units_temperature_key', '3')) === 2) {
			return false;
		} else {
			return true;
		}
	}

	function onUpdateUi() {
		var displayInCelsius = isCelsiusSelected();
		if(ui) {
			//if we have data to show
			if(snapshotTimeRepr[0] && currentTimeRepr[0]) {
				if(ui.header.style.display !== 'inline') {
					//show header if it was hidden
					ui.header.style.display = 'inline';
				}
				//if header is visible and we have data to show
				if(ui.header.style.display === 'inline') {
					ui.currentTime.time.textContent = currentTimeRepr[0];
					ui.currentTime.ampm.textContent = currentTimeRepr[1];
					
					ui.temperature.snapshotTime.textContent = snapshotTimeRepr[0];
					ui.temperature.ampm.textContent = snapshotTimeRepr[1];
					
					ui.temperature.value.textContent = [(displayInCelsius
						? weatherData.temperature.valueInCelsius
						: Math.round(celsiusToFahrenheit(weatherData.temperature.valueInCelsius))), '°'].join('');
					ui.temperature.unit.textContent = displayInCelsius ? 'C' : 'F';
					ui.temperature.at.textContent = TIZEN_L10N.AT;
				}
			}
			
			if (tizen.preference.exists('current_map_image_path')) {
				currentMapImagePath = tizen.preference.getValue('current_map_image_path');
				ui.map.style['background-image'] = 'url("' + currentMapImagePath + '")';
			}
		}
	}
	
	
	/**
	 * function for periodic tasks (like updating ui, etc)
	 * */
	function onUpdate() {
		//because of limitations of web widget we cannot obtain system settings of am/pm
		//so we are ignoring it and in case of empty ampm (system setting) use 24h format
		var time = getTimeAsText(new Date(), ampm !== '');
		if(currentTimeRepr[0] !== time[0] || currentTimeRepr[1] !== time[1]) {
			currentTimeRepr = time;
		}
		onUpdateUi();
	}

	/**
	 * internal function to handle visibility state changes 
	 * */
	function handleVisibilityChange() {
		if(document.visibilityState === 'visible') {
			onpageshow();
			//call it immideatelly for a first time
			onUpdate();
			
			if(intervalUpdaterId === null) {
				intervalUpdaterId = setInterval(onUpdate, 1000);
			}
		} else {
			onpagehide();
			
			if(intervalUpdaterId) {
				clearInterval(intervalUpdaterId);
                intervalUpdaterId = null;
			}
		}
	}

	function launchApp() {
		var app = window.tizen.application.getCurrentApplication();
		var appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );
		var appControl = new window.tizen.ApplicationControl('navigate', 'radar', null, null, null, null);
		window.tizen.application.launchAppControl(appControl, appId,
			function() {
				console.log("application has been launched successfully");
			},
			function(e) {
				console.error("application launch has been failed. reason: " + e.message);
			},
			null);
	}

	function launchAlerts() {
		console.log('launch alerts');
	}
	
	function createUi(root) {
		var footer = root.getElementById('footer');
		var footer_alerts_value = root.getElementById('footer-alerts-counter-container-value');

		var element = {
			header: root.getElementById('header'),
			map: root.getElementById('main-screen'),
			
			currentTime: {
				time: root.getElementById('time-value'),
				ampm: root.getElementById('time-ampm'),
			},
			
			temperature: {
				value: root.getElementById('value'),
				unit: root.getElementById('unit'),
				at: root.getElementById('at'),
				snapshotTime: root.getElementById('snapshot-time'),
				ampm: root.getElementById('ampm'),
			},

			footer: {
				alert: {
					container: footer,
					value: function(value) {
						value = Math.max(0, parseInt(value));

						if (value > 0) {
							value = value > 99 ? '99+' : value;
							footer_alerts_value.textContent = value;
							footer.style.visibility = 'visible';
						} else {
							footer.style.visibility = 'hidden';
						}
 					}
				}
			}
		};
		
		return element;
	}
	
	document.addEventListener('visibilitychange', handleVisibilityChange);
};