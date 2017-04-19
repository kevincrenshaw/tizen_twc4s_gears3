/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/dom',
	'utils/updater'
], function($, storage, consts, utils, dom, updater) {

	var lastRefreshEpochTime;


	var uiElems = {};
	var viewData = {};

	/*
	 * Converts temperature into textual representation.
	 * Parameters:
	 *		celsiusTemp - current temperature in Celsius
	 *		unit - current temperature unit setting, for instance value returned by:
	 *			storage.settings.units.temperature.get()
	 *
	 * Result:
	 * 		Return array of two elements. First one is temperature converted to Celsius/Fahrenheit units. Second is
	 * 		textual representation of temperature unit.
	 */
	const getTemperatureAndUnitAsText = function(celsiusTemp, unit) {
		switch (parseInt(unit, 10)) {
			case consts.settings.units.temperature.SYSTEM:
				console.warn('temperature system setting not supported yet, falling back to Celsius');
				/* falls through */
			case consts.settings.units.temperature.CELSIUS:
				return [celsiusTemp, 'C'];
				
			case consts.settings.units.temperature.FAHRENHEIT:
				return [Math.round(utils.celsiusToFahrenheit(celsiusTemp)), 'F'];
				
			default:
				console.warn('unexpected temperature setting value "' + unit + '"');
		}
	};

	function getUiElems() {
		return {
			header: $('.radar__header'),
			date: $('.radar__date'),
			temp: $('.radar__temp'),
			updateBtn: $('.radar__update'),
			map: $('.radar__map'),
			moreBtn: $('.radar__more'),
			alertsBtn: $('.radar__alerts'),
			alertsCounter: $('.radar__badge')
		}
	}



	
	const diffCategoryToLocalizationKey = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};

	const displayData = function(mapFilePath, weather, alerts, downloadTimeEpochInSeconds) {


		const weatherDownloadTimeUpdater = function() {
			const diffInSeconds = utils.getNowAsEpochInSeconds() - lastRefreshEpochTime;
			const diffCategory = utils.getCategoryForTimeDiff(diffInSeconds);

			if (diffCategory in diffCategoryToLocalizationKey) {
				const localizationKey = diffCategoryToLocalizationKey[diffCategory];
				if (localizationKey in TIZEN_L10N) {
					var textToDisplay = TIZEN_L10N[localizationKey];

					if(diffCategory !== 1) {
						textToDisplay = utils.formatTimeDiffValue(diffInSeconds, diffCategory) + ' ' + textToDisplay;
					}

					ui.header.refresh.text(textToDisplay);
				} else {
					console.warn('Key "' + localizationKey + '" not available in localization');
				}
			} else {
				console.warn('Diff category "' + diffCategory + '" cannot be mapped to localization key');
			}
		};


		//refresh time
		lastRefreshEpochTime = downloadTimeEpochInSeconds;
		weatherDownloadTimeUpdater();
	};

	function updateViewData(data, currentTimeOnly) {
		const timeUnit = storage.settings.units.time.get();
		viewData.is12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		viewData.currentTime = utils.getTimeAsText(new Date(), timeUnit, viewData.is12hFormat);
		if(currentTimeOnly) { return; }

		viewData.map = storage.map.get();

		const observation = data.weather.observation;
		viewData.tempOrig = observation.metric.temp;
		const tempData = getTemperatureAndUnitAsText(viewData.tempOrig, storage.settings.units.temperature.get());
		viewData.temp = tempData[0];
		viewData.tempUnit = tempData[1];
		
		viewData.snapshotDate = new Date(observation.obs_time * 1000);
		viewData.snapshotTime = utils.getTimeAsText(viewData.snapshotDate, timeUnit, viewData.is12hFormat);

		viewData.alertsCounter = $.isArray(data.alerts) ? data.alerts.length : 0;

		console.log(viewData, storage.settings.units.time.get(), viewData.is12hFormat);
	}

	function saveToStorage(data) {
		storage.temp.set(data.tempOrig);
		tizen.preference.setValue('snapshot_time', data.snapshotDate.getTime());
		tizen.preference.setValue('time_ampm', data.is12hFormat);
	}

	function updateUI(data, currentTimeOnly) {
		uiElems.date.html(
			viewData.currentTime[0] +
			(viewData.currentTime[1] ? '<span>' + viewData.currentTime[1] + '</span>' : '')
		);
		if(currentTimeOnly) { return; }

		uiElems.temp.html(
			data.temp + 
			'°' +
			'<span>' + data.tempUnit + '</span>' +
			'<span class="radar__separator">' + TIZEN_L10N.RADAR_AT + '</span>' + 
			viewData.snapshotTime[0] +
			(viewData.snapshotTime[1] ? '<span>' + viewData.snapshotTime[1] + '</span>' : '')
		);
		uiElems.header.show();

		uiElems.updateBtn.prop('disabled', false);

		uiElems.map.show().attr('src', data.map);

		uiElems.moreBtn.show();

		const alertsCounter = parseInt(data.alertsCounter, 10) > consts.RADAR_ALERTS_MAX_NBR ? consts.RADAR_ALERTS_MAX_NBR + '+' : data.alertsCounter; 
		uiElems.alertsCounter.toggle(!!data.alertsCounter).text(alertsCounter);
	}

	function resetUI() {
		uiElems.map.hide();
		uiElems.header.hide();
		uiElems.alertsCounter.hide().text(0);
	}

	var reloadViewId;
	function reloadView() {
		updateViewData(null, true);
		updateUI(viewData, true);
		reloadViewId = setTimeout(reloadView, 1000);
	}

	const loadData = function() {
		const dataText = storage.data.get();
		console.log('try display data');

		if(!dataText) {
			console.log('No data in storage');
			resetUI();
			return;
		}

		var data;
		try {
			data = JSON.parse(dataText);
		} catch(err) {
			console.error(JSON.stringify(err));
			return;
		}
		updateViewData(data);
		saveToStorage(viewData);
		updateUI(viewData, false);

		if(!reloadViewId) {
			reloadView();
		}
	};

	return {
		pagebeforeshow: function(ev) {
			uiElems = getUiElems();

			storage.data.setChangeListener(loadData);

			loadData();

			updater.softUpdate();

			uiElems.updateBtn.prop('disabled', updater.updateInProgress());
			uiElems.updateBtn.on('click', function() {
				if(updater.hardUpdate()) {
					uiElems.updateBtn.prop('disabled', true);
				} else {
					console.warn('Force update button cannot be clickable when update in progress');
				}
			});

			uiElems.alertsBtn.on('click', function() {
				tau.changePage('alerts.html');
			});

			uiElems.moreBtn.on('click', function() {
				console.log('More options');
			});
		},
		
		visibilitychange: function() {
			if(document.hidden !== true) {
				updater.softUpdate();
			}
		},

		pagebeforehide: function(ev) {
			storage.data.unsetChangeListener(loadData);

			uiElems.updateBtn.off();
			uiElems.moreBtn.off();
			uiElems.alertsBtn.off();
			uiElems = null;

			if(rerenderId) {
				clearTimeout(rerenderId);
				rerenderId = null;
			}
		},
	};
});