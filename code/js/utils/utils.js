/* jshint esversion: 6 */

define(['rx', 'utils/const'], function(Rx, consts) {
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
	
	const celsiusToFahrenheit = function(value) {
		return value * 9.0 / 5.0 + 32;
	};
	
	const getNowAsEpochInMiliseconds = function() {
		return (new Date()).getTime();
	};
	
	const getNowAsEpochInSeconds = function() {
		return Math.floor((getNowAsEpochInMiliseconds() / 1000));
	};
	
	/*
	 * Converts time difference to category according to task TWCGS3-67
	 * 
	 * Params:
	 * 		diffInSecconds - difference between two points in time (in seconds)
	 * 
	 * Result:
	 * 		returns 1 if diffInSeconds < 60s
	 * 		returns 2 if 60s <= diffInSeconds < 1h
	 *		returns 3 if 1h <= diffInSeconds < 24h=1day
	 *		returns 4 if 1day <= diffInSeconds < 2days
	 *		returns 5 if 2days <= diffInSeconds
	 */
	const getCategoryForTimeDiff = function(diffInSeconds) {
		if (diffInSeconds < 60) {
			return 1;
		} else {
			const minutes = Math.floor(diffInSeconds / 60);
	
			if (minutes < 60) {
				return 2;
			} else {
				const hours = Math.floor(minutes / 60);
	
				if (hours < 24) {
					return 3;
				} else {
					const days = Math.floor(hours / 24);
					return days < 2 ? 4 : 5;
				}
			}
		}
	};
	
	/*
	 * Format time diff for given category
	 * Parameters:
	 * 		diffInSecconds - difference between two points in time (in seconds)
	 * 		category - category returned by getCategoryForTimeDiff
	 * 
	 * Result:
	 * 		Returns time diff for given category. For example if category is 1 then it will return number of seconds
	 * 		less than 60. If category is 2 then will return full minutes. For category 3 return full hours, etc.
	 */
	const formatTimeDiffValue = function(diffInSeconds, category) {
		switch(category) {
		//seconds
		case 1: return diffInSeconds % 60;
		//minutes
		case 2: return Math.floor(diffInSeconds / 60);
		//hours
		case 3: return Math.floor(diffInSeconds / (60 * 60));
		//days
		default: return Math.floor(diffInSeconds / (60 * 60 * 24));
		}
	};

	/**
	 * convert date object to a text representation
	 * Params:
	 * 		date - date object
	 * 		currentTimeUnitSetting - used time unit setting, can be SYSTEM, TIME_12H 
	 * 									or TIME_24H (see consts.settings.units.time section)
	 * 		isSystemUses12hFormat - indicates if system setting uses 12h format
	 * 
	 * Returns:
	 * 		object-array with:
	 * 		first element - 'HH:mm' formatted time
	 * 		second element - 'AM' or 'PM' text for currentTimeUnitSetting === TIME_12H (or system time settings is set to 12h),
	 * 						 otherwise empty (not null)
	 * */
	const getTimeAsText = function(date, currentTimeUnitSetting, isSystemUses12hFormat) {
		const timeUnitSetting = parseInt(currentTimeUnitSetting);
		var isAmPmEnabled = false;
		switch(timeUnitSetting) {
			case consts.settings.units.time.SYSTEM:
				isAmPmEnabled = isSystemUses12hFormat;
			break;
			
			case consts.settings.units.time.TIME_12H:
				isAmPmEnabled = true;
				break;
		}

		var hours = date.getHours();
	    var minutes = date.getMinutes();
	    var ampm = '';
	    
	    if(isAmPmEnabled) {
	    	ampm = hours >= 12 ? ' PM' : ' AM';
	        hours = hours % 12;
	        //0 hour should be printed as 12
	        hours = hours ? hours : 12;
	    }
	    minutes = minutes < 10 ? '0' + minutes : minutes;

	    return [hours + ':' + minutes, ampm];
	};

	const getDateAndTimeAsText = function(dateTimeData, currentTimeUnitSetting, isSystemUses12hFormat) {
		const timeRepr = getTimeAsText(dateTimeData, currentTimeUnitSetting, isSystemUses12hFormat);
		const date = dateTimeData.getDate() + '.' + dateTimeData.getMonth() + 1 + '.' + dateTimeData.getFullYear();
		return date + ' @ ' + timeRepr[0] + timeRepr[1];
	};

	const getAppControl = function() {
		const app = window.tizen.application.getCurrentApplication();
		return app.getRequestedAppControl().appControl;
	};

	/**
	 * Construct url from base url part and params
	 * Params:
	 * 		base - base part of url
	 * 		params - object of params
	 * 
	 * Returns:
	 * 		full url as a string
	 * */
	const createUri = function(base, params) {
		params = params || {};
		const paramsArr = [];
		
		Object.keys(params).forEach(function(key) {
			paramsArr.push([key, params[key]].join('='));
		});
		
		return base + (paramsArr.length > 0 ? '?' + paramsArr.join('&') : '');
	};

	/**
	 * Get current position
	 * */
	const getCurrentPositionRx = function(timeout) {
		return Rx.Observable.create(function(observer) {
			const onSuccess = function(pos) {
				observer.onNext(pos);
				observer.onCompleted();
			};

			//Seems navigator.geolocation.getCurrentPosition replaces "this" for 2nd parameter. observer.onError relay
			//on "this" so it throws when "this" is replaced. Use wrapper to avoid this.
			const onError = function(err) {
				observer.onError(err);
			};

			//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
			//1: 'PERMISSION_DENIED',
			//2: 'POSITION_UNAVAILABLE',
			//3: 'TIMEOUT',
			navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: timeout });
		});
	};

	/**
	 * Converts json text to an object
	 * */
	const convertTextToObjectOrUndefined = function(text) {
		if (text) {
			try {
				return JSON.parse(text);
			} catch (err) {
				console.error('Failed to convert text into object: ' + JSON.stringify(err));
			}
		}
		return undefined;
	};

	return {
		tryModifyElement: tryModifyElement,
		modifyElement: modifyElement,
		modifyInnerHtml: modifyInnerHtml,
		modifySrc: modifySrc,
		setupSettingPageWithRadioButtons: setupSettingPageWithRadioButtons,
		guid: guid,
		celsiusToFahrenheit: celsiusToFahrenheit,
		getTimeAsText: getTimeAsText,
		getDateAndTimeAsText: getDateAndTimeAsText,
		getNowAsEpochInMiliseconds: getNowAsEpochInMiliseconds,
		getNowAsEpochInSeconds: getNowAsEpochInSeconds,
		getCategoryForTimeDiff: getCategoryForTimeDiff,
		formatTimeDiffValue: formatTimeDiffValue,
		getAppControl: getAppControl,
		createUri: createUri,
		getCurrentPositionRx: getCurrentPositionRx,
		convertTextToObjectOrUndefined: convertTextToObjectOrUndefined,
	};
});