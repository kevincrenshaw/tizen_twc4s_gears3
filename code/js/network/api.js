/* jshint esversion: 6 */
(function() {
	
	const getResourcesByURL = function(urls, observer, options) {

		options = options || {};

		const timeout = options.timeout || 30000;
		const delay = options.delay || 5000;
		
		var requestedStream = Rx.Observable
			.from(urls)
			.delay(new Date(Date.now() + delay));

		var response = requestedStream.flatMap(function(requestedUrl) {
			return Rx.Observable
				.fromPromise($.get(requestedUrl))
				.timeout(timeout);
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
				console.log("API call error: " + err.status);
			}, 
			 function() {
				console.log("API calls completed");
			}
		);
	
	getResourcesByURL(urls, observer, { timeout: 10000, delay: 2000});
}());
