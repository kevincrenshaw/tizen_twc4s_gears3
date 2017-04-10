/* jshint esversion: 6 */

define(['utils/dom'], function(dom) {
	var ui;
	
	const createUiManager = function(page) {
		const element = {
			title: dom.queryWrappedElement(page, '.ui-title'),	
		};
		
		//TODO remove duplicate (radar.js)
		const setInnerHtmlImpl = function(wrappedElement) {
			return function(text) {
				wrappedElement.apply(function(el) {
					el.innerHTML = text;
				});
			};
		};
		
		return {
			title: setInnerHtmlImpl(element.title),
		};
	};
	
	const createTranslator = function(ui) {
		const translate = function() {
			ui.title(TIZEN_L10N.ALERTS);
		}
		
		return {
			translate: translate,
		};
	};
	
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			ui = createUiManager(page);
			createTranslator(ui).translate();
		},
		
		pagebeforehide: function(ev) {
			ui = null;
		},
	};
});