/* jshint esversion: 6 */
(function() {

	const checkRequestOptions = function(options) {
		const defaultTimeout = 30000;
		const defaultDelay = 5000;
		
		 if (options === undefined) { 
			 options = { timeout: defaultTimeout, delay: defaultDelay};
		 } else {
			 if(!options.hasOwnProperty('timeout')) { options.timeout = defaultTimeout; }
			 if(!options.hasOwnProperty('delay')) { options.delay = defaultDelay; }
		 }
		 return options;
	};
	
	const getResourcesByURL = function(urls, observer, options) {
		
		options = checkRequestOptions(options);
		
		var requestedStream = Rx.Observable
			.from(urls)
			.delay(new Date(Date.now() + options.delay));

		var response = requestedStream.flatMap(function(requestedUrl) {
			return Rx.Observable
				.fromPromise($.get(requestedUrl))
				.timeout(options.timeout);
		});

		response.subscribe(observer);
	};

	var urls = [
			'http://jsonplaceholder.typicode.com/posts/1',
			'http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json',
			'http://jsonplaceholder.typicode.com/posts/3',
			'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg' ];
	
	
	const observer = Rx.Observer.create(
			function(response) {
				console.log("API call success: " + JSON.stringify(response));
			}, 
			function(err) {
				console.log("API call error: " + err);
			}, 
			 function() {
				console.log("API calls completed");
			}
		);
	
	getResourcesByURL(urls, observer, { timeout: 10000, delay: 2000});
}());