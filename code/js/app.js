/* jshint esversion: 6 */
define(['require'], function(require) {
	const pageEventDispatcher = function(e) {
		const page = e.target;
		const moduleName = '/js/pages/' + page.id + '.js';
		
		require([moduleName], function(pageModule) {
			if (pageModule) {
				if (pageModule.hasOwnProperty(e.type)) {
					console.info('Calling event handler for ' + moduleName + ':' + e.type);
					pageModule[e.type](e);
				} else {
					console.debug('Module "' + moduleName + '" not accepting event: "' + e.type + '"')
				}
			} else {
				console.error('Module "' + moduleName + '" not found (event: "' + e.type + '")')
			}
		}, function(err) {
			console.error('Problem with loading module(s): "' + err.requireModules.join(',') + '" (reason: "' + err.requireType + '")');
		});
	};
	
	document.addEventListener('pagebeforeshow', pageEventDispatcher);
	document.addEventListener('pagebeforehide', pageEventDispatcher);
	
	tau.engine.run();
});