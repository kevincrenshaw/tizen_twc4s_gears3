//Store focus event in case module app.js module is loaded to late for catching those events 
var focusEventArr = [];

function focusEventListener(ev) {
	focusEventArr.push(ev);
}

window.addEventListener('focus', focusEventListener);