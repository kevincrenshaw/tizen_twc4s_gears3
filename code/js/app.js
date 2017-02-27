/* jshint esversion: 6 */
( function () {
	
	const setupMainMenu = function(root) {
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
				tau.changePage("html/settings.html");
				break;
				
			case 'radar':
				tau.changePage("html/radar.html");
				break;
				
			case 'weather':
				tau.changePage("html/weather.html");
				break;
				
			default:
				//By default show popup with localized option title
				
				const dataTitleAttribute = activeItem.attributes.getNamedItem('data-title');
				if (!dataTitleAttribute) {
					console.warn('setupMainMenu::selectorClickHandler: missing "data-title" attribute');
					return;
				}
				
				const activeItemDataTitleValue = dataTitleAttribute.value;
				if (!activeItemDataTitleValue) {
					console.warn('setupMainMenu::selectorClickHandler: missing activeItemDataTitleValue');
					return;
				}
				
				console.log('setupMainMenu::selectorClickHandler: default item handler, activeItem={id="' + activeItem.id + '", data-title="' + activeItemDataTitleValue +  '"}');
				
				if (!popupHeader) {
					console.warn('setupMainMenu::selectorClickHandler: missing popupHeader');
					return;
				}
				
				popupHeader.innerHTML = activeItemDataTitleValue;
				tau.openPopup(popup);
			}
		};
		
		const page = root.getElementById("main");
		if (!page) {
			console.warn('setupMainMenu: root element "main" not found"');
			return;
		}
		
		const selector = page.querySelector('#selector');
		if (!selector) {
			console.warn('setupMainMenu: page element "#selector" not found"');
			return;
		}
		
		const setDataTitleAttributeValue = function(root, selector, value) {
			const element = root.querySelector(selector);
			
			if (!element) {
				console.warn('setupMainMenu::setDataTitleAttributeValue: no element for selector "' + selector + '"');
				return false;
			}
			
			element.setAttribute('data-title', value);
			return true;
		};
		
		setDataTitleAttributeValue(selector, '#radar',    TIZEN_L10N.MAIN_MENU_RADAR);
		setDataTitleAttributeValue(selector, '#weather',  TIZEN_L10N.MAIN_MENU_WEATHER);
		setDataTitleAttributeValue(selector, '#compass',  TIZEN_L10N.MAIN_MENU_COMPASS);
		setDataTitleAttributeValue(selector, '#alerts',   TIZEN_L10N.MAIN_MENU_ALERTS);
		setDataTitleAttributeValue(selector, '#settings', TIZEN_L10N.MAIN_MENU_SETTINGS);
		
		const popup = page.querySelector('#selector-value-popup');
		if (!popup) {
			console.warn('setupMainMenu: page element "#selector-value-popup" not found"');
			return;
		}
		
		const popupCancelBtn = popup.querySelector('#cancel');
		if (!popupCancelBtn) {
			console.warn('setupMainMenu: popup element "#cancel" not found"');
			return;
		}
		
		const popupCancelButtonClickHandler = function() {
			tau.closePopup();
		};
		
		popupCancelBtn.addEventListener('click', popupCancelButtonClickHandler);
		
		const popupHeader = popup.querySelector('#header');
		if (!popupHeader) {
			console.warn('setupMainMenu: popup element "#header" not found"');
			return;
		}
		
		//Remember widget object to destory it on leaving page (if not bezel may stop working)
		var selectorWidget;
		
		page.addEventListener('pagebeforeshow', function() {
			selectorWidget = tau.widget.Selector(selector);
			
			if (selector) {
				selector.addEventListener('click', selectorClickHandler, false);
			}
		});
		
		page.addEventListener('pagebeforehide', function() {
			if (selector) {
				selector.removeEventListener('click', selectorClickHandler, false);
			}
			
			if (selectorWidget) {
				selectorWidget.destroy();
				selectorWidget = null;
			}
			
			if (popupCancelBtn) {
				popupCancelBtn.removeEventListener(popupCancelButtonClickHandler);
			}
		});
	};
	
	setupMainMenu(document);
} () );
