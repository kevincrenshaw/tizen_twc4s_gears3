(function() {
	var app;
	var appId;

	var refreshViewId;
	var ui = {};
	var viewData = {};

	function getUI() {
		return {
			body: document.getElementsByTagName('body')[0],//
			header: document.getElementsByClassName('header')[0],
			currentTime: document.getElementsByClassName('current-time')[0],//
			currentFormat: document.getElementsByClassName('current-format')[0],//
			tempValue: document.getElementsByClassName('temp-value')[0],
			tempUnit: document.getElementsByClassName('temp-unit')[0],
			separator: document.getElementsByClassName('separator')[0],//
			tempTime: document.getElementsByClassName('temp-time')[0],//
			tempFormat: document.getElementsByClassName('temp-format')[0],//
			openBtn: document.getElementsByClassName('open')[0],//
			footer: document.getElementsByClassName('footer')[0],
			badge: document.getElementsByClassName('badge')[0]
		};
	}

	function getTempSystem() {
		// 1 - system, 2 - fahrenheit, 3 - celsius
		var value = parseInt(getFromStore('settings_units_temperature_key'), 10) || 3;

		if(value === 2) {
			return 'F';
		}
		return 'C';
	}

	function updateViewData(data, currentTimeOnly) {
		var prefs = tizen.preference;

		viewData.is12hFormat = prefs.exists('time_ampm') ? prefs.getValue('time_ampm') : false;
		
		viewData.currentTime = getTimeAsText(new Date(), viewData.is12hFormat);

		if(prefs.exists('snapshot_time')) {
			viewData.snapshotTime = getTimeAsText(new Date( prefs.getValue('snapshot_time') ), viewData.is12hFormat);
		}

		viewData.tempOrig = getFromStore('temp');
		viewData.tempUnit = getTempSystem();
		viewData.temp = viewData.tempUnit === 'F' ? celsiusToFahrenheit(viewData.tempOrig) : viewData.tempOrig ;

		viewData.map = getFromStore('map');

		var alertsCounter = 0;
		if(data && data.alerts && data.alerts.alerts) {
			alertsCounter = data.alerts.alerts.length;
		}
		console.log('view data ' + alertsCounter);
		viewData.alertsCounter = alertsCounter;
	}

	function updateUI(data, currentTimeOnly) {
		ui.currentTime.textContent = data.currentTime[0];
		ui.currentFormat.textContent = data.currentTime[1];

		ui.tempValue.textContent = data.temp + '° ';
		ui.tempUnit.textContent = data.tempUnit;

		ui.tempTime.textContent = data.snapshotTime[0];
		ui.tempFormat.textContent = data.snapshotTime[1];

		ui.separator.textContent = TIZEN_L10N.AT;

		ui.body.style['background-image'] = (data.map ? 'url(' + data.map + ')' : 'none');

		var alertsCounter = data.alertsCounter;
		if(alertsCounter > 99) {
			alertsCounter = '99+';
		}
		console.log('ui update ' + alertsCounter);
		ui.badge.textContent = alertsCounter;
		ui.footer.display = !!alertsCounter ? 'block' : 'none';
	}

	function refreshView() {
		updateViewData(null, true);
		updateUI(viewData, true);
		refreshViewId = setTimeout(refreshView, 1000);
	}

	function loadData() {
		var data = getFromStore('data');

		if(!data) {
			console.error('no data');
			return;
		}

		try {
			data = JSON.parse(data);
		} catch (err) {
			console.error('Failed to convert alerts into object: ' + JSON.stringify(err));
			return;
		}

		updateViewData(data, false);
		updateUI(viewData, false);

		if(refreshViewId) {
			clearTimeout(refreshViewId);
			refreshViewId = setTimeout(refreshView, 1000);
		} else {
			refreshView();
		}
	}

	function init() {
		ui = getUI();

		ui.openBtn.addEventListener('click', onRadarClick);
		ui.footer.addEventListener('click', onAlertsClick);

		console.log('init ' + appId);

		loadData();
	}

	function onVisibilityChange() {
		document.visibilityState === 'visible' ? init() : destroy();
	}

	function destroy() {
		if(refreshViewId) {
			clearTimeout(refreshViewId);
			refreshViewId = null;
		}

		ui.openBtn.removeEventListener('click', onRadarClick);
		ui.footer.removeEventListener('click', onAlertsClick);

		ui = null;

		console.log('destroy ' + appId);
	}


	function launchApp(page) {
		var appControl = new window.tizen.ApplicationControl('navigate', page, null, null, null, null);
		
		window.tizen.application.launchAppControl(
			appControl,
			appId,
			function() {
				console.log('application has been launched successfully');
			},
			function(e) {
				console.error('application launch has been failed. reason: ' + e.message);
			},
			null
		);
	}

	function onRadarClick() {
		launchApp('radar');
	}

	function onAlertsClick() {
		launchApp('alerts');
	}

	function onLoad() {
		window.removeEventListener('load', onLoad);
		app = window.tizen.application.getCurrentApplication();
		appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );

		onVisibilityChange();
		document.addEventListener('visibilitychange', onVisibilityChange);
	}
	window.addEventListener('load', onLoad);
})();