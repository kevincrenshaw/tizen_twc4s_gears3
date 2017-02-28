// This file is overriden by Jenkins with real values after each Jenkins build.
// Please review ~/CI/buildScript.sh to review details.
// Build from Tizen studio will have dev dev values.
define([], function() {
	return {
		jenkinsBuildNumber: "dev",
		commitHash: "dev",
	};
});