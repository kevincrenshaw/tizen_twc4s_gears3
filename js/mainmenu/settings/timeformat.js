( function () {	
	modifyElement(document, '#settingsTimeFormatPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_TIMEFORMAT);				
				modifyElements(page, 'ul.ui-listview li input[name="timeformat-radio"]', function(inputElement) {
					modifyInnerHtml(inputElement.parentNode,
							'span#text',
							storage.settings.timeformat.mapping.getLocalizedTextForValue(inputElement.value));
				});
				
				addGenericHandlerForSettingPageWithRadioButtons(page,
						storage.settings.timeformat,
						function(el) { return el.name === 'timeformat-radio'; });
			});
	});
} () );
