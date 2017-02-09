/*global tau */
/*jslint unparam: true */
(function(tau) {
	/**
	 * page - Active page element
	 * list - NodeList object for lists in the page
	 * listHelper - Array for TAU snap list helper instances
	 */
	var page,
		list,
		listHelper = [],
		i, len;

	// This logic works only on circular device.
	if (tau.support.shape.circle) {
		/**
		 * pagebeforeshow event handler
		 * Do preparatory works and adds event listeners
		 */
		document.addEventListener("pagebeforeshow", function (e) {
			page = e.target;
			//console.log('pagebeforeshow; page.id=' + page.id);
			
			list = page.querySelectorAll(".ui-listview.circle-helper-snap-list");
			if (list) {
				len = list.length;
				for (i = 0; i < len; i++) {
					listHelper.push(tau.helper.SnapListStyle.create(list[i], {animate: "scale"}));
				}
			}
			
			var maraqueeList = page.querySelectorAll(".ui-listview.circle-helper-snap-list-marquee");
			if (maraqueeList.length > 0) {
				for (i=0; i<maraqueeList.length; ++i) {
					var element = maraqueeList[i];
					
					listHelper.push(tau.helper.SnapListMarqueeStyle.create(element, {
						marqueeDelay: 1000,
						marqueeStyle: "endToEnd"
					}));
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
					
			listHelper.forEach(function(element) {
				element.destroy();
			});
			listHelper.length = 0; //clear array
		});
	}
}(tau));
