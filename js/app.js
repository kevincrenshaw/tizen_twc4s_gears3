( function () {
	window.addEventListener( 'tizenhwkey', function( ev ) {
		if( ev.keyName === "back" ) {
			var page = document.getElementsByClassName( 'ui-page-active' )[0],
				pageid = page ? page.id : "";
			if( pageid === "main" ) {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	} );
	
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
			
			const dataTitleAttribute = activeItem.attributes.getNamedItem('data-title');
			if (!dataTitleAttribute) {
				console.warn('setupMainMenu::selectorClickHandler: missing "data-title" attribute');
				return;
			}
			
			const activeItemValue = dataTitleAttribute.value;
			if (!activeItemValue) {
				console.warn('setupMainMenu::selectorClickHandler: missing activeItemValue');
				return;
			}
			
			if (!popupHeader) {
				console.warn('setupMainMenu::selectorClickHandler: missing popupHeader');
				return;
			}
			
			console.log('activeItemValue=' + activeItemValue);
			
			popupHeader.innerHTML = activeItemValue;
			tau.openPopup(popup);
		};
		
		const popupCancelButtonClickHandler = function() {
			tau.closePopup();
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
		
		popupCancelBtn.addEventListener('click', popupCancelButtonClickHandler);
		
		const popupHeader = popup.querySelector('#header');
		if (!popupHeader) {
			console.warn('setupMainMenu: popup element "#header" not found"');
			return;
		}
		
		page.addEventListener('pagebeforeshow', function() {
			tau.widget.Selector(selector);
			
			if (selector) {
				selector.addEventListener('click', selectorClickHandler, false);
			}
		});
		
		page.addEventListener('pagebeforehide', function() {
			if (selector) {
				selector.removeEventListener('click', selectorClickHandler, false);
			}
			
			if (popupCancelBtn) {
				popupCancelBtn.removeEventListener(popupCancelButtonClickHandler);
			}
		});
	};
	
	setupMainMenu(document);
} () );
