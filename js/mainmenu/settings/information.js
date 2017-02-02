/* jshint esversion: 6 */
( function () {
	const currentReleaseVersion = "0.0.1.";
	const jenkinsBuildNumber = "137.5c833e7";
	const versionInfo = TIZEN_L10N.ABOUT_APP_VERSION.concat("<br>", currentReleaseVersion, jenkinsBuildNumber);
	const versionLabel = document.getElementById('app-version');
	
	if (!versionLabel) {
		console.error("about.js :: #version <p> from about.html not found in hierarchy");
	}
	
	versionLabel.innerHTML = versionInfo;
} () );
