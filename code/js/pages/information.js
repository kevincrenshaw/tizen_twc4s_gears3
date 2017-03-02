/* jshint esversion: 6 */
define(['data/buildInfo', 'utils/utils'], function(buildInfo, utils) {
	return {
		pagebeforeshow: function(ev) {
			const page = ev.target;
			
			const emptyText = "";
			
			const packageInfo = tizen.package.getPackageInfo(null);
			const appVer =  packageInfo.version;
			const jenkinsInfo = emptyText.concat("-", buildInfo.commitHash, "-", buildInfo.jenkinsBuildNumber);
			const versionInfo = emptyText.concat(TIZEN_L10N.SETTINGS_MENU_INFORMATION_APP_VERSION, "<br>", appVer, jenkinsInfo);
			
			utils.modifyInnerHtml(page, "#app-version", versionInfo);
		},
	};
});