window.onload = function() {
	var intervalUpdaterId = null;

	var currentTimeRepr = {};
	var snapshotTimeRepr = {};
	var mapFilePath;
	var data;
	var ampm = null;
	var ui = null;
	
	//run for first time when widget is added to a widget board
	handleVisibilityChange();
	
	function launchRadar() {
		launchApp('radar');
	}
	
	function launchAlerts() {
		launchApp('alerts');
	}
	
	/**
	 * triggered on page visible state 
	 * */
	function onpageshow() {
		var dataAsText;
		
		console.log('on page show');
		ui = createUi(document);
		
		ui.map.addEventListener('click', launchRadar);
		ui.footer.alert.container.addEventListener('click', launchAlerts);
		
		ampm = getFromStore('ampm');

		mapFilePath = getFromStore('map');
		
		dataAsText = getFromStore('data');
		if (dataAsText) {
			try {
				data = JSON.parse(dataAsText);
			} catch (err) {
				console.error('Failed to convert alerts into object: ' + JSON.stringify(err));
			}
		}

		//obtain temperature
		var temperatureRepr = getTemperature(data);
		if(temperatureRepr) {
			ui.temperature.value.textContent = temperatureRepr[0];
			ui.temperature.unit.textContent = temperatureRepr[1];
		}
	}
	
	/**
	 * triggered on page hidden state 
	 * */
	function onpagehide() {
		console.log('on page hide');
		if(ui) {
			ui.map.removeEventListener('click', launchRadar);
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
		var currentTempInCelsius;
		
		//update UI only if there is all data available
		if (ui && snapshotTimeRepr[0] && currentTimeRepr[0] && mapFilePath) {
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
				
				currentTempInCelsius = getFromStore('temp', undefined);
				if (currentTempInCelsius !== undefined) {
					currentTempInCelsius = parseInt(currentTempInCelsius);
					ui.temperature.value.textContent = [(displayInCelsius
							? currentTempInCelsius
							: Math.round(celsiusToFahrenheit(currentTempInCelsius))), '°'].join('');
					ui.temperature.unit.textContent = displayInCelsius ? 'C' : 'F';
				}
				
				ui.temperature.at.textContent = TIZEN_L10N.AT;
			}

			ui.map.style['background-image'] = 'url("' + mapFilePath + '")';
			ui.footer.alert.value(getNbrOfAlerts());
		}
	}

	/**
	 * function for periodic tasks (like updating ui, etc)
	 * */
	function onUpdate() {
		//because of limitations of web widget we cannot obtain system settings of am/pm
		//so we are ignoring it and in case of empty ampm (system setting) use 24h format
		var time = getTimeAsText(new Date(), ampm);
		if(currentTimeRepr[0] !== time[0] || currentTimeRepr[1] !== time[1]) {
			currentTimeRepr = time;
		}
		if(data) {
			//snapshot time
			var timestampMillis = data.weather.observation.obs_time * 1000;
			snapshotTimeRepr = getTimeAsText(new Date(timestampMillis), ampm);
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
	
	function getNbrOfAlerts() {
		if (data &&
				data.alerts &&
				data.alerts.alerts &&
				Array.isArray(data.alerts.alerts)) {
			return data.alerts.alerts.length;
		} else {
			return 0;
		}
	}

	document.addEventListener('visibilitychange', handleVisibilityChange);
};