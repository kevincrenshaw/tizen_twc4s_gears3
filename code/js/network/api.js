/* jshint esversion: 6 */
(function() {

	const getResourcesByURL = function(urls, observer, options) {
		
		 if (options === undefined) { 
			 options = { timeout: 30000, delay: 5000};
		 }
		
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
			'https://jsonplaceholder.typicode.com/posts/1',
			'https://jsonplaceholder.typicode.com/posts/2',
			'https://jsonplaceholder.typicode.com/posts/3',
			'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg' ];

	var badUrls = [
			'https://jsonplaceholder.typicode.com/posts/1',
			'https://jsonplaceholder.typicode.com/posts/2',
			'https://jsonplaceholder.typicode.com/posts/3',
			'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg',
			'https://completny.bad.url.com/post/1' ];
	
	
	const observer = Rx.Observer.create(
			function(response) {
				console.log("API call success: " + response.body);
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