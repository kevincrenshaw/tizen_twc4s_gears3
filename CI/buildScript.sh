#!/bin/bash

#Tizen SDK configuration steps on Jenkins:

# cd /home/debian/tizen-studio/package-manager/
# export DISPLAY=0  #package manager requires this.
# ./package-manager-cli.bin show-pkgs
# ./package-manager-cli.bin install NativeCLI

#intive Jenkins SDK PATH is : /home/debian/tizen-studio/tools/ide/bin/tizen

export PATH=$PATH:/home/debian/tizen-studio/tools/ide/bin/

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

echo 'Tizen build configuration: ' 
tizen cli-config -l
    
cd ../../code/

#Storing build number and git commit short hash
echo "const buildInfo = {
		jenkinsBuildNumber: '$BUILD_NUMBER',
		commitHash: '$GIT_COMMIT',
	};" > `pwd`/js/data/buildInfo.js


rm twc.wgt

tizen build-web

tizen package -s all2 -t wgt -o `pwd`/twc.wgt -- .buildResult

echo 'TWC path and info: '
ls -la | grep twc.wgt
