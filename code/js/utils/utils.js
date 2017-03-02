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
			const description = inputElement.value === defaultValue
				? [localizedText, ['(', TIZEN_L10N.SETTINGS_DEFAULT, ')'].join('')].join(' ')
				: localizedText;
			
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
	
	const getPrecisionForLOD = function(lod) {
		switch(lod) {
			case 1: case 2: case 3: case 4:		return 0;
			case 5: case 6: case 7:				return 1;
			case 8: case 9: case 10: case 11:	return 2;
			case 12: case 13: case 14:			return 3;
		}
	};

	const getAllowedPrecisionAccordingToLOD = function(value, lod) {
		const precision = getPrecisionForLOD(lod);
		const tmp = Math.pow(10, precision);
		return (Math.round(value * tmp) / tmp).toFixed(precision);
	};

	return {
		tryModifyElement: tryModifyElement,
		modifyInnerHtml: modifyInnerHtml,
		setupSettingPageWithRadioButtons: setupSettingPageWithRadioButtons,
		getAllowedPrecisionAccordingToLOD: getAllowedPrecisionAccordingToLOD,
	};
});