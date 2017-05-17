# Reqs
1. node & npm
2. karma CLI* & eslint CLI** - `npm i -g karma-cli eslint`
3. installed npm packages, go to **[project dir]/tests** then type `npm i`

*, ** - you may skip this step and use locally installed npm packages:
`node ./node_modules/karma/bin/karma` for karma usage
`node ./node_modules/eslint/bin/eslint` for eslint usage

# Run linter
1. open terminal
2. go to **[project dir]/tests**
3. type `eslint -c .eslintrc.js ../`

# Run tests
1. open terminal
2. go to **[project dir]/tests**
3. type `karma start`

To run single tests (by default files are watched), type `karma start --single-run`

# Code coverage
1. run tests
2. go to **[project dir]/tests/coverage/report**
3. open **index.html**

# Mocking modules issue
This feature is not yet implemented, b/c of that loading some of the module may cause errors.
You may want to see **test-main.js** to see excluded test files.

It is recommended to use **squire.js** & **sinon.js** to introduce module mocking functionality.
http://www.tysoncadenhead.com/blog/dependency-injection-with-squire-and-sinon

# Jenkins integration
Karma config used by jenkins - **karma-jenkins.conf.js**

Full list of command to be executed in jenkins shell:
```
cd tests
npm i
node ./node_modules/eslint/bin/eslint -c .eslintrc.js ../ -f checkstyle -o ./report/checkstyle.xml
node ./node_modules/karma/bin/karma start karma-jenkins.conf.js
```

More info:
https://karma-runner.github.io/1.0/plus/jenkins.html
http://eslint.org/
