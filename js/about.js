/* jshint esversion: 6 */
( function () {
	const currentReleaseVersion = "1.0.";
	const jenkinsBuildNumber = "37";
	const versionInfo = TIZEN_L10N.ABOUT_APP_VERSION.concat("<br>", currentReleaseVersion, jenkinsBuildNumber);
	const versionLabel = document.getElementById('version');
	versionLabel.innerHTML = versionInfo;
} () );