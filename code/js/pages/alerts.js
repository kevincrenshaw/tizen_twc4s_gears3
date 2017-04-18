/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils', 'utils/dom', 'utils/updater'], function(storage, utils, dom, updater) {

	var updateHandler = null;
	var ui = null;

	const createUIAdapter = function(page) {
		//view hierarchy holder
		const holder = {
			title: dom.queryWrappedElement(page, '.ui-title'),
			noalerts: {
				page: dom.queryWrappedElement(page, '#no-alerts-container'),
				text: dom.queryWrappedElement(page, '#status')
			},

			alerts: {
				page: dom.queryWrappedElement(page, '#alerts-container'),
				list: dom.queryWrappedElement(page, '#alert-list'),
			},
		};
		//view and logic (change visibility, click events, etc.) binder
		const binder = {
			title: dom.createSetInnerHtmlHandler(holder.title),
			noalerts: {
				display: dom.createDisplayHandler(holder.noalerts.page),
				text: dom.createSetInnerHtmlHandler(holder.noalerts.text),
			},
			alerts: {
				display: dom.createDisplayHandler(holder.alerts.page),
				addItem: dom.createAddListItemHandler(holder.alerts.list),
				clear: dom.createDeleteAllChildrenHolder(holder.alerts.list),
			},
		};

		const createListItem = function(text) {
			const listItem = document.createElement('li');
			const listItemLabel = document.createTextNode(text);
			listItem.appendChild(listItemLabel);
			return listItem;
		};

		return {
			update: function(data) {
				const alertObject = utils.convertTextToObjectOrUndefined(data);

				const numberOfAlerts = alertObject &&
					alertObject.alerts &&
					alertObject.alerts.alerts &&
					Array.isArray(alertObject.alerts.alerts) ? alertObject.alerts.alerts.length : 0;

				binder.title(TIZEN_L10N.ALERTS);
				

				if(numberOfAlerts > 0) {
					binder.noalerts.display('none');
					binder.alerts.display('none');
					//TODO uncomment in US TWCGS3-85

//					binder.alerts.display('inline');
//					binder.alerts.clear();
				} else {
					binder.noalerts.display('inline');
					binder.alerts.display('none');
					binder.noalerts.text(TIZEN_L10N.NO_ALERTS);
				}

				for(var index = 0; index < numberOfAlerts; ++index) {
					const itemData = alertObject.alerts.alerts[index];
					binder.alerts.addItem(createListItem(itemData.eventTrackingNumber + ' : ' + itemData.eventDescription));
				}
			},
		};
	};

	function createOnPrefsUpdater() {
		return function(data) {
			try {
				if (ui) {
					if (data.value) {
						ui.update(data.value);
					}
				} else {
					console.warn('createOnPrefsUpdater no ui');
				}
			} catch(err) {
				console.error('createOnPrefsUpdater: ' + JSON.stringify(err));
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