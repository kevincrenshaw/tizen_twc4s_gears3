/* jshint esversion: 6 */

define(['rx'], function(Rx) {
	const tryModifyElement = function(root, selector, callback) {
		const element = root.querySelector(selector);
	
		if (!element) {
			return false;
		} else {
			callback(element);
			return true;
		}
	};
	
	const modifyElement = function(root, selector, callback) {
		const result = tryModifyElement(root, selector, callback);
		
		if (result === false) {
			console.warn('modifyElement: no element found for selector "' + selector + '"');
		}
		
		return result;
	};	

	const modifyElements = function(root, selector, callback) {
		const elements = root.querySelectorAll(selector);
	
		for (i=0; i<elements.length; ++i) {
			if (callback(elements[i], i, elements) === true) {
				//Stop iteration on demand
				break;
			}
		}
	};
	
	const modifyInnerHtml = function(root, selector, text) {
		return modifyElement(root, selector, function(el) {
			el.innerHTML = text;
			return true;
		});
	};
	
	const modifySrc = function(root, selector, data) {
		return modifyElement(root, selector, function(el) {
			if('src' in el) {
				el.src = data;
			} else {
				console.warn('element: ' + JSON.stringify(el) + ' doesnt have field src');
			}
		});
	};
	
	/**
	 * generate pseudo unique uuid like:
	 * 26397a55-5d66-745f-ead9-0dd1eb5e22b5
	 * Returns:
	 * 		pseudo uid string
	 * */
	const guid = function() {
		const s4 = function() {
			return Math.floor((1 + Math.random()) * 0x10000)
		    .toString(16)
		    .substring(1);
		};
		
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	};

	/*
	 * Params:
	 * 	page - page with list view
	 *	title - string to display in head of the page
	 *	radioButtonElementName - name (from DOM tree) that every option (radio button) has
	 *	setting - storage setting object, for example: storage.settings.units.temperature
	 */
	const setupSettingPageWithRadioButtons = function(page, title, radioButtonElementName, setting) {
		//Set page title
		modifyInnerHtml(page, '.ui-title', title);
	
		const defaultValue = setting.getDefaultValue();
	
		//Set options label
		modifyElements(page, 'ul.ui-listview li input[name="' + radioButtonElementName + '"]', function(inputElement) {
			const localizedText = setting.getMappedValue(inputElement.value);
			const description = inputElement.value === defaultValue ? [localizedText, ['(', TIZEN_L10N.SETTINGS_DEFAULT, ')'].join('')].join(' ') : localizedText;
			
			modifyInnerHtml(inputElement.parentNode, 'div#text', description);
		});
	
		//Mark correct radio button as checked
		modifyElement(
			page,
			'ul.ui-listview input[value="' + setting.get() + '"]',
			function(el) { el.checked = true; }
		);
	
		//Handle clicks on list view
		modifyElement(page, 'ul.ui-listview', function(listView) {
			Rx.Observable.fromEvent(listView, 'click')
				.map(function(ev) { return ev.target; })
				.filter(function(el) { return function(el) { return el.name === radioButtonElementName; }; })
				.map(function(el) { return el.value; })
				.subscribe(function(value) {
					setting.set(value);
					history.back();
				});
		});
	};

	return {
		tryModifyElement: tryModifyElement,
		modifyElement: modifyElement,
		modifyInnerHtml: modifyInnerHtml,
		modifySrc: modifySrc,
		setupSettingPageWithRadioButtons: setupSettingPageWithRadioButtons,
		guid: guid,
	};
});