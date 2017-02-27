/* jshint esversion: 6 */
define(['require'], function(require) {
	const pageEventDispatcher = function(e) {
		const page = e.target;
		const moduleName = 'pages/' + page.id;
		
		require([moduleName], function(viewModule) {
			if (viewModule) {
				if (viewModule.hasOwnProperty(e.type)) {
					console.info('Calling event handler ' + moduleName + ':' + e.type);
					viewModule[e.type](e);
				} else {
					console.debug('Module "' + moduleName + '" not accepting event: "' + e.type + '"')
				}
			} else {
				console.error('Module "' + moduleName + '" not found (event: "' + e.type + '")')
			}
		});
	};
	
	document.addEventListener('pagebeforeshow', pageEventDispatcher);
	document.addEventListener('pagebeforehide', pageEventDispatcher);
	
	tau.engine.run();
});