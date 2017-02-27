///*global tau */
///*jslint unparam: true */
//(function(tau) {
//	var visibleWidgetArr = [];
//	
//	/*
//	 * Factory function takes one parameter: list.
//	 * Return value may be single widget or array of widgets. When current page is closed all returned widgets will
//	 * 	receive "destory()" member call.
//	 */
//	const snapListTypeToFactoryMapping = {
//		'circle-helper-snap-list': function(list) {			
//			var activeMarqueeWidget = null;
//			
//			const destroyActiveMarqueeWidgetIfNeeded = function() {
//				if (activeMarqueeWidget) {
//					activeMarqueeWidget.stop();
//					activeMarqueeWidget.destroy();
//					activeMarqueeWidget = null;
//				}
//			};
//			
//			const selectedEventListener = function(ev) {
//				const marqueeElement = ev.target.querySelector('.ui-marquee');
//				if (marqueeElement) {
//					destroyActiveMarqueeWidgetIfNeeded();
//
//					activeMarqueeWidget =
//						tau.widget.Marquee(marqueeElement, {marqueeStyle: 'endToEnd', delay: '1000'});
//				}
//			};
//			
//			const scrollStartEventListener = function() {
//				destroyActiveMarqueeWidgetIfNeeded();
//			};
//
//			list.addEventListener('selected', selectedEventListener);
//
//			list.addEventListener('scrollstart', scrollStartEventListener);
//			
//			const snapListStyleWidget = tau.helper.SnapListStyle.create(list, {animate: "scale"}); 
//			
//			//Focus on checked element
//			tryModifyElement(
//				list,
//				'input:checked[value]',
//				function(el) {
//					snapListStyleWidget.getSnapList().scrollToPosition(el.value - 1);					
//				}
//			);
//			
//			return {
//				destroy: function() {
//					
//					list.removeEventListener('selected', selectedEventListener);
//
//					list.removeEventListener('scrollstart', scrollStartEventListener);
//					
//					destroyActiveMarqueeWidgetIfNeeded();
//					snapListStyleWidget.destroy();
//				}
//			};
//		},
//		
////		Example of factory usage with different class:
////		'circle-helper-snap-list-marquee': function(list) {
////			return tau.helper.SnapListMarqueeStyle.create(list, {
////				marqueeDelay: 1000,
////				marqueeStyle: "endToEnd"
////			});
////		},
////		
//////		Example of factory usage with different class:
//////		'circle-helper-snap-list-marquee': function(list) {
//////			return tau.helper.SnapListMarqueeStyle.create(list, {
//////				marqueeDelay: 1000,
//////				marqueeStyle: "endToEnd"
//////			});
//////			visibleWidgetArr.length = 0; //clear array
//////		});
//////	}
//////}(tau));