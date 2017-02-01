const modifyElement = function(root, selector, callback) {
	const element = root.querySelector(selector);
	
	if (!element) {
		console.warn('modifyElement: no element found for selector "' + selector + '"');
		return false;
	}
	
	return callback(element);
};

const modifyInnerHtml = function(root, selector, text) {
	return modifyElement(root, selector, function(el) {
		el.innerHTML = text;
		return true;
	});
};