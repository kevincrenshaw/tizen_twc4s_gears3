/* jshint esversion: 6 */
(function () {
		const emptyText = "";
	
		const packageInfo = tizen.package.getPackageInfo(null);
		const appVer =  packageInfo.version;
		const jenkinsInfo = emptyText.concat("-", buildInfo.commitHash, "-", buildInfo.jenkinsBuildNumber);
		const versionInfo = emptyText.concat(TIZEN_L10N.SETTINGS_MENU_INFORMATION_APP_VERSION, "<br>", appVer, jenkinsInfo);
		
		modifyInnerHtml(document, "#app-version", versionInfo);
} () );
