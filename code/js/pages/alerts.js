/* jshint esversion: 6 */

define(['utils/storage', 'utils/utils', 'utils/dom'], function(storage, utils, dom) {

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
				const alertObject = utils.convertAlertsTextToObjectOrUndefined(data);
				const numberOfAlerts = alertObject && alertObject.alerts ? alertObject.alerts.length : 0;

				binder.title(TIZEN_L10N.ALERTS);

				if(numberOfAlerts > 0) {
					binder.noalerts.display('none');
					binder.alerts.display('inline');
					binder.alerts.clear();
				} else {
					binder.noalerts.display('inline');
					binder.alerts.display('none');
					binder.noalerts.text(TIZEN_L10N.NO_ALERTS);
				}

				for(var index = 0; index < numberOfAlerts; ++index) {
					const itemData = alertObject.alerts[index];
					binder.alerts.addItem(createListItem(itemData.eventTrackingNumber + ' : ' + itemData.eventDescription));
				}
			},
		};
	};

	function createOnPrefsUpdater() {
		return function() {
			if(ui) {
				ui.update(storage.alert.get())
			}
		};
	}

	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			ui = createUIAdapter(page);
			updateHandler = createOnPrefsUpdater();
			storage.alert.setChangeListener(updateHandler);
			ui.update(storage.alert.get());
			//alerts.onPageShow(page);
		},

		pagebeforehide: function(ev) {
			const page = ev.target;
			//alerts.onPageHide(page);
			storage.alert.unsetChangeListener(updateHandler);
			updateHandler = null;
			ui = null;
		},
	};
});