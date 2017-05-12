/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/updater',
	'../component/bezel/index',
	'../component/mapAnimation/index'
], function($, storage, consts, utils, updater, bezel, mapAnimation) {
	var refreshViewId;
	var ui = {};
	var viewData = {};

	function getUI() {
		return {
			header: $('.radar__header'),
			date: $('.radar__date'),
			temp: $('.radar__temp'),
			updateBtn: $('.radar__update'),
			moreBtn: $('.radar__more'),
			alertsBtn: $('.radar__alerts'),
			alertsCounter: $('.radar__badge')
		}
	}

	function updateViewData(data, currentTimeOnly) {
		const timeUnit = storage.settings.units.time.get();
		viewData.is12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		viewData.currentTime = utils.getTimeAsText(new Date(), timeUnit, viewData.is12hFormat);

		viewData.lastUpdate = storage.lastUpdate.get();
		viewData.lastUpdateHuman = utils.humanReadableTimeDiff(utils.getNowAsEpochInSeconds(), viewData.lastUpdate);

		if(currentTimeOnly) { return; }

		mapAnimation.setSnapshoots([
			storage.map.get(),
			'../resources/tmpSnapshoots/map+1.5.jpg',
			'../resources/tmpSnapshoots/map+3.jpg',
			'../resources/tmpSnapshoots/map+4.5.jpg',
			storage.pastMap[3].get(),
			storage.pastMap[2].get(),
			storage.pastMap[1].get(),
			storage.pastMap[0].get(),
		]);

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

	const setBezelVisibilityAccordingToMap = function() {
		if (storage.map.get()) {
			bezel.show();
		} else {
			bezel.hide();
		}	
	};

	return {
		pagebeforeshow: function(ev) {
			ui = getUI();

			mapAnimation.create({
				root: '.radar__map',
				autoplay: true
			});

			storage.data.setChangeListener(loadData);
			loadData();
			updater.softUpdate();

			ui.updateBtn.prop('disabled', updater.updateInProgress());
			updater.setOnUpdateCompleteHandler(function() {
				ui.updateBtn.prop('disabled', false);
				setBezelVisibilityAccordingToMap();
			});
			
			ui.header.on('click', function() {
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

			bezel.create({
				root: '.bezel-placeholder',
				value: 'now',
				values: ['now', '+1.5h', '+3h', '+4.5h', '-6h', '-4.5h', '-3h', '-1.5h'],
				onChange: function(value, valueIndex, direction) {
					console.log('onChange', value, valueIndex, direction);
				}
			});

			setBezelVisibilityAccordingToMap();
		},
		
		visibilitychange: function() {
			if(!document.hidden) {
				updater.softUpdate();
				ui.updateBtn.prop('disabled', updater.updateInProgress());
				mapAnimation.restart();
			}
		},

		pagebeforehide: function(ev) {
			bezel.destroy();
			mapAnimation.destroy();

			if(refreshViewId) {
				clearTimeout(refreshViewId);
				refreshViewId = null;
			}

			storage.data.unsetChangeListener();
			updater.removeOnUpdateCompleteHandler();

			ui.header.off();
			ui.moreBtn.off();
			ui.alertsBtn.off();
			ui = null;
		},
	};
});