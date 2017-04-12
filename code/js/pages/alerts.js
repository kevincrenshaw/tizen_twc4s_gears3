/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils', 'utils/dom', 'utils/updater'], function(storage, utils, dom, updater) {

	var intervalUpdaterId = null;
	var updateHandler = null;
	var ui = null;

	const createUIAdapter = function(page) {
		//view hierarchy holder
		const holder = {
			header: dom.queryWrappedElement(page, '#header'),
			time: dom.queryWrappedElement(page, '#header .header-block-top #value'),
			ampm: dom.queryWrappedElement(page, '#header .header-block-top #unit'),
			district: dom.queryWrappedElement(page, '#header .header-block-middle #office-district'),

			noalerts: {
				page: dom.queryWrappedElement(page, '#no-alerts-container'),
				text: dom.queryWrappedElement(page, '#status'),
			},

			alerts: {
				page: dom.queryWrappedElement(page, '#alerts-container'),
				list: dom.queryWrappedElement(page, '#alert-list'),
			},

			moreblock: dom.queryWrappedElement(page, '#moreblock'),
			morebutton: dom.queryWrappedElement(page, '#morebtn'),
		};
		//view and logic (change visibility, click events, etc.) binder
		const binder = {
			header: {
				visible: dom.createVisibilityHandler(holder.header),
				district: dom.createSetInnerHtmlHandler(holder.district),

				time: function(time, ampm) {
					dom.createSetInnerHtmlHandler(holder.time)(time);
					dom.createSetInnerHtmlHandler(holder.ampm)(ampm);
				},
			},
			noalerts: {
				display: dom.createDisplayHandler(holder.noalerts.page),
				text: dom.createSetInnerHtmlHandler(holder.noalerts.text),
			},
			alerts: {
				display: dom.createDisplayHandler(holder.alerts.page),
				addItem: dom.createAddListItemHandler(holder.alerts.list),
				clear: dom.createDeleteAllChildrenHolder(holder.alerts.list),
			},
			more: {
				visible: dom.createVisibilityHandler(holder.moreblock),
				onClick: dom.createOnClickHandler(holder.morebutton),
			},
		};

		const createAlertDetailsText = function(startsAtUTCSecons, endAtUTCSecons) {
			const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
			const timeFormatSetting = storage.settings.units.time.get();

			const startsAt = utils.getDateAndTimeAsText(new Date(startsAtUTCSecons * 1000), timeFormatSetting, systemUses12hFormat);
			const endsAt = utils.getDateAndTimeAsText(new Date(endAtUTCSecons * 1000), timeFormatSetting, systemUses12hFormat);

			return 'starts: ' + startsAt + ' ends: ' + endsAt;
		};

		const createListItem = function(alertData) {
			const createDivElement = function(divId, innerHtml) {
				var element = document.createElement('div');
				element.id = divId;
				if(innerHtml) {
					element.innerHTML = innerHtml;
				}
				return element;
			};

			var titleDiv = createDivElement('text_title', alertData.eventDescription);
			titleDiv.className = " list-item-title";
			//because tau.circle.min override colors we have to set it after all style settings
			titleDiv.style.color = "#f5f5f5";

			const details = createAlertDetailsText(alertData.processTimeUTC, alertData.expireTimeUTC);
			console.log('details: ' + details);
			
			var subtitleDiv = createDivElement('text_subtitle', details);
			subtitleDiv.className = "ui-marquee list-item-subtitle";
			subtitleDiv.style.color = "#a7abae";

			var iconDiv = createDivElement('alert_icon');
			iconDiv.className = " img-icon warning-icon ui-li-thumb-left";

			var listItem = document.createElement('li');
			listItem.className = " li-has-thumb-left li-has-2line";
			listItem.id = "alerts_list_item";

			listItem.appendChild(titleDiv);
			listItem.appendChild(subtitleDiv);
			listItem.appendChild(iconDiv);

			return listItem;
		};

		return {
			update: function(data) {
				const alertObject = utils.convertTextToObjectOrUndefined(data);

				const numberOfAlerts = alertObject &&
					alertObject.alerts &&
					alertObject.alerts.alerts &&
					Array.isArray(alertObject.alerts.alerts) ? alertObject.alerts.alerts.length : 0;

				//show header
				binder.header.visible(true);

				if(numberOfAlerts > 0) {
					binder.noalerts.display('none');
					binder.alerts.display('inline');
					binder.header.district(distrinct);
					binder.alerts.clear();
					binder.more.visible(true);
				} else {
					binder.noalerts.display('inline');
					binder.alerts.display('none');
					binder.noalerts.text(TIZEN_L10N.NO_ALERTS);
				}

				for(var index = 0; index < numberOfAlerts; ++index) {
					const itemData = alertObject.alerts.alerts[index];
					binder.alerts.addItem(createListItem(itemData));
				}
			},
			update: function() {
				const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';
				const currentTimeRepr = utils.getTimeAsText(new Date(), storage.settings.units.time.get(), systemUses12hFormat);
				binder.header.time(currentTimeRepr[0], currentTimeRepr[1]);
				
				//add updating list item elements here
			}
		};
	};

	function createOnPrefsUpdater() {
		return function() {
			if(ui) {
				ui.setData(storage.alert.get())
			}
		};
	}

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			ui = createUIAdapter(page);
			updateHandler = createOnPrefsUpdater();
			storage.data.setChangeListener(updateHandler);
			ui.update(storage.data.get());
			updater.softUpdate();
		},

		pagebeforehide: function(ev) {
			const page = ev.target;
			storage.data.unsetChangeListener(updateHandler);
			updateHandler = null;
			ui = null;
		},
	};
});