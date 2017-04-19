/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/dom',
	'utils/updater'
], function($, storage, consts, utils, dom, updater) {
	var intervalUpdaterId = null;
	var ui;
	var lastRefreshEpochTime;

	var snapshotTimeRepr = null;
	var currentTimeRepr = null;

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

	const createUiManager = function(root) {
		const element = {
			map: dom.queryWrappedElement(root, '#map'),
			more: dom.queryWrappedElement(root, '#more'),
			header: {
				container: dom.queryWrappedElement(root, '#header'),
				temperature: {
					value: dom.queryWrappedElement(root, '#temperatureBox #value'),
					unit: dom.queryWrappedElement(root, '#temperatureBox #unit'),
					at: dom.queryWrappedElement(root, '#temperatureBox #at'),
					time: dom.queryWrappedElement(root, '#temperatureBox #time'),
					ampm: dom.queryWrappedElement(root, '#temperatureBox #ampm'),
				},
				time : {
					value: dom.queryWrappedElement(root, '#timeBox #value'),
					unit: dom.queryWrappedElement(root, '#timeBox #unit'),
				},
				refresh: {
					btn: dom.queryWrappedElement(root, '#refreshBox #btn'),
					text: dom.queryWrappedElement(root, '#refreshBox #text'),
				},
			},
			footer: {
				container: dom.queryWrappedElement(root, '#footer'),
				alert: {
					button: dom.queryWrappedElement(root, '#footer #alerts'),
					counter: {
						container: dom.queryWrappedElement(root, '#alerts-counter-container'),
						value: dom.queryWrappedElement(root, '#alerts-counter-container #alerts-counter-value'),
					}
				},
			},
		};

		const footerContainerVisibility = dom.createVisibilityHandler(element.footer.container);
		const alertCounterContainerVisibility = dom.createVisibilityHandler(element.footer.alert.counter.container);
		
		return {
			map: {
				visible: dom.createVisibilityHandler(element.map),
				isVisible: dom.createIsVisibileHandler(element.map),
				src: dom.createSetSrcHandler(element.map),
			},
			
			more: {
				visible: dom.createVisibilityHandler(element.more),
				onClick: dom.createOnClickHandler(element.more),
			},
			
			header: {
				visible: dom.createVisibilityHandler(element.header.container),
				temperature: {
					text: dom.createSetInnerHtmlHandler(element.header.temperature.value),
					unit: dom.createSetInnerHtmlHandler(element.header.temperature.unit),
					at: dom.createSetInnerHtmlHandler(element.header.temperature.at),
					time: dom.createSetInnerHtmlHandler(element.header.temperature.time),
					ampm: dom.createSetInnerHtmlHandler(element.header.temperature.ampm),
				},
				refresh: {
					btn: {
						enable: dom.createEnableHandler(element.header.refresh.btn),
						onClick: dom.createOnClickHandler(element.header.refresh.btn),
					},

					text: dom.createSetInnerHtmlHandler(element.header.refresh.text),
				},
				time: {
					text: dom.createSetInnerHtmlHandler(element.header.time.value),
					unit: dom.createSetInnerHtmlHandler(element.header.time.unit),
				},
			},
			
			footer: {
				alert: {
					onClick: dom.createOnClickHandler(element.footer.alert.button),
					
					counter: function(number) {
						const value = parseInt(number);
						
						if (value > 0) {
							element.footer.alert.counter.value.apply(function(el) {								
								const text = value > consts.RADAR_ALERTS_MAX_NBR
									? consts.RADAR_ALERTS_MAX_NBR.toString() + '+'
									: value; 
								
								el.innerHTML = text;
							});
							
							footerContainerVisibility(true);
							alertCounterContainerVisibility(true);
						} else {
							alertCounterContainerVisibility(false);
							footerContainerVisibility(false);
						}
					}
				},
			}
		};
	};

	const saveSnapshotTime = function(time) {
		tizen.preference.setValue('snapshot_time', time);
	};

	const saveTimeAmPm = function(ampm) {
		const ampm_key = 'time_ampm';
		if(ampm) {
			tizen.preference.setValue(ampm_key, ampm);
			return;
		}
		if(tizen.preference.exists(ampm_key)) {
			tizen.preference.remove(ampm_key);
		}

	};

	/**
	 * update ui function. all periodic update UI processes should be place here
	 * */
	const updateUI2 = function(ui) {
		if(!ui) {
            console.warn('updateUI. there is no ui to update');
			return;
		}

		const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
		this.currentTimeRepr = utils.getTimeAsText(new Date(), storage.settings.units.time.get(), systemUses12hFormat);

		//apply on ui
		ui.header.time.text(this.currentTimeRepr[0]);
		ui.header.time.unit(this.currentTimeRepr[1]);
		if(this.snapshotTimeRepr) {
			ui.header.temperature.time(this.snapshotTimeRepr[0]);
			ui.header.temperature.ampm(this.snapshotTimeRepr[1]);
			ui.header.temperature.at(TIZEN_L10N.RADAR_AT);
		}
	};
	
	const diffCategoryToLocalizationKey = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};

	const displayData = function(mapFilePath, weather, alerts, downloadTimeEpochInSeconds) {
		const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		const tempInCelsius = weather.observation.metric.temp;
		const tempTextualRepr = getTemperatureAndUnitAsText(
			tempInCelsius,
			storage.settings.units.temperature.get());

		const tempText = tempTextualRepr[0] + '°';
		const unitText = tempTextualRepr[1];

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

		//snapshot time
		const shapshotTimeInMillis = weather.observation.obs_time * 1000;
		const snapshotTimeRawDate = new Date(shapshotTimeInMillis);
		this.snapshotTimeRepr = utils.getTimeAsText(snapshotTimeRawDate, storage.settings.units.time.get(), systemUses12hFormat);

		updateUI(ui);

		saveSnapshotTime(snapshotTimeRawDate.getTime());
		saveTimeAmPm(this.currentTimeRepr[1]);

		//refresh time
		lastRefreshEpochTime = downloadTimeEpochInSeconds;
		weatherDownloadTimeUpdater();

		if(intervalUpdaterId === null) {
			intervalUpdaterId = setInterval(
				function() {
					updateUI(ui);
					weatherDownloadTimeUpdater();
				},
				1000 //every 1 second update interval
			);
		}

		const nbrOfAlerts = alerts && alerts.alerts ? alerts.alerts.length : 0;
		
		storage.temp.set(tempInCelsius);

		ui.map.src(mapFilePath);
		ui.header.temperature.text(tempText);
		ui.header.temperature.unit(unitText);
		ui.header.refresh.btn.enable(true);
		ui.map.visible(true);
		ui.header.visible(true);
		ui.footer.alert.counter(nbrOfAlerts);
		ui.more.visible(true);
	};

	function updateViewData(data) {
		viewData.map = storage.map.get();

		const observation = data.weather.observation;
		viewData.tempOrig = observation.metric.temp;
		const tempData = getTemperatureAndUnitAsText(viewData.tempOrig, storage.settings.units.temperature.get());
		viewData.temp = tempData[0];
		viewData.tempUnit = tempData[1];

		viewData.is12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
		viewData.snapshotDate = new Date(observation.obs_time * 1000);
		viewData.snapshotTime = utils.getTimeAsText(viewData.snapshotDate, storage.settings.units.time.get(), viewData.is12hFormat);

		viewData.alertsCounter = $.isArray(data.alerts) ? data.alerts.length : 0;

				console.log(viewData, storage.settings.units.time.get(), viewData.is12hFormat);

		console.log($.isArray(null));
	}

	function saveToStorage(data) {
		storage.temp.set(data.tempOrig);
		tizen.preference.setValue('snapshot_time', data.snapshotDate.getTime());
		tizen.preference.setValue('time_ampm', data.is12hFormat);
	}

	function updateUI(data, currentTimeOnly) {
		if(currentTimeOnly) {
			return;
		}

		uiElems.map.show().attr('src', data.map);

		uiElems.alertsCounter.toggle(!!data.alertsCounter).text(data.alertsCounter);
	}

	function resetUI() {
		uiElems.map.hide();
		uiElems.header.hide();
		uiElems.alertsCounter.hide().text(0);
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
return;
		if (dataText) {
			try {
				const data = JSON.parse(dataText);
				displayData(storage.map.get(), data.weather, data.alerts, storage.lastUpdate.get());
			} catch(err) {
				console.error(JSON.stringify(err));
			}
		} else {
			ui.map.visible(false);
			ui.header.visible(false);
			ui.footer.alert.counter(0);
			console.log('No data in storage');
		}
	};

	return {
		pagebeforeshow: function(ev) {
			// const page = ev.target;
			// ui = createUiManager(page);

			uiElems = getUiElems();

			storage.data.setChangeListener(loadData);

			loadData();

			updater.softUpdate();

			/*const updateRunning = updater.updateInProgress();
			ui.header.refresh.btn.enable(!updateRunning);
			
			ui.header.refresh.btn.onClick(function() {
				if (updater.hardUpdate()) {
					ui.header.refresh.btn.enable(false);
				} else {
					console.warn('Force update button cannot be clickable when update in progress');
				}
			});

			ui.footer.alert.onClick(function() {
				tau.changePage('alerts.html');
			});

			ui.more.onClick(function() {
				console.log('More options');
			});*/
		},
		
		visibilitychange: function() {
			if(document.hidden !== true) {
				updater.softUpdate();
			}
		},

		pagebeforehide: function(ev) {
			storage.data.unsetChangeListener(loadData);
			ui.header.refresh.btn.onClick(null);
			ui.footer.alert.onClick(null);
			ui.more.onClick(null);

			if(intervalUpdaterId) {
				clearInterval(intervalUpdaterId);
				intervalUpdaterId = null;
			}
			ui = null;
		},
	};
});