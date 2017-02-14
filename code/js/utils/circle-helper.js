/*global tau */
/*jslint unparam: true */
(function(tau) {
	var visibleWidgetArr = [];
	
	/*
	 * Factory function takes one parameter: list.
	 * Return value may be single widget or array of widgets. When current page is closed all returned widgets will
	 * 	receive "destory()" member call.
	 */
	const snapListTypeToFactoryMapping = {
		'circle-helper-snap-list': function(list) {			
			var activeMarqueeWidget = null;
			
			const destroyActiveMarqueeWidgetIfNeeded = function() {
				if (activeMarqueeWidget) {
					activeMarqueeWidget.stop();
					activeMarqueeWidget.destroy();
					activeMarqueeWidget = null;
				}
			};

			list.addEventListener('selected', function(ev) {
				const marqueeElement = ev.target.querySelector('.ui-marquee');
				if (marqueeElement) {
					destroyActiveMarqueeWidgetIfNeeded();

					activeMarqueeWidget =
						tau.widget.Marquee(marqueeElement, {marqueeStyle: 'endToEnd', delay: '1000'});
				}
			});

			list.addEventListener('scrollstart', function() {
				destroyActiveMarqueeWidgetIfNeeded();
			});
			
			const snapListStyleWidget = tau.helper.SnapListStyle.create(list, {animate: "scale"}); 
			
			return {
				destroy: function() {
					destroyActiveMarqueeWidgetIfNeeded();
					snapListStyleWidget.destroy();
				}
			};
		},
		
//		Example of factory usage with different class:
//		'circle-helper-snap-list-marquee': function(list) {
//			return tau.helper.SnapListMarqueeStyle.create(list, {
//				marqueeDelay: 1000,
//				marqueeStyle: "endToEnd"
//			});
//		},
	};

	// This logic works only on circular device.
	if (tau.support.shape.circle) {
		/**
		 * pagebeforeshow event handler
		 * Do preparatory works and adds event listeners
		 */
		document.addEventListener("pagebeforeshow", function (e) {
			page = e.target;
			
			const selector = '.ui-listview[class*=circle-helper-snap-list]';
			const snapListNodeList = page.querySelectorAll(selector);
			const snapListNodeListLen = snapListNodeList.length;
			
			for (var i=0; i<snapListNodeListLen; ++i) {
				var element = snapListNodeList[i];
				var classList = element.classList;
				
				var factoryForSnapListFound =
					Object.keys(snapListTypeToFactoryMapping).some(function(snapListType) {
						const classRecognized = classList.contains(snapListType);
						
						if (classRecognized) {
							const widgetFactory = snapListTypeToFactoryMapping[snapListType];
							
							const widget = widgetFactory(element); 
							
							if (widget) {
								visibleWidgetArr.push(widget);
							}
						}
						
						return classRecognized;
					});
				
				if (!factoryForSnapListFound) {
					console.warn('Snap list factory not found for selector "' + selector + '" with classList="' + classList + '", ' +
							'registered factories for classes: ' +
							Object.keys(snapListTypeToFactoryMapping).map(function(text) {
								return '"' + text + '"' }
							).join(','));
				}
			}
		});

		/**
		 * pagebeforehide event handler
		 * Destroys and removes event listeners
		 */
		document.addEventListener("pagebeforehide", function (e) {
			page = e.target;
					
			visibleWidgetArr.forEach(function(widget) {
				widget.destroy();
			});
			visibleWidgetArr.length = 0; //clear array
		});
	}
}(tau));