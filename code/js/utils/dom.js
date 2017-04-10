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

	/**
	 * Creates click event handler
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createOnClickHandler = function(wrappedElement) {
		return function(handler) {
			wrappedElement.apply(function(el) {
				el.onclick = handler;
			});
		};
	};

	/**
	 * Creates visibility state changer (using style.display property)
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createDisplayHandler = function(wrappedElement) {
		return function(displayState) {
			wrappedElement.apply(function(el) {
				el.style.display = displayState;
			});
		};
	};

	/**
	 * Creates simplified visibility state changer (using style.visibility property)
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createVisibilityHandler = function(wrappedElement) {
		return function(isVisible) {
			wrappedElement.apply(function(el) {
				el.style.visibility = isVisible ? 'visible' : 'hidden';
			});
		};
	};

	/**
	 * Creates inner src setter
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createSetSrcHandler = function(wrappedElement) {
		return function(uri) {
			wrappedElement.apply(function(el) {
				el.src = uri;
			});
		};
	};

	/**
	 * Creates inner html text setter
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createSetInnerHtmlHandler = function(wrappedElement) {
		return function(text) {
			wrappedElement.apply(function(el) {
				el.innerHTML = text;
			});
		};
	};

	/**
	 * Creates element's enable/disable setter
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createEnableHandler = function(wrappedElement) {
		return function(isEnabled) {
			wrappedElement.apply(function(el) {
				el.disabled = isEnabled ? false : true;
			});
		};
	};

	/**
	 * Creates add-element-to-listview handler
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createAddListItemHandler = function(wrappedElement) {
		return function(item) {
			wrappedElement.apply(function(el) {
				el.appendChild(item);
			});
		}
	};

	/**
	 * Creates remove-all-elements-from-listview handler
	 * Params
	 * 		wrappedElement - element returned by function queryWrappedElement()
	 * */
	const createDeleteAllChildrenHolder = function(wrappedElement) {
		return function() {
			wrappedElement.apply(function(el) {
				while(el.hasChildNodes()) {
					el.removeChild(el.firstChild);
				}
			});
		};
	};

	return {
		queryWrappedElement: queryWrappedElement,
		createDisplayHandler: createDisplayHandler,
		createVisibilityHandler: createVisibilityHandler,
		createOnClickHandler: createOnClickHandler,
		createSetSrcHandler: createSetSrcHandler,
		createSetInnerHtmlHandler: createSetInnerHtmlHandler,
		createEnableHandler: createEnableHandler,
		createAddListItemHandler: createAddListItemHandler,
		createDeleteAllChildrenHolder: createDeleteAllChildrenHolder,
	};
});