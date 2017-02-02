/* jshint esversion: 6 */
( function () {
	const currentReleaseVersion = "0.0.1.";
	const jenkinsBuildNumber = "37";
	const versionInfo = TIZEN_L10N.ABOUT_APP_VERSION.concat("<br>", currentReleaseVersion, jenkinsBuildNumber);
	const versionLabel = document.getElementById('version');
	
	if (!versionLabel) {
		console.error("about.js :: #version <p> from about.html not found in hierarchy");
	}
	
	versionLabel.innerHTML = versionInfo;
} () );
