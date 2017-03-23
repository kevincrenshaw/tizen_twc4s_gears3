/* jshint esversion: 6 */

define(['rx', 'utils/utils'], function(rx, utils) {
	
	const quit = function() {
		try {
			tizen.application.getCurrentApplication().exit();
		} catch (ignore) {}
	};
	
	const operationIsNavigate = function() {
		return utils.getAppControl().operation === 'navigate';
	};
	
	const not = function(fcn) {
		return function() {
			return !fcn();
		}
	};
	
	const backButtonStream = rx.Observable.fromEvent(window, 'tizenhwkey')
		.filter(function(event) {
			return event.keyName === "back";
		});
	
	backButtonStream
		.filter(operationIsNavigate)
		.subscribe(quit);
	
	backButtonStream
		.filter(not(operationIsNavigate))
		.map(function() {
			const pageid = document.getElementsByClassName('ui-page-active')[0].id;
			return pageid ? pageid : "";
		})
		.subscribe(function(pageid) {
			switch (pageid) {
			case "main":
				quit();
				break;
			default:
				window.history.back();
			}
		});
});