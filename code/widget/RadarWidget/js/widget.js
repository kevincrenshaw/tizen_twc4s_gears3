window.onload = function() {
	var intervalUpdaterId = null;

	var currentTimeRepr = {};
	var snapshotTimeRepr = {};
	
	var ampm = '';
	
	var ui = null;
	
	//run for first time when widget is added to a widget board
	handleVisibilityChange();
	
	/**
	 * triggered on page visible state 
	 * */
	function onpageshow() {
		console.log('on page show');
		ui = createUi(document);
		
		ui.map.addEventListener('click', launchApp);
		
		if(tizen.preference.exists('time_ampm')) {
			ampm = tizen.preference.getValue('time_ampm');
		}
		
		if(tizen.preference.exists('snapshot_time')) {
			snapshotTimeRepr[0] = tizen.preference.getValue('snapshot_time');
			snapshotTimeRepr[1] = ampm;
		}
		onUpdate();
	}
	
	/**
	 * triggered on page hidden state 
	 * */
	function onpagehide() {
		console.log('on page hide');
		if(ui) {
			ui.map.removeEventListener('click', launchApp);
			ui.map = null;
		}
	}
	
	function onUpdateUi() {
		if(ui) {
			//if we have data to show
			if(snapshotTimeRepr[0] && currentTimeRepr[0]) {
				if(ui.header.style.display !== 'inline') {
					//show header if it was hidden
					ui.header.style.display = 'inline';
				}
				//if header is visible and we have data to show
				if(ui.header.style.display === 'inline') {
					ui.currentTime.time.textContent = currentTimeRepr[0];
					ui.currentTime.ampm.textContent = currentTimeRepr[1];
					
					ui.temperature.snapshotTime.textContent = snapshotTimeRepr[0];
					ui.temperature.ampm.textContent = snapshotTimeRepr[1];
				}
			}
		}
	}
	
	
	/**
	 * function for periodic tasks (like updating ui, etc)
	 * */
	function onUpdate() {
		var time = getTimeAsText(new Date(), ampm !== '');
		if(currentTimeRepr[0] !== time[0] || currentTimeRepr[1] !== time[1]) {
			currentTimeRepr = time;
		}
		onUpdateUi();
	}

	/**
	 * internal function to handle visibility state changes 
	 * */
	function handleVisibilityChange() {
		if(document.visibilityState === 'visible') {
			onpageshow();
			if(intervalUpdaterId === null) {
				intervalUpdaterId = setInterval(onUpdate, 1000);
			}
		} else {
			onpagehide();
			
			if(intervalUpdaterId) {
				clearInterval(intervalUpdaterId);
                intervalUpdaterId = null;
			}
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
	
	function createUi(root) {
		var element = {
			header: root.getElementById('header'),
			map: root.getElementById('main-screen'),
			
			currentTime : {
				time: root.getElementById('time-value'),
				ampm: root.getElementById('time-ampm'),
			},
			
			temperature: {
				value: root.getElementById('value'),
				unit: root.getElementById('unit'),
				at: root.getElementById('at'),
				snapshotTime: root.getElementById('snapshot-time'),
				ampm: root.getElementById('ampm'),
			},
		};
		
		return element;
	}
	
	document.addEventListener('visibilitychange', handleVisibilityChange);
};