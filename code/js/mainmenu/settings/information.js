/* jshint esversion: 6 */
(function () {
		const emptyText = "";
	
		const packageInfo = tizen.package.getPackageInfo(null);
		const appVer =  packageInfo.version;
		const shortCommitHash = String(buildInfo.commitHash).substring(0,7);
		const jenkinsInfo = emptyText.concat("-", shortCommitHash, "-", buildInfo.jenkinsBuildNumber);
		const versionInfo = emptyText.concat(TIZEN_L10N.ABOUT_APP_VERSION, "<br>", appVer, jenkinsInfo);
		
		modifyInnerHtml(document, "#app-version", versionInfo);
} () );