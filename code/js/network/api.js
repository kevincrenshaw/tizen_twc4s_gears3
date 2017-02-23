//	var urls = [
//			'http://jsonplaceholder.typicode.com/posts/1',
//			'http://api.wunderground.com/api/abf91b89f554facf/conditions/q/CA/San_Francisco.json',
//			'http://jsonplaceholder.typicode.com/posts/3',
//			'https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg' ];

const getResourcesByURL = function(urls, observer, options) {

	console.log('getResourcesByURL, observer: ' + JSON.stringify(observer));

	options = options || {};
	
	if(!observer) {
		observer = Rx.Observer.create(
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
	}

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
