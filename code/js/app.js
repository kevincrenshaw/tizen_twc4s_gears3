/* jshint esversion: 6 */
define(['require'], function(require) {
	const dispatchEventToPage = function(ev) {
		const page = ev.target;
		const moduleName = '/js/pages/' + page.id + '.js';
		
		require([moduleName], function(pageModule) {
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
		}, function(err) {
			console.error('Problem with loading module(s): "' + err.requireModules.join(',') + '" (reason: "' + err.requireType + '")');
		});
	};
	
	const createDestroyableManager = function() {
		const destroyableObjectArr = [];
		
		return {
			add: function(destroyable) {
//				console.log('*** add!');
				destroyableObjectArr.push(destroyable);
			},
			
			destroy: function() {
				//Destroy in reverse order
				for (i=destroyableObjectArr.length-1; i>=0; --i) {
//					console.log('*** destroy!');
					destroyableObjectArr[i].destroy();
				}
				destroyableObjectArr.length = 0; //clear array
			}
		};
	};
	
	const destroyables = createDestroyableManager();
	
	const listItemSelectedEventListener = function(ev) {
//		console.log('===> listItemSelectedEventListener');
	};
	
	const listItemScrollStartEventListener = function(ev) {
//		console.log('===> listItemScrollStartEventListener');
	};
	
	document.addEventListener('pagebeforeshow', function(ev) {
		const selector = '.ui-listview.circle-helper-snap-list';
		const snapListNodeList = ev.target.querySelectorAll(selector);
		const snapListNodeListLen = snapListNodeList.length;
		
		for (var i=0; i<snapListNodeListLen; ++i) {
			var list = snapListNodeList[i];
			destroyables.add(tau.helper.SnapListStyle.create(list, {animate: "scale"}));
			
//			list.addEventListener('selected', listItemSelectedEventListener);
//			list.addEventListener('scrollstart', listItemScrollStartEventListener);
		}
		
		dispatchEventToPage(ev);
	});
	
	document.addEventListener('pagebeforehide', function(ev) {
		dispatchEventToPage(ev);
		destroyables.destroy();
	});
	
	tau.engine.run();
});