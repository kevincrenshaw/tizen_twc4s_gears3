(function() {
    modifyElement(document, '#settingsUnitsTemperaturePage.ui-page', function(page) {
        Rx.Observable.fromEvent(page, 'pagebeforeshow')
        .subscribe(function() {
            //Localize title
            modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_TEMPERATURE);

            console.log('***')
            modifyElements(page, 'ul.ui-listview li input[name="temperature-radio"]', function(inputElement) {
                modifyInnerHtml(inputElement.parentNode, 
                        'div#text',
                        storage.settings.units.temperature.mapping.getLocalizedTextForValue(inputElement.value)
                        );
            });
            

            addGenericHandlerForSettingPageWithRadioButtons(page, 
                    storage.settings.units.temperature,
                    function(el) { return el.name === 'temperature-radio'; })
        });
    });
}());
