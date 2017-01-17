# gulp-build #

Skuid component deployment using gulp.js.

**Note:** this is a *hacky-in-between-major-upgrades* version of our build file. Its currently in a state of major overhaul and we expect large portions of what is being done by gulp tasks to be replaced by a frontend packager.

## Setup ##

This section has two parts. You already did the initial setup part by downloading this repo.

First part:

1.  Your working directory for this (example, npm script omitted) repository is assumed to be called `CompanyComponents`. You should now open a command-line window/terminal there (in Windows: by shift-right-clicking anywhere in the folder and "Open command window here"). 

2.  Install [Node.js](https://nodejs.org/en/) globally on your system. ([downloads](https://nodejs.org/en/download/), instructions [for Windows](http://blog.teamtreehouse.com/install-node-js-npm-windows)).

3.  From the console, make sure you can now run `npm`. It should display the help, and version number of npm.

4.  Run `npm install`. That sets up the app, grabbing all dependencies needed by the project and installing them to a local node_modules folder.

5.  If you run any of the automation now you'll get an error saying Gulp needs to be installed globally. So from the repo dir again, run `npm install gulp -g`

6.  Once finished, make sure `npm ls` returns a load of stuff.

## Using the custom Deploy Script ##

7.  Running the `gulp` command in the console set at the components' directory will run the default task of listing all available gulp tasks.

8.  Create a `.env` file in your working directory with the following two lines:

	**(case-sensitive)**
	`Company_USERNAME="username@org.com"`
	`Company_PASSWORD="passwordAndSecurityTokenConcatenated"`

	You will eventually need to create additional entries for each org you wish to deploy component packages to.

9. Make sure you can connect to the org with your credentials.

10. To deploy, run `gulp deploy` to automatically build and create the static resource and upload it to SF using jsforce!

11. You should now be good to go. 



### Sublime Text 3: Tips ###

1.  If you don't have it already, [install Package Control](https://packagecontrol.io/installation), the sublime package manager.

2. Now, we go about installing some packages:

    [sublime-gulp](https://github.com/NicoSantangelo/sublime-gulp) (and here's [a guide](https://mijingo.com/blog/run-gulp-from-sublime-text)),
	
	[sublime-jshint](https://github.com/uipoet/sublime-jshint),

    [sublime-jsdocs](https://github.com/spadgos/sublime-jsdocs) (reccommended),

    [GitGutter](https://github.com/jisaacks/GitGutter) (reccommended)

3. With all that installed, you should be able to right-click a file in the FOLDERS tree in Sublime's sidebar [right-click] → Gulp → "List Tasks to Run". That should show the various build options. Run the `default` build and do `Ctrl + ~` on your keyboard to show the console in Sublime, and observe the output.

4. Assuming all went well you should be good to develop components and use interactive builds!
