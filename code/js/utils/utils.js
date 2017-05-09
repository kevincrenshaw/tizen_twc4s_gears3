/* jshint esversion: 6 */

define(['rx', 'utils/const'], function(Rx, consts) {
	/*
	 * Converts temperature into textual representation.
	 * Parameters:
	 *		celsiusTemp - current temperature in Celsius
	 *		unit - current temperature unit setting, for instance value returned by:
	 *			storage.settings.units.temperature.get()
	 *
	 * Result:
	 * 		Return array of two elements. First one is temperature converted to Celsius/Fahrenheit units. Second is
	 * 		textual representation of temperature unit.
	 */
	const getTemperatureAndUnitAsText = function(celsiusTemp, unit) {
		switch (parseInt(unit, 10)) {
			case consts.settings.units.temperature.SYSTEM:
				console.warn('temperature system setting not supported yet, falling back to Celsius');
				/* falls through */
			case consts.settings.units.temperature.CELSIUS:
				return [celsiusTemp, 'C'];
				
			case consts.settings.units.temperature.FAHRENHEIT:
				return [Math.round(celsiusToFahrenheit(celsiusTemp)), 'F'];
				
			default:
				console.warn('unexpected temperature setting value "' + unit + '"');
		}
	};

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
		const date = [dateTimeData.getDate(), '.', parseInt(dateTimeData.getMonth()) + 1, '.', dateTimeData.getFullYear()].join('');
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

	const openDeepLinkOnPhone = function(url) {

		const appid = 'com.samsung.w-manager-service';

		const extras = [
			 new tizen.ApplicationControlData('type', ['phone']),
			 new tizen.ApplicationControlData('deeplink', [url])
			 ];

		const appControl = new tizen.ApplicationControl(
				'http://tizen.org/appcontrol/operation/default',
				null,
				null,
				null,
				extras);

		const openDeeplinkResult = {
				onsuccess : function() {},
				onfailure : function() {
					console.error('openDeepLinkOnPhone::cant open deeplink');
				}
			};

		try {
			tizen.application.launchAppControl(
					appControl,
					appid,
					null,
					null,
					openDeeplinkResult);
			} catch(err) {
				console.error('openDeepLinkOnPhone::cant to open deep link, error: ' + err);
			}
	};

	/**
	 * saves flag of used time format
	 * Params:
	 * 		savedTimeUnitSetting saved time unit (use: storage.settings.units.time)
	 * 		ampmStorageProvider storage provider which should save ampm format (use: storage::createSimpleStorage typed object)
	 * 
	 * Returns:
	 * 		nothing
	 * */
	const saveIfSystemUsesAMPMTimeFormat = function(savedTimeUnitSetting, ampmStorageProvider) {
		//"system" time option
		if(savedTimeUnitSetting == consts.settings.units.time.SYSTEM) {
			ampmStorageProvider.set(tizen.time.getTimeFormat() === 'h:m:s ap');
		} else {
			//'2' - 12h time option(am/pm - true), '3' - 24h time option (am/pm - false)
			ampmStorageProvider.set(savedTimeUnitSetting == consts.settings.units.time.TIME_12H);
		}
	};

	/**
	 * Creates marquee widget from DOM html element
	 * */
	const createMarqueWidget = function(element, options) {
		options = options || {};

		options.marqueeStyle = options.marqueeStyle || 'endToEnd';
		options.delay = options.delay || '1000';

		return new tau.widget.Marquee(element, options);
	};

	const createAlertDetailsText = function(startsAtUTCSeconds, endAtUTCSeconds, timeFormatSetting) {
		const systemUses12hFormat = tizen.time.getTimeFormat() === 'h:m:s ap';

		const startsAt = getDateAndTimeAsText(new Date(startsAtUTCSeconds * 1000), timeFormatSetting, systemUses12hFormat);
		const endsAt = getDateAndTimeAsText(new Date(endAtUTCSeconds * 1000), timeFormatSetting, systemUses12hFormat);

		return ['starts:', startsAt, 'ends:', endsAt].join(' ');
	};

	const createAlertsListItem = function(alertData, timeFormatSetting) {
		const createDivElement = function(divId, innerHtml, className) {
			var element = document.createElement('div');
			element.id = divId;
			if(innerHtml) {
				element.innerHTML = innerHtml;
			}
			if(className) {
				element.className = className;
			}
			return element;
		};

		var titleDiv = createDivElement('text_title', alertData.eventDescription, 'list-item-title');

		const details = createAlertDetailsText(alertData.processTimeUTC, alertData.expireTimeUTC, timeFormatSetting);
		var subtitleDiv = createDivElement('text_subtitle', details, 'list-item-subtitle');

		var iconDiv = createDivElement('alert_icon');
		iconDiv.classList.add("img-icon", "warning-icon", "ui-li-thumb-left");

		var listItem = document.createElement('li');
		listItem.classList.add("li-has-thumb-left", "li-has-2line");
		listItem.id = "alerts_list_item";

		var textBlockDiv = createDivElement('text_block', null, 'ui-marquee');
		textBlockDiv.appendChild(titleDiv);
		textBlockDiv.appendChild(subtitleDiv);

		listItem.appendChild(textBlockDiv);
		listItem.appendChild(iconDiv);
		return listItem;
	};

	//Creates object that manages array of destroyables.
	const createDestroyableManager = function() {
		const destroyableArr = [];

		return {
			add: function(destroyable) {
				destroyableArr.push(destroyable);
			},

			destroy: function() {
				//Destroy in reverse order
				for (var i=destroyableArr.length-1; i>=0; --i) {
					if(destroyableArr[i].hasOwnProperty('name')) {
						console.log('destroying object: ' + destroyableArr[i].name);
					}
					destroyableArr[i].destroy();
					destroyableArr[i] = null;
				}
				destroyableArr.length = 0; //clear array
			},
		};
	};

	const createMarqueeWidgetManager = function() {
		var activeMarqueeWidget;

		return {
			set: function(widget) {
				this.destroy();
				activeMarqueeWidget = widget;
			},
			
			destroy: function() {
				if (activeMarqueeWidget) {
					activeMarqueeWidget.stop();
					activeMarqueeWidget.destroy();
					activeMarqueeWidget = null;
				}
			},
		};
	};

	///
	const updateSnapListWithMarqueeWidgets = function(page, destroyablesManager, activeMaruqeeWidgetManager) {

		const createMarqueeWidgetForListElement = function(element) {
			if (element) {
				activeMaruqeeWidgetManager.destroy();
				activeMaruqeeWidgetManager.set(createMarqueWidget(element));
			}
		};

		const listItemSelectedEventListener = function(ev) {
			const page = ev.target;
			createMarqueeWidgetForListElement(page.querySelector('.ui-marquee'));
		};

		const listItemScrollStartEventListener = function() {
			activeMaruqeeWidgetManager.destroy();
		};

		const scrollToSelectedPosition = function(el) {
			snapListStyleWidget.getSnapList().scrollToPosition(el.value - 1);
		};

		//Find every circle helper on current page, create widget for 
		//it and save it for later destruction
		const snapListNodeList = page.querySelectorAll('.ui-listview.dynamic.circle-helper-snap-list');

		for(var i=0; i < snapListNodeList.length; ++i) {
			var listNode = snapListNodeList[i];
			var snapListStyleWidget = tau.helper.SnapListStyle.create(listNode, {animate: 'scale'});
			destroyablesManager.add(snapListStyleWidget);
			//Focus on checked element
			tryModifyElement(
					listNode,
					'input:checked[value]',
					scrollToSelectedPosition
			);
			
			//List item selected by default do not triggers 'selected' event so we need to create marquee manually.
			createMarqueeWidgetForListElement(listNode.querySelector('.ui-snap-listview-selected .ui-marquee'));

			listNode.addEventListener('selected', listItemSelectedEventListener);
			listNode.addEventListener('scrollstart', listItemScrollStartEventListener);

			destroyablesManager.add({
				destroy: function() {
					listNode.removeEventListener('selected', listItemSelectedEventListener);
					listNode.removeEventListener('scrollstart', listItemScrollStartEventListener);
					activeMaruqeeWidgetManager.destroy();
				},
			});
		}
	};

	const diffCategoryToLocalizationKey = {
		1: 'NOW',
		2: 'MINUTES_AGO',
		3: 'HOURS_AGO',
		4: 'DAY_AGO',
		5: 'DAYS_AGO',
	};

	const humanReadableTimeDiff = function(from, to) {
		const diff = from - to;
		const tier = getCategoryForTimeDiff(diff);
		const tierKey = diffCategoryToLocalizationKey[tier];

		if(!tierKey) {
			console.warn('Diff category "' + tier + '" cannot be mapped to localization key');
			return '';
		}

		const text = TIZEN_L10N[tierKey];
		if(!text) {
			console.warn('Key "' + tierKey + '" not available in localization');
			return '';
		}

		// TODO: fix that dirty hack
		// initially, before data is retrieved from server, last update time is uknown
		// the storage returns 0 though, so all calculations are correct,
		// but a strange value would be returnd, i.e. '123456 days ago'
		if(to === 0) {
			return '- ' + text;
		}

		if(tier === 1) {
			return text;
		}
		return formatTimeDiffValue(diff, tier) + ' ' + text;
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
		getTemperatureAndUnitAsText: getTemperatureAndUnitAsText,
		getDateAndTimeAsText: getDateAndTimeAsText,
		getNowAsEpochInMiliseconds: getNowAsEpochInMiliseconds,
		getNowAsEpochInSeconds: getNowAsEpochInSeconds,
		getCategoryForTimeDiff: getCategoryForTimeDiff,
		formatTimeDiffValue: formatTimeDiffValue,
		getAppControl: getAppControl,
		createUri: createUri,
		getCurrentPositionRx: getCurrentPositionRx,
		convertTextToObjectOrUndefined: convertTextToObjectOrUndefined,
		openDeepLinkOnPhone: openDeepLinkOnPhone,
		saveIfSystemUsesAMPMTimeFormat: saveIfSystemUsesAMPMTimeFormat,
		createMarqueWidget: createMarqueWidget,
		createAlertsListItem: createAlertsListItem,
		createDestroyableManager: createDestroyableManager,
		createMarqueeWidgetManager: createMarqueeWidgetManager,
		updateSnapListWithMarqueeWidgets: updateSnapListWithMarqueeWidgets,
		createAlertDetailsText: createAlertDetailsText,
	};
});
