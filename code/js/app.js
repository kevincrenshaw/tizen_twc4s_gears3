/* jshint esversion: 6 */

requirejs.config({
	baseUrl: 'js',
	paths: {
		jquery: '../lib/jquery/jquery-1.11.1.min',
		rx: '../lib/rx.lite'
	},
});

const modules = [
	'require',
	'utils/utils',
	'utils/storage',
	'utils/network',
	'utils/back',
	'utils/lowBatteryCheck',
	'utils/dom',
	'utils/alert_updater',
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

define(modules, function(require, utils) {
	//Selects module for given page (based on id tag) and call ev.type function from selected module (if possible).
	//Modules need to be loaded ealier.
	const dispatchEventToPage = function(ev) {
		const moduleName = 'pages/' + ev.target.id;
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

	//Call event handler for module
	const setModuleToAciveState = function(moduleName, active) {
		const module = require(moduleName);

		if(module !== null) {
			if(active === true && module.hasOwnProperty('activate')) {
				module.activate();
			} else if(module.hasOwnProperty('deactivate')) {
				module.deactivate();
			} else {
				console.warn('module: ' + moduleName + ' doesnt support active state. make sure that module has activate() & deactivate() public api');
			}
		}
	};

	//Creates object that manages array of destroyables.
	const createDestroyableManager = function() {
		const destroyableArr = [];
		
		return {
			add: function(destroyable) {
				destroyableArr.push(destroyable);
			},
			
			destroy: function() {
				//Destroy in reverse order
				for (i=destroyableArr.length-1; i>=0; --i) {
					destroyableArr[i].destroy();
					destroyableArr[i] = null;
				}
				destroyableArr.length = 0; //clear array
			}
		};
	};
	
	const createMarqueeWidgetManager = function() {
		var activeMarqueeWidget;
		
		return {
			set: function(widget) {
				this.destroy();
				activeMarqueeWidget = widget;
			},
			
			destroy: function() {
				if (activeMarqueeWidget) {
					activeMarqueeWidget.stop();
					activeMarqueeWidget.destroy();
					activeMarqueeWidget = null;
				}
			},
		};
	};
	
	//Represents all destroyable object for given page (objects that need to be destroyed when leaving page)
	const destroyables = createDestroyableManager();
	
	//There is only one acrive marquee widget at the moment
	const activeMaruqeeWidget = createMarqueeWidgetManager();

	const createMarqueWidget = function(element) {
		return tau.widget.Marquee(element, {marqueeStyle: 'endToEnd', delay: '1000'});
	};
	
	const createMarqueeWidgetForListElement = function(element) {
		if (element) {
			activeMaruqeeWidget.destroy();
			activeMaruqeeWidget.set(createMarqueWidget(element));
		}
	};
	
	const listItemSelectedEventListener = function(ev) {
		const page = ev.target;
		createMarqueeWidgetForListElement(page.querySelector('.ui-marquee'));
	};
	
	const listItemScrollStartEventListener = function(ev) {
		activeMaruqeeWidget.destroy();
	};

	window.addEventListener('blur', function(ev) {
		setModuleToAciveState('utils/alert_updater', false);
	});
	
	window.addEventListener('focus', function(ev) {
		setModuleToAciveState('utils/alert_updater', true);
	});
	
	document.addEventListener('pagebeforeshow', function(ev) {
		const page = ev.target;

		//Call event handler from page module (if provided)
		dispatchEventToPage(ev);

		const title = page.querySelector(".ui-title");
		if (title) {
			destroyables.add(createMarqueWidget(title));
		}

		//Find every circle helper on current page, create widget for it and save it for later destruction
		const selector = '.ui-listview.circle-helper-snap-list';
		const snapListNodeList = page.querySelectorAll(selector);
		const snapListNodeListLen = snapListNodeList.length;
		
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
	});
	
	document.addEventListener('pagebeforehide', function(ev) {
		//Cleanup destroyable objects
		destroyables.destroy();

		//Call event handler from page module (if provided)
		dispatchEventToPage(ev);
	});

	const appCtrl = utils.getAppControl();
	const operation = appCtrl.operation;
	const uri = appCtrl.uri;
	
	console.log('App ctrl: operation="' + operation + '", uri="' + uri + '"');
	
	if (operation === 'navigate') {
		const target = 'html/' + uri + '.html';
		console.log('Navigating to: "' + target + '"');
		
		tau.changePage(target);
	} else {
		//Send fake event. Beacuse tau engine starts automatically this event is already sent.
		//To maintain backward comatibility send this event manually.
		dispatchEventToPage({ type:'pagebeforeshow', target:document.getElementById('main') });
	}
	
	//for a first launching app
	setModuleToAciveState('utils/alert_updater', true);
});