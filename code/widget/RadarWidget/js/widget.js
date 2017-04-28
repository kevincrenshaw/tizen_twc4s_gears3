(function() {
	var refreshViewId;
	var ui = {};
	var viewData = {};

	function getUI() {
		return {
			body: document.getElementsByTagName('body')[0],
			header: document.getElementsByClassName('header')[0],
			currentTime: document.getElementsByClassName('current-time')[0],
			currentFormat: document.getElementsByClassName('current-format')[0],
			tempValue: document.getElementsByClassName('temp-value')[0],
			tempUnit: document.getElementsByClassName('temp-unit')[0],
			separator: document.getElementsByClassName('separator')[0],
			tempTime: document.getElementsByClassName('temp-time')[0],
			tempFormat: document.getElementsByClassName('temp-format')[0],
			openBtn: document.getElementsByClassName('open')[0],
			footer: document.getElementsByClassName('footer')[0],
			badge: document.getElementsByClassName('badge')[0]
		};
	}

	function getTempSystem() {
		// 1 - system, 2 - fahrenheit, 3 - celsius
		var value = parseInt(getFromStore('settings_units_temperature_key'), 10) || 3;
		return (value === 2 ? 'F' : 'C');
	}

	function readData(data) {
		if(!data) {
			return false;
		}

		try {
			return JSON.parse(data);
		} catch(err) {
			console.error('Failed to parse data ' + JSON.stringify(err));
			return false;
		}
	}

	function updateViewData(currentTimeOnly) {
		viewData.is12hFormat = getFromStore('ampm');
		viewData.currentTime = getTimeAsText(new Date(), viewData.is12hFormat);

		if(currentTimeOnly) { return; }

		viewData.map = getFromStore('map');
		viewData.snapshotTime = ['', ''];
		var tmpTemp;
		viewData.temp = '-';
		viewData.tempUnit = getTempSystem();
		viewData.alertsCounter = 0;

		var data = readData(getFromStore('data'));
		
		if(!data) { return; }
		
		if(data.weather && data.weather.observation) {
			if(data.weather.observation.metric) {
				tmpTemp = data.weather.observation.metric.temp || '-';
				viewData.temp = !isNaN(tmpTemp) && viewData.tempUnit === 'F' ? celsiusToFahrenheit(tmpTemp) : tmpTemp;
			}

			if(data.weather.observation.obs_time) {
				viewData.snapshotTime = getTimeAsText(new Date(data.weather.observation.obs_time * 1000), viewData.is12hFormat);
			}
		}

		if(data.alerts && data.alerts.alerts) {
			viewData.alertsCounter = data.alerts.alerts.length;
		}
	}

	function isViewDataValid() {
		return viewData &&
			   viewData.currentTime[0] &&
			   viewData.snapshotTime[0] &&
			   viewData.map;
	}

	function updateUI(currentTimeOnly) {
		if(!isViewDataValid()) { return; }

		ui.header.style.display = 'block';

		ui.currentTime.textContent = viewData.currentTime[0];
		ui.currentFormat.textContent = viewData.currentTime[1];

		if(currentTimeOnly) { return; }

		ui.tempValue.textContent = viewData.temp + '°';
		ui.tempUnit.textContent = viewData.tempUnit;
		ui.separator.textContent = TIZEN_L10N.AT;
		ui.tempTime.textContent = viewData.snapshotTime[0];
		ui.tempFormat.textContent = viewData.snapshotTime[1];

		ui.body.style['background-image'] = (viewData.map ? 'url(' + viewData.map + ')' : 'none');

		var alertsCounter = viewData.alertsCounter;
		if(alertsCounter > 9) {
			alertsCounter = '9+';
		}
		ui.badge.textContent = alertsCounter;
		ui.footer.style.display = !!alertsCounter ? 'block' : 'none';
	}

	function refreshView() {
		updateViewData(true);
		updateUI(true);
		refreshViewId = setTimeout(refreshView, 1000);
	}

	function init() {
		ui = getUI();
		ui.openBtn.addEventListener('click', onRadarClick);
		ui.footer.addEventListener('click', onAlertsClick);

		updateViewData(false);
		updateUI(false);
		refreshView();
	}

	function onVisibilityChange() {
		document.hidden ? destroy() : init();
	}

	function destroy() {
		if(refreshViewId) {
			clearTimeout(refreshViewId);
			refreshViewId = null;
		}

		ui.openBtn.removeEventListener('click', onRadarClick);
		ui.footer.removeEventListener('click', onAlertsClick);
		ui = null;
	}

	function onRadarClick() {
		launchApp('radar');
	}

	function onAlertsClick() {
		launchApp('alerts');
	}

	function onLoad() {
		window.removeEventListener('load', onLoad);

		onVisibilityChange();
		document.addEventListener('visibilitychange', onVisibilityChange);
	}
	window.addEventListener('load', onLoad);
})();