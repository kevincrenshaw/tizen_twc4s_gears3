#!/bin/bash
npm i
node ./node_modules/eslint/bin/eslint -c .eslintrc.js ../ -f checkstyle -o ./checkstyle.xml
karma start karma-jenkins.conf.js