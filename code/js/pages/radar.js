/* jshint esversion: 6 */

define([
	'jquery',
	'rx',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/updater',
	'../component/mapAnimation/index'
], function($, rx, storage, consts, utils, updater, mapAnimation) {
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
		};
	}

	function updateViewData(data, currentTimeOnly) {
		const timeUnit = storage.settings.units.time.get();
		viewData.is12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		viewData.currentTime = utils.getTimeAsText(new Date(), timeUnit, viewData.is12hFormat);

		viewData.lastUpdate = storage.lastUpdate.get();
		viewData.lastUpdateHuman = utils.humanReadableTimeDiff(utils.getNowAsEpochInSeconds(), viewData.lastUpdate);

		if(currentTimeOnly) { return; }

		const observation = data.weather.observation;
		viewData.tempOrig = observation.metric.temp;
		const tempData = utils.getTemperatureAndUnitAsText(viewData.tempOrig, storage.settings.units.temperature.get());
		viewData.temp = tempData[0];
		viewData.tempUnit = tempData[1];
		
		viewData.snapshotTimeUTCMillis = observation.obs_time * 1000;
		viewData.timeUnit = timeUnit;

		viewData.alertsCounter = parseInt(($.isArray(data.alerts.alerts) ? data.alerts.alerts.length : 0), 10);

		mapAnimation.setClickable(storage.map.get());

		updateMapAnimationFrames();
	}

	function getHtmlForTemp(temp, tempUnit, snapshotTimeArr) {
		var result = [];
		console.log('getHtmlForTemp: temp=' + JSON.stringify(temp) + ', tempUnit=' + JSON.stringify(tempUnit) + ', snapshotTimeArr=' + JSON.stringify(snapshotTimeArr));

		if (temp !== null && tempUnit !== null) {
			result = result.concat([temp, '°', '<span>', tempUnit, '</span>']);
		} else {
			result = result.concat(['-']);
		}

		result = result.concat([
			'<span class="radar__separator">',
			TIZEN_L10N.RADAR_AT,
			'</span>',
			snapshotTimeArr[0],
			(snapshotTimeArr[1] ? '<span>' + snapshotTimeArr[1].trim() + '</span>' : '')]);

		return result.join('');
	}

	function updateUI(data, timeOnly) {
		const ampm = viewData.currentTime[1] ? '<span>' + viewData.currentTime[1].trim() + '</span>' : '';
		ui.date.html( viewData.currentTime[0] + ampm );
		ui.updateBtn.text(data.lastUpdateHuman);

		if(mapAnimation.getCurrentFrame() === 0 && viewData.snapshotTimeUTCMillis !== undefined) {
			const snapshotDate = new Date(viewData.snapshotTimeUTCMillis);
			viewData.snapshotTime = utils.getTimeAsText(snapshotDate, viewData.timeUnit, viewData.is12hFormat);

			const newValue = data.temp + '°' +
			'<span>' + data.tempUnit + '</span>' +
			'<span class="radar__separator">' + TIZEN_L10N.RADAR_AT + '</span>' +
			viewData.snapshotTime[0] + ampm;

			if(ui.temp.html() !== newValue) {
				ui.temp.html(newValue);
			}
		}

		if(timeOnly) { return; }

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

	const updateMapAnimationFrames = function() {
		const frames = [];

		const standardMap = storage.map.get();
		for (var i=0; i<mapAnimation.getFramesCount(); ++i) {
			frames[i] = standardMap;
		}

		return rx.Observable.concat(
			rx.Observable.fromArray(storage.futureMap),
			rx.Observable.fromArray(storage.pastMap))
				.flatMap(function(fileTimestampStore, index) {
					return rx.Observable.zip(
						rx.Observable.just(index + 1),			//+1 because setFrames uses first frame for current map
						fileTimestampStore.file.getRx()
							.map(function(file) {
								return file.toURI();
							})
							.catch(rx.Observable.just(null))	//return file URI or null in case of any problem
					);
 				})
				.subscribe(function(next) {
					const index = next[0];
					const filePathUriOrNull = next[1];

					if (filePathUriOrNull) {
						frames[index] = filePathUriOrNull;
					} else {
						//If there is no downloaded frame leave default (standardMap)
					}
				}, function(err) {
					console.error('updateMapAnimationFrames: ' + JSON.stringify(err));
				}, function() {
					mapAnimation.setFrames(frames);
				});
	};

	return {
		pagebeforeshow: function(ev) {
			ui = getUI();

			mapAnimation.create({
				root: '.radar__map',
				info: '.radar__button',
				// navigating from widget should trigger autoplay
				autoplay: utils.getAppControl().operation === 'navigate',
				framesCount: (consts.NBR_OF_PAST_MAPS + 1 + consts.NBR_OF_FUTURE_MAPS),
				clickable: false,
				bezel: {
					root: '.bezel-placeholder',
					min: 0,
					max: 7,
					disabled: true
				},
				onShowFrame: function(frameIndex) {
					if (frameIndex === 0) {
						if (viewData.snapshotTime) {
							ui.temp.html(getHtmlForTemp(viewData.temp, viewData.tempUnit, viewData.snapshotTime));
						} else {
							console.log('onShowFrame: no snapshotTime data');
						}
					} else {
						const storageFutureAndPastFrames = storage.futureMap.concat(storage.pastMap);
						const currentFileTimestampStorage = storageFutureAndPastFrames[frameIndex - 1];
						const currentTimestampStorage = currentFileTimestampStorage.timestamp;
						const timestampForFrame = currentTimestampStorage.get();

						if (timestampForFrame) {
							const timeUnit = storage.settings.units.time.get();
							const frameDate = new Date(timestampForFrame * 1000);

							const snapshotTime = utils.getTimeAsText(frameDate, timeUnit, viewData.is12hFormat);

							ui.temp.html(getHtmlForTemp(null, null, snapshotTime));
						} else {
							ui.temp.html(getHtmlForTemp(null, null, ['-', '']));
						}						
					}
				}
			});

			const to = storage.navigateTo.getAndSet('');
			if(to === '') {
				mapAnimation.fullReset();
			}

			storage.data.setChangeListener(loadData);
			loadData();
			updater.softUpdate();

			ui.updateBtn.prop('disabled', updater.updateInProgress());
			updater.setOnUpdateCompleteHandler(function() {
				ui.updateBtn.prop('disabled', false);
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

			const createMapFrameChangeListener = function(store, index) {
				return function() {
					store.getRx()
						.map(function(file) {
							return file.toURI();
						})
						.catch(rx.Observable.just(storage.map.get()))	//If there is problem with getting file replace it with current map
						.subscribe(function(filePath) {
							console.log('Update map animation frame; index=' + (index+1) + ', filePath=' + filePath);
							mapAnimation.setFrame(filePath, index + 1);
						});
				};
			};

			storage.futureMap.concat(storage.pastMap).forEach(function(fileTimestampStore, index) {
				fileTimestampStore.file.setChangeListener(createMapFrameChangeListener(fileTimestampStore.file, index));
			});
		},
		
		visibilitychange: function() {
			if(!document.hidden) {
				updater.softUpdate();
				const to = storage.navigateTo.getAndSet('');
				if(to === '') {
					mapAnimation.fullReset();
				}
				ui.updateBtn.prop('disabled', updater.updateInProgress());
				mapAnimation.reset();
			} else {
				mapAnimation.stop();
			}
		},

		pagebeforehide: function(ev) {
			storage.futureMap.concat(storage.pastMap).forEach(function(fileTimestampStore) {
				fileTimestampStore.file.unsetChangeListener();
			});

			mapAnimation.destroy();

			if(refreshViewId) {
				clearTimeout(refreshViewId);
				refreshViewId = null;
			}

			storage.data.unsetChangeListener(loadData);
			updater.removeOnUpdateCompleteHandler();

			ui.header.off();
			ui.moreBtn.off();
			ui.alertsBtn.off();
			ui = null;
		},
	};
});