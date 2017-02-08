( function () {	
	modifyElement(document, '#settingsUnitsMapZoomPage.ui-page', function(page) {
		//Localize text
		modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_UNITS_MAPZOOM);
		
		addGenericHandlerForSettingPageWithRadioButtons(page,
				storage.settings.units.mapzoom,
				function(el) { return el.name === 'mapzoom-radio'; });
	});
} () );
