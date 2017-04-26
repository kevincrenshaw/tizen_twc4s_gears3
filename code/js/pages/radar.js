/* jshint esversion: 6 */

const radarModules = [
	'utils/storage',
	'utils/const',
	'utils/utils',
	'utils/dom',
	'utils/updater'
];

define(radarModules, function(storage, consts, utils, dom, updater) {
	var intervalUpdaterId = null;
	var ui;
	var lastRefreshEpochTime;

	var snapshotTimeRepr = null;
	var currentTimeRepr = null;

	/*
	 * Converts temperature into textual representation.
	 * Parameters:
	 *		tempValueInCelsius - current temperature in Celsius
	 *		currentTemperatureUnitSetting - current temperature unit setting, for instance value returned by:
	 *			storage.settings.units.temperature.get()
	 *
	 * Result:
	 * 		Return array of two elements. First one is temperature converted to Celsius/Fahrenheit units. Second is
	 * 		textual representation of temperature unit.
	 */
	const getTemperatureAndUnitAsText = function(tempValueInCelsius, currentTemperatureUnitSetting) {
		switch (parseInt(currentTemperatureUnitSetting)) {
		case consts.settings.units.temperature.SYSTEM:
			console.warn('temperature system setting not supported yet, falling back to Celsius');
			/* falls through */
		case consts.settings.units.temperature.CELSIUS:
			return [tempValueInCelsius, 'C'];
			
		case consts.settings.units.temperature.FAHRENHEIT:
			return [Math.round(utils.celsiusToFahrenheit(tempValueInCelsius)), 'F'];
			
		default:
			console.warn('unexpected temperature setting value "' + currentTemperatureUnitSetting + '"');
		}
	};

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
				src: dom.createSetSrcHandler(element.map),
			},
			
			more: {
				onClick: dom.createOnClickHandler(element.more),
			},
			
			header: {
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
						onClick: dom.createOnClickHandler(element.header.container),
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

	/**
	 * update ui function. all periodic update UI processes should be place here
	 * */
	const updateUI = function(ui) {
		if(ui) {
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
        } else {
            console.warn('updateUI. there is no ui to update');
        }
	};
	
	const diffCategoryToLocalizationKey = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};

	const weatherDownloadTimeUpdater = function() {
		const diffInSeconds = utils.getNowAsEpochInSeconds() - lastRefreshEpochTime;
		const diffCategory = utils.getCategoryForTimeDiff(diffInSeconds);

		if (diffCategory in diffCategoryToLocalizationKey) {
			const localizationKey = diffCategoryToLocalizationKey[diffCategory];
			if (localizationKey in TIZEN_L10N) {
				const localizedText = TIZEN_L10N[localizationKey];

				var textToDisplay;

				if (diffCategory === 1) {
					textToDisplay = localizedText;
				} else {
					if (isNaN(diffInSeconds)) {
						textToDisplay = ['-', localizedText].join(' ');
					} else {
						textToDisplay = [utils.formatTimeDiffValue(diffInSeconds, diffCategory), localizedText].join(' ');
					}
				}

				ui.header.refresh.text(textToDisplay);
			} else {
				console.warn('Key "' + localizationKey + '" not available in localization');
			}
		} else {
			console.warn('Diff category "' + diffCategory + '" cannot be mapped to localization key');
		}
	};

	const displayData = function(mapFilePath, weather, alerts, downloadTimeEpochInSeconds) {
		const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		const tempInCelsius = weather.observation.metric.temp;
		const tempTextualRepr = getTemperatureAndUnitAsText(
			tempInCelsius,
			storage.settings.units.temperature.get());

		const tempText = [tempTextualRepr[0], '°'].join('');
		const unitText = tempTextualRepr[1];

		//snapshot time
		const shapshotTimeInMillis = weather.observation.obs_time * 1000;
		const snapshotTimeRawDate = new Date(shapshotTimeInMillis);
		this.snapshotTimeRepr = utils.getTimeAsText(snapshotTimeRawDate, storage.settings.units.time.get(), systemUses12hFormat);

		updateUI(ui);

		//refresh time
		lastRefreshEpochTime = downloadTimeEpochInSeconds;
		weatherDownloadTimeUpdater();

		const nbrOfAlerts = alerts && alerts.alerts ? alerts.alerts.length : 0;
		
		ui.map.src(mapFilePath);
		ui.header.temperature.text(tempText);
		ui.header.temperature.unit(unitText);
		ui.header.refresh.btn.enable(true);
		ui.footer.alert.counter(nbrOfAlerts);
	};

	const tryDisplayData = function() {
		const dataText = storage.data.get();
		console.log('try display data');

		if (dataText) {
			try {
				const data = JSON.parse(dataText);
				const mapFilePath = storage.map.get();
				const weatherData = data.weather;
				const alertsData = data.alerts;
				const lastUpdateTime = storage.lastUpdate.get();

				displayData(mapFilePath, weatherData, alertsData, lastUpdateTime);
			} catch(err) {
				console.error(JSON.stringify(err));
			}
		} else {
			ui.footer.alert.counter(0);
			console.log('No data in storage');
		}
	};

	const setForceUpdateButtonState = function() {
		const updateRunning = updater.updateInProgress();
		ui.header.refresh.btn.enable(!updateRunning);
	};

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			ui = createUiManager(page);

			storage.data.setChangeListener(tryDisplayData);

			tryDisplayData();

			updater.softUpdate();

			setForceUpdateButtonState();
			
			updater.setOnUpdateCompleteHandler(function() {
				if (ui) {
					ui.header.refresh.btn.enable(true);
				} else {
					console.warn('No UI for setOnUpdateCompleteHandler');
				}
			});

			ui.header.refresh.btn.onClick(function() {
				if (updater.hardUpdate()) {
					ui.header.refresh.btn.enable(false);
				} else {
					console.warn('Force update button cannot be clickable when update in progress');
				}
			});

			ui.footer.alert.onClick(function() {
				tau.changePage('alerts.html', { transition:'none' });
			});

			ui.more.onClick(function() {
				console.log('More options');
			});

			updateUI(ui);
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
		},
		
		visibilitychange: function() {
			if(document.hidden !== true) {
				updater.softUpdate();
				setForceUpdateButtonState();
			}
		},

		pagebeforehide: function(ev) {
			storage.data.unsetChangeListener(tryDisplayData);
			ui.header.refresh.btn.onClick(null);
			ui.footer.alert.onClick(null);
			ui.more.onClick(null);
			updater.removeOnUpdateCompleteHandler();

			if(intervalUpdaterId) {
				clearInterval(intervalUpdaterId);
				intervalUpdaterId = null;
			}
			ui = null;
		},
	};
});