window.onload = function() {
	var mainScreen;
	
	//run for first time when widget is added to a widget board
	handleVisibilityChange();
	
	function handleVisibilityChange() {
		var currentMapImagePath;
		
		console.log('visibility: ' + document.visibilityState);
		if(document.visibilityState === 'visible') {
			mainScreen = document.getElementById('main-screen');
			if (mainScreen) {
				mainScreen.addEventListener('click', launchApp);
				
				if (tizen.preference.exists('current_map_image_path')) {
					currentMapImagePath = tizen.preference.getValue('current_map_image_path');
					console.log('currentMapImagePath = ' + currentMapImagePath);
					mainScreen.style['background-image'] = 'url("' + currentMapImagePath + '")';
				}
				
			} else {
				console.warn('main screen not found');
			}
		} else {
			mainScreen.removeEventListener('click', launchApp);
			mainScreen = null;
		}
	}
	
	function launchApp() {
		var app = window.tizen.application.getCurrentApplication();
		var appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );
		var appControl = new window.tizen.ApplicationControl('navigate', 'radar', null, null, null, null);
		window.tizen.application.launchAppControl(appControl, appId,
			function() {
				console.log("application has been launched successfully");
			},
			function(e) {
				console.error("application launch has been failed. reason: " + e.message);
			},
			null);
	}
	
	document.addEventListener('visibilitychange', handleVisibilityChange);
};