#!/bin/bash

#SDK PATH is : /home/debian/tizen-studio/tools/ide/bin/tizen

export PATH=$PATH:/home/debian/tizen-studio/tools/ide/bin/

#cd /home/debian/tizen-studio/package-manager/
#export DISPLAY=0
#./package-manager-cli.bin show-pkgs
#./package-manager-cli.bin install NativeCLI

#tizen build-web -- $WORKSPACE

cd certs

echo "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
<profiles version=\"3.0\">
<profile name=\"all2\">
<profileitem ca=\"\" distributor=\"0\" key=\"`pwd`/author.p12\" password=\"rDh8uIxLzRfGYRytc+XWyw==\" rootca=\"\"/>
<profileitem ca=\"\" distributor=\"1\" key=\"`pwd`/distributor.p12\" password=\"rDh8uIxLzRfGYRytc+XWyw==\" rootca=\"\"/>
<profileitem ca=\"\" distributor=\"2\" key=\"\" password=\"xmEcrXPl1ss=\" rootca=\"\"/>
</profile>
</profiles>" > profiles.xml

tizen cli-config -g default.profiles.path=`pwd`/profiles.xml
tizen cli-config -g profiles.path=`pwd`/profiles.xml

echo 'path to profiles.xml is now' 
tizen cli-config -l
    
cd ../../code/

rm twc.wgt

#magic happens
tizen build-web

#Storing build number and git commit short hash
echo "const buildInfo = {
		jenkinsBuildNumber: '$BUILD_NUMBER',
		commitHash: '$GIT_COMMIT',
	};" > `pwd`/.buildResult/js/data/buildInfo.js

tizen package -s all2 -t wgt -o `pwd`/twc.wgt -- .buildResult
