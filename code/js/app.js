/* jshint esversion: 6 */

requirejs.config({
	baseUrl: 'js',
	paths: {
		jquery: '../lib/jquery/jquery-1.11.1.min',
		rx: '../lib/rx.all'
	},
});

const modules = [
	'require',
	'utils/utils',
	'utils/updater',
	'utils/storage',
	'utils/network',
	'utils/back',
	'utils/dom',
	'data/buildInfo',
	'pages/main',
	'pages/settings',
	'pages/units',
	'pages/time',
	'pages/distance',
	'pages/mapzoom',
	'pages/temperature',
	'pages/partnerapp',
	'pages/information',
	'pages/radar',
	'pages/weather',
	'pages/alerts'
];

define(modules, function(require, utils, updater, storage) {
	//Selects module for given page (based on id tag) and call ev.type function from selected module (if possible).
	//Modules need to be loaded ealier.
	const dispatchEventToPage = function(ev) {
		const page = ev.target;
		const moduleName = 'pages/' + page.id;

		const pageModule = require(moduleName);

		if (pageModule) {
			if (pageModule.hasOwnProperty(ev.type)) {
				console.info('Calling event handler for ' + moduleName + ':' + ev.type);
				pageModule[ev.type](ev);
			} else {
				console.debug('Module "' + moduleName + '" not accepting event: "' + ev.type + '"');
			}
		} else {
			console.error('Module "' + moduleName + '" not found (event: "' + ev.type + '")');
		}
	};
	
	//Represents all destroyable object for given page (objects that need to be destroyed when leaving page)
	const destroyables = utils.createDestroyableManager();
	
	//There is only one acrive marquee widget at the moment
	const activeMaruqeeWidget = utils.createMarqueeWidgetManager();

	const createMarqueeWidgetForListElement = function(element) {
		if (element) {
			activeMaruqeeWidget.destroy();
			activeMaruqeeWidget.set(utils.createMarqueWidget(element));
		}
	};
	
	const listItemSelectedEventListener = function(ev) {
		const page = ev.target;
		createMarqueeWidgetForListElement(page.querySelector('.ui-marquee'));
	};
	
	const listItemScrollStartEventListener = function(ev) {
		activeMaruqeeWidget.destroy();
	};

	const onFocus = function(ev) {
		updater.softUpdate();
	};
	
	window.addEventListener('blur', function(ev) {
		updater.stopUpdate();
	});
	
	//Handle on focus event that happen before app module up & running
	window.removeEventListener(focusEventListener);
	window.addEventListener('focus', onFocus);
	
	console.log('Focus events missed since app startup: ' + focusEventArr.length);
	for (var i=0; i<focusEventArr.length; ++i) {
		onFocus(focusEventArr[i]);
	}
	focusEventArr.length = 0;
	
	document.addEventListener('pagebeforeshow', function(ev) {
		const page = ev.target;

		//Call event handler from page module (if provided)
		dispatchEventToPage(ev);

		const title = page.querySelector(".ui-title");
		if (title) {
			destroyables.add(utils.createMarqueWidget(title));
		}

		//Find every circle helper on current page, create widget for it and save it for later destruction
		const selector = '.ui-listview.static.circle-helper-snap-list';
		const snapListNodeList = page.querySelectorAll(selector);
		const snapListNodeListLen = snapListNodeList.length;
		
		console.log('app::snapListNodeListLen: ' + snapListNodeListLen);
		for (var i=0; i<snapListNodeListLen; ++i) {
			var listNode = snapListNodeList[i];
			var snapListStyleWidget = tau.helper.SnapListStyle.create(listNode, {animate: "scale"});
			destroyables.add(snapListStyleWidget);
			
			//Focus on checked element
			utils.tryModifyElement(
				listNode,
				'input:checked[value]',
				function(el) {
					snapListStyleWidget.getSnapList().scrollToPosition(el.value - 1);
				}
			);

			//List item selected by default do not triggers 'selected' event so we need to create marquee manually.
			createMarqueeWidgetForListElement(listNode.querySelector('.ui-snap-listview-selected .ui-marquee'));
						
			listNode.addEventListener('selected', listItemSelectedEventListener);
			listNode.addEventListener('scrollstart', listItemScrollStartEventListener);
			
			destroyables.add({
				destroy: function() {
					listNode.removeEventListener('selected', listItemSelectedEventListener);
					listNode.removeEventListener('scrollstart', listItemScrollStartEventListener);
					activeMaruqeeWidget.destroy();
				}
			});
		}
		
		visibilityChangeManager.setPage(page);
	});
	
	document.addEventListener('pagebeforehide', function(ev) {
		//Cleanup destroyable objects
		destroyables.destroy();

		//Call event handler from page module (if provided)
		dispatchEventToPage(ev);
		
		visibilityChangeManager.setPage(null);
	});
	
	const visibilityChangeManager = function() {
		var currentPage;
		
		return {
			setPage: function(page) {
				currentPage = page;
			},
			
			sendEvent: function(state) {
				if (currentPage) {
					dispatchEventToPage({ target:currentPage, type:'visibilitychange', status:status });
				} else {
					console.log('visibilityChangeManager: No current page');
				}
			},
		};
	}();
	
	document.addEventListener('visibilitychange', function() {
		visibilityChangeManager.sendEvent(document.visibilityState);
	});

	//save ampm option at app startup
	utils.saveIfSystemUsesAMPMTimeFormat(storage.settings.units.time.get(), storage.ampm);

	//also we have to subscribe on "time format change" events
	tizen.time.setDateTimeChangeListener(function() {
		utils.saveIfSystemUsesAMPMTimeFormat(storage.settings.units.time.get(), storage.ampm);
	});

	const appCtrl = utils.getAppControl();
	const operation = appCtrl.operation;
	const uri = appCtrl.uri;
	
	console.log('App ctrl: operation="' + operation + '", uri="' + uri + '"');
	
	if (operation === 'navigate') {
		const target = 'html/' + uri + '.html';
		console.log('Navigating to: "' + target + '"');
		storage.navigateTo.set(uri);
		tau.changePage(target, { transition:'none' });
	} else {
		const mainPage = document.getElementById('main');
		//Send fake event. Beacuse tau engine starts automatically this event is already sent.
		//To maintain backward comatibility send this event manually.
		dispatchEventToPage({ type:'pagebeforeshow', target:mainPage });
		visibilityChangeManager.setPage(mainPage);
	}
});