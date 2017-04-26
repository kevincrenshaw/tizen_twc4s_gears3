/* jshint esversion: 6 */
define(['utils/utils', 'utils/const'], function(utils, consts) {
	//Remember widget object to destory it on leaving page (if not bezel may stop working)
	var selectorWidget;
	var popupHeader;
	var popup;
	
	const selectorClickHandler = function() {
		if (!selector) {
			console.warn('setupMainMenu::selectorClickHandler: no selector element');
			return;
		}
		
		const activeItem = selector.querySelector('.ui-item-active');
		if (!activeItem) {
			console.warn('setupMainMenu::selectorClickHandler: no selector ".ui-item-active" element');
			return;
		}
		
		console.log('setupMainMenu::selectorClickHandler: handle menu item selection; activeItem.id="' + activeItem.id + '"');
		switch(activeItem.id) {
		case 'settings':
			tau.changePage("html/settings.html", { transition:'none' });
			break;

		case 'radar':
			tau.changePage("html/radar.html", { transition:'none' });
			break;

		case 'weather':
			utils.openDeepLinkOnPhone(consts.RADAR_DEEPLINK);
			break;

		case 'alerts':
			tau.changePage("html/alerts.html", { transition:'none' });
			break;

		default:
			console.warn('setupMainMenu::selectorClickHandler: missing menu element');
		}
	};

	const setDataTitleAttributeValue = function(root, selector, value) {
		const element = root.querySelector(selector);
		
		if (!element) {
			console.warn('setupMainMenu::setDataTitleAttributeValue: no element for selector "' + selector + '"');
			return false;
		}
		
		element.setAttribute('data-title', value);
		return true;
	};
	
	const popupCancelButtonClickHandler = function() {
		tau.closePopup();
	};
	
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			if (!page) {
				console.warn('setupMainMenu: root element "main" not found"');
				return;
			}
			
			const selector = page.querySelector('#selector');
			if (!selector) {
				console.warn('setupMainMenu: page element "#selector" not found"');
				return;
			}

			setDataTitleAttributeValue(selector, '#radar',    TIZEN_L10N.MAIN_MENU_RADAR);
			setDataTitleAttributeValue(selector, '#weather',  TIZEN_L10N.MAIN_MENU_WEATHER);
			setDataTitleAttributeValue(selector, '#alerts',   TIZEN_L10N.MAIN_MENU_ALERTS);
			setDataTitleAttributeValue(selector, '#settings', TIZEN_L10N.MAIN_MENU_SETTINGS);
			
			selector.style.visibility = 'visible';

			popup = page.querySelector('#selector-value-popup');
			if (!popup) {
				console.warn('setupMainMenu: page element "#selector-value-popup" not found"');
				return;
			}

			popupHeader = popup.querySelector('#header');
			if (!popupHeader) {
				console.warn('setupMainMenu: popup element "#header" not found"');
				return;
			}
			
			const selectorOptions = {
				itemStartDegree: 0,
				continousRotation: true,
				itemRadius: 126,
				itemNormalScale: "scale(0.791666667)",
			};
			
			selectorWidget = tau.widget.Selector(selector, selectorOptions);
			if (selector) {
				selector.addEventListener('click', selectorClickHandler, false);
			}
		},
		
		pagebeforehide: function(ev) {
			if (selector) {
				selector.removeEventListener('click', selectorClickHandler, false);
			}
			
			if (selectorWidget) {
				selectorWidget.destroy();
				selectorWidget = null;
			}
		},
	};
});