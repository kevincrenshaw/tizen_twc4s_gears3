/* jshint esversion: 6 */
(function () {
		const currentReleaseVersion = "0.0.1.";
		const emptyText = "";
		const jenkinsInfo = emptyText.concat(buildInfo.jenkinsBuildNumber, ".", buildInfo.commitHash);
		const versionInfo = emptyText.concat(TIZEN_L10N.ABOUT_APP_VERSION, "<br>", currentReleaseVersion, jenkinsInfo);
		
		modifyInnerHtml(document, "#app-version", versionInfo);
} () );