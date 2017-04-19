/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/updater'
], function($, storage, consts, utils, updater) {
	var refreshViewId;
	var uiElems = {};
	var viewData = {};

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
	
	const timeTierEnum = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};

	function humanReadableTimeDiff(from, to) {
		const diff = from - to;
		const tier = utils.getCategoryForTimeDiff(diff);
		const tierKey = timeTierEnum[tier];

		if(!tierKey) {
			console.warn('Diff category "' + tier + '" cannot be mapped to localization key');
			return '';
		}

		const text = TIZEN_L10N[tierKey];
		if(!text) {
			console.warn('Key "' + tierKey + '" not available in localization');
			return '';
		}

		if(tier === 1) {
			return text;
		}
		return utils.formatTimeDiffValue(diff, tier) + ' ' + text;
	}

	function updateViewData(data, currentTimeOnly) {
		const timeUnit = storage.settings.units.time.get();
		viewData.is12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		viewData.currentTime = utils.getTimeAsText(new Date(), timeUnit, viewData.is12hFormat);

		viewData.lastUpdate = storage.lastUpdate.get();
		viewData.lastUpdateHuman = humanReadableTimeDiff(utils.getNowAsEpochInSeconds(), viewData.lastUpdate);

		if(currentTimeOnly) { return; }

		viewData.map = storage.map.get();

		const observation = data.weather.observation;
		viewData.tempOrig = observation.metric.temp;
		const tempData = utils.getTemperatureAndUnitAsText(viewData.tempOrig, storage.settings.units.temperature.get());
		viewData.temp = tempData[0];
		viewData.tempUnit = tempData[1];
		
		viewData.snapshotDate = new Date(observation.obs_time * 1000);
		viewData.snapshotTime = utils.getTimeAsText(viewData.snapshotDate, timeUnit, viewData.is12hFormat);

		viewData.alertsCounter = $.isArray(data.alerts) ? data.alerts.length : 0;
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
		uiElems.updateBtn.text(data.lastUpdateHuman);

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

	function refreshView() {
		updateViewData(null, true);
		updateUI(viewData, true);
		refreshViewId = setTimeout(refreshView, 1000);
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

		if(!refreshViewId) {
			refreshView();
		}
	};

	return {
		pagebeforeshow: function(ev) {
			uiElems = getUiElems();

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

			storage.data.setChangeListener(loadData);
			loadData();
			updater.softUpdate();
		},
		
		visibilitychange: function() {
			if(!document.hidden) {
				updater.softUpdate();
			}
		},

		pagebeforehide: function(ev) {
			if(refreshViewId) {
				clearTimeout(refreshViewId);
				refreshViewId = null;
			}

			storage.data.unsetChangeListener(loadData);

			uiElems.updateBtn.off();
			uiElems.moreBtn.off();
			uiElems.alertsBtn.off();
			uiElems = null;
		},
	};
});