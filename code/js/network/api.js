/* jshint esversion: 6 */
(function() {

	// TODO be able to provide subscriber as a param not hardcoded in method
	const getResourcesByURL = function(urls, subscriber) {

		const fiveSecondsInMilis = 5000;
		
		var requestedStream = Rx.Observable
			.from(urls)
			.delay(new Date(Date.now() + fiveSecondsInMilis));

		var response = requestedStream.flatMap(function(requestedUrl) {
			return Rx.Observable.fromPromise($.get(requestedUrl));
		});

		// TODO implement timeout mechanism

		response.subscribe(function(item) {
			// alert("item" + item.body);
			console.log("API call success: " + item.body);
		}, function(err) {
			// alert("error " + err);
			console.log("API call error: " + err);
		}, function() {
			// alert("onAPICallCompleted");
			console.log("API call completed");
		});
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

	getResourcesByURL(urls, "");
}());