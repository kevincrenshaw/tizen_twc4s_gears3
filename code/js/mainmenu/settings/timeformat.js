( function () {	
	modifyElement(document, '#settingsTimeFormatPage.ui-page', function(page) {
		Rx.Observable.fromEvent(page, 'pagebeforeshow')
			.subscribe(function() {
				
				//Localize text
				modifyInnerHtml(page, '.ui-title', TIZEN_L10N.SETTINGS_MENU_TIMEFORMAT);
				
				//Mark correct radio button as checked
				modifyElement(
					page,
					'ul.ui-listview input[value="' + storage.settings.timeformat.get() + '"]',
					function(el) { el.checked = true; }
				);
				
				//Handle clicks on list view
				modifyElement(page, 'ul.ui-listview', function(listView) {
					Rx.Observable.fromEvent(listView, 'click')
						.map(function(ev) { return ev.target; })
						.filter(function(el) { return el.name === 'timeformat-radio'; })
						.map(function(el) { return el.value; })
						.subscribe(function(value) {
							storage.settings.timeformat.set(value);
							history.back();
						});
				});
			});
	});
} () );
