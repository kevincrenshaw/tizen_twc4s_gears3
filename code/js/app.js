/* jshint esversion: 6 */

const modules = [
	'require',
	'pages/main',
	'pages/settings',
	'pages/units',
	'pages/time',
	'pages/distance',
	'pages/mapzoom',
	'pages/temperature',
];

define(modules, function(require, circleHelper) {
	//Selects module for given page (based on id tag) and call ev.type function from selected module (if possible).
	//Modules need to be loaded ealier.
	const dispatchEventToPage = function(ev) {
		const page = ev.target;
		const moduleName = 'pages/' + page.id;
		
		pageModule = require(moduleName);
		
		if (pageModule) {
			if (pageModule.hasOwnProperty(ev.type)) {
				console.info('Calling event handler for ' + moduleName + ':' + ev.type);
				pageModule[ev.type](ev);
			} else {
				console.debug('Module "' + moduleName + '" not accepting event: "' + ev.type + '"')
			}
		} else {
			console.error('Module "' + moduleName + '" not found (event: "' + ev.type + '")')
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
	
	const createMarqueeWidget = function(element) {
		if (element) {
			activeMaruqeeWidget.destroy();
			activeMaruqeeWidget.set(tau.widget.Marquee(element, {marqueeStyle: 'endToEnd', delay: '1000'}));
		}
	};
	
	const listItemSelectedEventListener = function(ev) {
		createMarqueeWidget(ev.target.querySelector('.ui-marquee'));
	};
	
	const listItemScrollStartEventListener = function(ev) {
		activeMaruqeeWidget.destroy();
	};
	
	document.addEventListener('pagebeforeshow', function(ev) {
		//Call event handler from page module (if provided)
		dispatchEventToPage(ev);
		
		//Find every circle helper on current page, create widget for it and save it for later destruction
		const selector = '.ui-listview.circle-helper-snap-list';
		const snapListNodeList = ev.target.querySelectorAll(selector);
		const snapListNodeListLen = snapListNodeList.length;
		
		for (var i=0; i<snapListNodeListLen; ++i) {
			var listNode = snapListNodeList[i];
			destroyables.add(tau.helper.SnapListStyle.create(listNode, {animate: "scale"}));
			
			//List item selected by default do not triggers 'selected' event so we need to create marquee manually.
			createMarqueeWidget(listNode.querySelector('.ui-snap-listview-selected .ui-marquee'));
						
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
	
	tau.engine.run();
});