(function() {
	var app;
	var appId;

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

	function updateViewData(currentTimeOnly) {
		var prefs = tizen.preference;

		viewData.is12hFormat = prefs.exists('time_ampm') ? prefs.getValue('time_ampm') : false;

		viewData.currentTime = getTimeAsText(new Date(), viewData.is12hFormat);

		if(currentTimeOnly) { return; }

		if(prefs.exists('snapshot_time')) {
			viewData.snapshotTime = getTimeAsText(new Date( prefs.getValue('snapshot_time') ), viewData.is12hFormat);
		}

		viewData.tempOrig = getFromStore('temp');
		viewData.tempUnit = getTempSystem();
		viewData.temp = viewData.tempUnit === 'F' ? celsiusToFahrenheit(viewData.tempOrig) : viewData.tempOrig ;

		viewData.map = getFromStore('map');

		var alertsData = getFromStore('data');
		var alertsCounter = 0;
		if(alertsData) {
			try {
				alertsData = JSON.parse(alertsData);
			} catch (err) {
				console.error('Failed to convert alerts into object: ' + JSON.stringify(err));
			}
			if(alertsData && alertsData.alerts && alertsData.alerts.alerts) {
				alertsCounter = alertsData.alerts.alerts.length;
			}
		} else {
			console.warn('no alerts data');
		}
		viewData.alertsCounter = alertsCounter;
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

		console.log('init ' + appId);

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