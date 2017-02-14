/* jshint esversion: 6 */
( function () {
	
	const getResourcesByURL = function(url, subscriber) {
		
		var requestedStream = Rx.Observable.just(url);
		
		var response = requestedStream
			.flatMap(function(requestedUrl) {
				return Rx.Observable.fromPromise($.get(requestedUrl));
			});
		
		response.subscribe(
				function(item) {
					alert("item" + item.body);
					console.log(item); 
				},
				function(err) {
					alert("error"  + err);
					console.log(err); 
				},
				function() {
					alert("onCompleted");
					console.log("complete"); 
				}
		);
	};
	
	console.log("API call is here");
	getResourcesByURL('https://jsonplaceholder.typicode.com/posts/1', "");
	
} () );