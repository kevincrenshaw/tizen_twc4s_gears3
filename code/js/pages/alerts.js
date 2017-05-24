/* jshint esversion: 6 */

define([
	'jquery',
	'utils/storage',
	'utils/utils',
	'utils/dom',
	'utils/updater',
	'utils/const'
], function($, storage, utils, dom, updater, consts) {

	var updateHandler = null;
	var adapter = null;
	var refreshViewId;

	/**
	 * Creates adapter between data and UI
	 * */
	const createAdapter = function(page) {

		//Represents all destroyable object for given page (objects that need to be destroyed when leaving page)
		const destroyablesManager = utils.createDestroyableManager();

		//There is only one acrive marquee widget at the moment
		const activeMaruqeeWidgetManager = utils.createMarqueeWidgetManager();
		
		//view hierarchy holder
		const holder = {
			header: $('#alerts__header'),
			time: $('#alerts__header .header-block-top #value'),
			ampm: $('#alerts__header .header-block-top #unit'),
			district: $('#alerts__header .header-block-middle #office-district'),

			update: {
				btn: $('#alerts__update'),
			},

			noalerts: {
				page: dom.queryWrappedElement(page, '#no-alerts-container'),
				text: dom.queryWrappedElement(page, '#status'),
			},

			alerts: {
				page: dom.queryWrappedElement(page, '#alerts-container'),
				list: page.querySelector('#alert-list'),
			},
			
			morebutton: dom.queryWrappedElement(page, '#morebtn'),
		};

		//view and logic (change visibility, click events, etc.) binder
		const binder = {
			header: {
				district: function(value) {
						//set title to UI and construct new marquee widget
						holder.district.html(value);
						//add widget to destroyable manager
						const marqueeWidget = utils.createMarqueWidget(holder.district[0], {iteration: 'infinite', autoRun: true});
						destroyablesManager.add(marqueeWidget);
				},

				refreshCurrentTime : function() {
					const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
					const currentTimeRepr = utils.getTimeAsText(new Date(), storage.settings.units.time.get(), systemUses12hFormat);
					holder.time.html(currentTimeRepr[0]);
					holder.ampm.html(currentTimeRepr[1].trim());
				},
			},
			noalerts: {
				display: dom.createDisplayHandler(holder.noalerts.page),
				text: dom.createSetInnerHtmlHandler(holder.noalerts.text),
			},
			alerts: {
				alertsDataArray: null,
				display: dom.createDisplayHandler(holder.alerts.page),
				
				set : function(alertsDataArray, arraySize) {
					this.alertsDataArray = alertsDataArray;
					if(Array.isArray(alertsDataArray) && arraySize > 0) {
						const timeFormatSetting = storage.settings.units.time.get();
						for(var index = 0; index < arraySize; ++index) {
							const listItemNode = utils.createAlertsListItem(alertsDataArray[index], timeFormatSetting);
							holder.alerts.list.appendChild(listItemNode);
						}
					}
					utils.updateSnapListWithMarqueeWidgets(page, destroyablesManager, activeMaruqeeWidgetManager);
				},
				
				clear: function() {
					while(holder.alerts.list.hasChildNodes()) {
						holder.alerts.list.removeChild(holder.alerts.list.lastChild);
					}
				},
				
				items: function() {
					return holder.alerts.list.querySelectorAll('li');
				},
				
				updateListItem: function(listItemView, alertData) {
					function updateListItemView() {
						const subtitleDiv = listItemView.querySelector('#text_subtitle');
						if(subtitleDiv) {
							const details = utils.createAlertDetailsText(alertData.processTimeUTC, alertData.expireTimeUTC, storage.settings.units.time.get());
							subtitleDiv.innerHTML = details;
						} else {
							console.warn('updateListItem::cant find list item');
						}
					}

					if(listItemView.className.indexOf('ui-snap-listview-selected') !== -1) {
						activeMaruqeeWidgetManager.destroy();
						updateListItemView();
						activeMaruqeeWidgetManager.set(utils.createMarqueWidget(listItemView.querySelector('.ui-marquee')));
					} else {
						updateListItemView();
					}
				},
			},
			more: {
				onClick: dom.createOnClickHandler(holder.morebutton),
			},
		};

		binder.more.onClick(function() {
			utils.openDeepLinkOnPhone(consts.ALERT_DEEPLINK);
		});

		holder.header.on('click', function() {
			if(updater.hardUpdate()) {
				holder.update.btn.prop('disabled', true);
			} else {
				console.warn('Force update button cannot be clickable when update in progress');
			}
		});

		return {
			setData: function(data) {
				const alertObject = utils.convertTextToObjectOrUndefined(data);

				const numberOfAlerts = alertObject &&
					alertObject.alerts &&
					alertObject.alerts.alerts &&
					Array.isArray(alertObject.alerts.alerts) ? alertObject.alerts.alerts.length : 0;
				//because we have only one distrinct from current location, we can take it from first alert event
				var district = '-';
				if(numberOfAlerts > 0) {
					//some locations can have null district so lets use area name
					district = alertObject.alerts.alerts[0].officeAdminDistrict || alertObject.alerts.alerts[0].areaName;
				}
				//show header
				holder.header.show();

				if(numberOfAlerts > 0) {
					binder.noalerts.display('none');
					binder.alerts.display('inline');
					binder.alerts.set(alertObject.alerts.alerts, numberOfAlerts);
				} else {
					binder.noalerts.display('inline');
					binder.alerts.display('none');
					binder.noalerts.text(TIZEN_L10N.NO_ALERTS);
				}

				binder.header.district(district);
			},
			
			update: function() {
				binder.header.refreshCurrentTime();

				holder.update.btn.prop('disabled', updater.updateInProgress());

				if(binder.alerts.alertsDataArray && Array.isArray(binder.alerts.alertsDataArray)) {
					const alertsCount = binder.alerts.alertsDataArray.length;
					for(var i = 0; i < alertsCount; ++i) {
						const item = binder.alerts.items()[i];
						binder.alerts.updateListItem(item, binder.alerts.alertsDataArray[i]);
					}
				}
			},

			clear: function() {
				//Cleanup destroyable objects
				destroyablesManager.destroy();
				binder.alerts.clear();

				this.refresh();
			},

			updateRefreshButton : function() {
				holder.update.btn.prop('disabled', updater.updateInProgress());
			},

			refresh: function() {
				const lastUpdate = storage.lastUpdate.get();
				const lastUpdateHuman = utils.humanReadableTimeDiff(utils.getNowAsEpochInSeconds(), lastUpdate);
				holder.update.btn.text(lastUpdateHuman);

				binder.header.refreshCurrentTime();
			},

		};
	};

	function createOnPrefsUpdater() {
		return function() {
			if(adapter) {
				adapter.clear();
				adapter.setData(storage.data.get());
			} else {
				console.warn('createOnPrefsUpdater::adapter doesnt exist');
			}
		};
	}

	function safeUpdate() {
		if(adapter) {
			adapter.update();
		} else {
			console.warn('safeUpdate::adapter doesnt exist');
		}
	}

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			tizen.time.setDateTimeChangeListener(safeUpdate);
			updater.setOnUpdateCompleteHandler(safeUpdate);
			
			adapter = createAdapter(page);
			updateHandler = createOnPrefsUpdater();
			storage.data.setChangeListener(updateHandler);
			adapter.clear();
			adapter.setData(storage.data.get());
			updater.softUpdate();

			if (!refreshViewId) {
				refreshViewId = setInterval(adapter.refresh, 1000);
			}

			adapter.updateRefreshButton();
		},

		pagebeforehide: function(ev) {
			const page = ev.target;
			tizen.time.unsetDateTimeChangeListener();
			updater.removeOnUpdateCompleteHandler();

			storage.data.unsetChangeListener();
			updateHandler = null;
			adapter.clear();
			adapter = null;

			if (refreshViewId) {
				clearInterval(refreshViewId);
				refreshViewId = null;
			}
		},

		visibilitychange: function() {		
			if(!document.hidden) {
				updater.softUpdate();
				safeUpdate();
			}
		},
	};
});
