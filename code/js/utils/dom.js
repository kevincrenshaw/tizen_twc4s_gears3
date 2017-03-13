/* jshint esversion: 6 */

define([], function() {
	/*
	 * Creates wrapper around querySelector result. Helper function to search for DOM element (assume it succeded).
	 * When element needs to be changed no need to test if search been successful. In case of any problem wrapper
	 * will log warning with given selector for easier analysis.
	 * 
	 * Parameters:
	 * 		root - the root element for lookup
	 * 		selector - element lookup criteria
	 * 
	 * Result:
	 * 		Returns object with one member function (apply). Apply takes one argument (function) and applies that
	 * 		function to element if possible (element exists). Otherwise logs warning.
	 */
	const queryWrappedElement = function(root, selector) {
		const element = root.querySelector(selector);
		
		return {
			apply: function(func) {
				if (element) {
					return func(element);
				} else {
					console.warn('element "' + selector + '" not found');
				}
			},
		};
	};
	
	return {
		queryWrappedElement: queryWrappedElement,
	};
});