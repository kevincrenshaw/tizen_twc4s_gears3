window.onload = function() {
	var startButton = null;
	
	//run for first time when widget is added to a widget board
	handleVisibilityChange();
	
	function handleVisibilityChange() {
		if(document.visibilityState === 'visible') {
			startButton = document.getElementById('main-screen');
			startButton.addEventListener('click', launchApp);
		} else if(startButton) {
			startButton.removeEventListener('click', launchApp);
			startButton = null;
		}
	}
	
	function launchApp() {
        var app = window.tizen.application.getCurrentApplication();
        var appId = app.appInfo.id.substring(0, (app.appInfo.id.lastIndexOf('.')) );
        var appControl = new window.tizen.ApplicationControl('', null, null, null, null, null);
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