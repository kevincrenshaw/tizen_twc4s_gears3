/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/updater'
], function($, storage, consts, utils, updater) {
	var refreshViewId;
	var ui = {};
	var viewData = {};

	function getUI() {
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

	function humanReadableTimeDiff(from, to) {
		const diff = from - to;
		const tier = utils.getCategoryForTimeDiff(diff);
		const tierKey = diffCategoryToLocalizationKey[tier];

		if(!tierKey) {
			console.warn('Diff category "' + tier + '" cannot be mapped to localization key');
			return '';
		}

		const text = TIZEN_L10N[tierKey];
		if(!text) {
			console.warn('Key "' + tierKey + '" not available in localization');
			return '';
		}

		// TODO: fix that dirty hack
		// initially, before data is retrieved from server, last update time is uknown
		// the storage returns 0 though, so all calculations are correct,
		// but a strange value would be returnd, i.e. '123456 days ago'
		if(to === 0) {
			return '- ' + text;
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

		viewData.alertsCounter = parseInt(($.isArray(data.alerts.alerts) ? data.alerts.alerts.length : 0), 10);
	}

	function updateUI(data, currentTimeOnly) {
		ui.date.html(
			viewData.currentTime[0] +
			(viewData.currentTime[1] ? '<span>' + viewData.currentTime[1].trim() + '</span>' : '')
		);
		ui.updateBtn.text(data.lastUpdateHuman);

		if(currentTimeOnly) { return; }

		ui.temp.html(
			data.temp + 
			'°' +
			'<span>' + data.tempUnit + '</span>' +
			'<span class="radar__separator">' + TIZEN_L10N.RADAR_AT + '</span>' + 
			viewData.snapshotTime[0] +
			(viewData.snapshotTime[1] ? '<span>' + viewData.snapshotTime[1].trim() + '</span>' : '')
		);
		
		ui.updateBtn.prop('disabled', false);

		ui.map.attr('src', data.map);

		const alertsCounter = 
			data.alertsCounter > consts.RADAR_ALERTS_MAX_NBR ?
			consts.RADAR_ALERTS_MAX_NBR + '+' :
			data.alertsCounter;
		ui.alertsBtn.toggle(!!alertsCounter);
		ui.alertsCounter.text(alertsCounter);
	}

	function resetUI() {
		ui.alertsBtn.hide();
		ui.alertsCounter.text(0);
	}

	function refreshView() {
		updateViewData(null, true);
		updateUI(viewData, true);
		refreshViewId = setTimeout(refreshView, 1000);
	}

	const loadData = function() {
		if(refreshViewId) {
			clearTimeout(refreshViewId);
		}

		const dataText = storage.data.get();
		console.log('try display data');

		if(!dataText) {
			console.log('No data in storage');
			resetUI();
			refreshView();
			return;
		}

		var data;
		try {
			data = JSON.parse(dataText);
		} catch(err) {
			console.error(JSON.stringify(err));
			refreshView();
			return;
		}
		updateViewData(data, false);
		updateUI(viewData, false);
		refreshView();
	};

	return {
		pagebeforeshow: function(ev) {
			ui = getUI();

			ui.updateBtn.prop('disabled', updater.updateInProgress());
			updater.setOnUpdateCompleteHandler(function() {
				ui.updateBtn.prop('disabled', false);
			});
			ui.updateBtn.on('click', function() {
				if(updater.hardUpdate()) {
					ui.updateBtn.prop('disabled', true);
				} else {
					console.warn('Force update button cannot be clickable when update in progress');
				}
			});

			ui.alertsBtn.on('click', function() {
				tau.changePage('alerts.html', { transition:'none' });
			});

			ui.moreBtn.on('click', function() {
				utils.openDeepLinkOnPhone(consts.RADAR_DEEPLINK);
			});

			storage.data.setChangeListener(loadData);
			loadData();
			updater.softUpdate();
		},
		
		visibilitychange: function() {
			if(!document.hidden) {
				updater.softUpdate();
				ui.updateBtn.prop('disabled', updater.updateInProgress());
			}
		},

		pagebeforehide: function(ev) {
			if(refreshViewId) {
				clearTimeout(refreshViewId);
				refreshViewId = null;
			}

			storage.data.unsetChangeListener(loadData);
			updater.removeOnUpdateCompleteHandler();

			ui.updateBtn.off();
			ui.moreBtn.off();
			ui.alertsBtn.off();
			ui = null;
		},
	};
});