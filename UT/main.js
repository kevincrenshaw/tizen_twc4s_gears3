requirejs.config({
	//baseUrl: '../code/js/',
	paths: {
		utils: '../code/js/utils',
		rx: '../code/lib/rx.lite',
		jquery: '../code/lib/jquery/jquery-1.11.1.min',
	},
});

define(['tests'], function(tests) {
	console.log('hello from main module!');
});