/*global tau */
/*jslint unparam: true */
(function(tau) {
	var visibleWidgetArr = [];
	
	/*
	 * Factory function takes one parameter: element.
	 * Return value may be single widget or array of widgets. When current page is closed all returned widgets will
	 * 	receive "destory()" member call.
	 */
	const snapListTypeToFactoryMapping = {
		'circle-helper-snap-list': function(element) {
			const result = [];
			
			modifyElements(element, '.ui-marquee', function(marqueeElement) {
				result.push(tau.widget.Marquee(marqueeElement, {marqueeStyle: "endToEnd", delay: "1000"}));
			});
			
			result.push(tau.helper.SnapListStyle.create(element, {animate: "scale"}));
			return result;
		},
		
//		'circle-helper-snap-list-marquee': function(element) {
//			return tau.helper.SnapListMarqueeStyle.create(element, {
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
			//console.log('pagebeforeshow; page.id=' + page.id);
			
			const snapListNodeList = page.querySelectorAll(".ui-listview[class*=circle-helper-snap-list]");
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
							const widgetArr = Array.isArray(widget) ? widget : [widget]; 
							
							visibleWidgetArr = visibleWidgetArr.concat(widgetArr);
						}
						
						return classRecognized;
					});
				
				if (!factoryForSnapListFound) {
					console.warn('Snap list factory not found for element with classList="' + classList + '", ' +
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
			//console.log('pagebeforehide; page.id=' + page.id);
					
			visibleWidgetArr.forEach(function(widget) {
				widget.destroy();
			});
			visibleWidgetArr.length = 0; //clear array
		});
	}
}(tau));
