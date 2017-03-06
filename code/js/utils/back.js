/* jshint esversion: 6 */

define(['rx'], function(Rx) {
	Rx.Observable.fromEvent(window, 'tizenhwkey')
	.filter(function(event) {
		return event.keyName === "back";
	})
	.map(function() {
		const pageid = document.getElementsByClassName('ui-page-active')[0].id;
		return pageid ? pageid : "";
	})
	.subscribe(function(pageid) {
		switch (pageid) {
		case "main":
			try {
				tizen.application.getCurrentApplication().exit();
			} catch (ignore) {}
			break;
		default:
			window.history.back();
		}
	});
});