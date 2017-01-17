/* jshint node:true */
/********************/

"use strict";

//////////
// gulp //
//////////
const gulp = require('gulp'),
   del = require('del');

///////////////////
// gulp plug-ins //
///////////////////
const merge = require('merge-stream'),
   jshint = require("gulp-jshint"),
   uglify = require("gulp-uglify"),
   cleanCSS = require('gulp-clean-css'),
   jsonminify = require('gulp-jsonminify'),
   babel = require('gulp-babel'),
   pump = require('pump'),
   crc = require('crc'),
   zip = require('gulp-zip'),
   gutil = require('gulp-util'),
   list = require('gulp-print'),
   rename = require('gulp-rename'),
   stylish = require('jshint-stylish'),
   stripCode = require('gulp-strip-code'),
   header = require('gulp-header'),
   forceDeploy = require('gulp-jsforce-deploy'),
   fileExists = require('file-exists'),
   taskListing = require('gulp-task-listing');

///////////
// Tasks //
///////////
///
// Delegate functions used in these calls
// are implemented in functions below.

/**
 * Default task that tests gulp by listing tasks
 */
gulp.task('default', taskListing);
gulp.task('lint', lint);
gulp.task('build', ['build-min-release']);
gulp.task('deploy', ['deploy-dev'], deploy_Default);
// Release builds
gulp.task('build-min-release', ['clean-min-release'], build_min_release);
gulp.task('clean-min-release', ['lint'], clean_release);
gulp.task('static-resource-min-release', ['build-min-release'], static_resource_min_release);
// Interactive Build
gulp.task('build-interactive', ['clean-min-release'], build_min_components);
// Client Builds
gulp.task('env-CLIENT_ORG', false, env_CLIENT_ORG);
gulp.task('deploy-CLIENT_ORG', ['static-resource-min-release', 'env-CLIENT_ORG'], deploy_CLIENT_ORG);
// Developer builds
gulp.task('clean-dev', clean_dev);
gulp.task('build-dev', ['clean-dev', 'lint'], build_dev);
gulp.task('static-resource-dev', ['build-dev'], static_resource_dev);
gulp.task('env-dev', false, env_dev);
gulp.task('deploy-dev', ['static-resource-dev', 'env-dev'], deploy_dev);

///////////////////
// Utility Tasks //
///////////////////
/**
 * Remove old dev files.
 */
function clean_dev()
{
   return del(
      [
         './*-dev.zip',
         './resource-bundles/CompanyComponents.resource'
      ]);
}

/**
 * Remove old release build files
 */
function clean_release()
{
   return clean_min("release");
}

/**
 * Remove files from directory.
 */
function clean_min(build_type)
{
   return del([
      `./*-min*-${build_type}.zip`
   ]);
}

/**
 * Lint project source files using JShint.
 * Fails if any errors are found.
 */
function lint()
{
   return gulp.src('./components/**/*.js') // path to your files
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(jshint.reporter('fail'));
}

////////////
// Builds //
////////////

/**
 * Gets useful data from package.json
 */
const npm_pkg = require('./package.json');
const banner = ['/**',
   ' * <%= pkg.name %> - <%= pkg.description %>',
   ' * @version v<%= pkg.version %>',
   //' * @link <%= pkg.link %>',
   ' * @license <%= pkg.license %>',
   ' * @author <%= pkg.author %>',
   ' */',
   ''
].join('\n');
const gcl = gutil.colors;
const RELEASE_BUILD = [
   'progressIndicator',
   'timer',
   'template',
   'modelRegisterer',
   'modelRefresher'
];
const RELEASE_CRC32 = crc.crc32(RELEASE_BUILD.sort()).toString(16);

////////////////
// Deployment //
////////////////

/**
 * Deploy release build to Ideal Protein.
 */
function deploy_Default()
{
   gutil.log(gcl.bgGreen(gcl.white("Done deploying to default destination")));
}

/**
 * Deploy release build to the Client Org.
 */
function deploy_CLIENT_ORG()
{
   return deploy('CLIENT_ORG');
}

/**
 * Deploy development build to Company.
 */
function deploy_dev()
{
   return deploy('Company');
}

/**
 * Deploy builds using jsforce. This will only update
 * a server if the files on both ends are non-identical .
 */
function deploy(targetPrefix)
{
   var username = process.env[`${targetPrefix}_USERNAME`],
      password = process.env[`${targetPrefix}_PASSWORD`],
      loginUrl = process.env[`${targetPrefix}_LOGIN_URL`];

   var org = {
      username: username,
      password: password,
      pollTimeout: 120 * 1000,
      pollInterval: 2 * 1000,
      version: '37.0',
      verbose: false,
      logLevel: "WARNING", // "DEBUG"
      rollbackOnError: true
   };

   if (loginUrl)
   {
      org.loginUrl = loginUrl;
   }

   return gulp.src('./src/**',
      {
         base: "."
      })
      .pipe(zip('pkg.zip'))
      .pipe(forceDeploy(org));
}

//////////////////
// Build Events //
//////////////////

function gulpFail(origin, message)
{
   throw new gutil.PluginError(
   {
      plugin: origin,
      message: gutil.colors.red(message || "Task was forced to fail."),
      showStack: false
   });
}

////////////////////////
// .env configuration //
////////////////////////

/**
 * Check for Company environment configs
 */
function env_dev()
{
   return env('Company');
}

/**
 * Check for CLIENT_ORG environment configs
 */
function env_CLIENT_ORG()
{
   return env('CLIENT_ORG');
}

/**
 * Check for existing environment configs
 */
function env(clientPrefix)
{
   var valid = env_vars(clientPrefix);

   if (!valid)
   {
      gulpFail("env", `${clientPrefix} environment variables not found`);
   }
}

/**
 * Check for existing environment variables
 */
function env_vars(clientPrefix)
{
   var valid = false;

   if (env_exists())
   {
      env_require();

      if (process.env[`${clientPrefix}_USERNAME`] && process.env[`${clientPrefix}_PASSWORD`])
      {
         gutil.log("Found" + gcl.magenta(` ${clientPrefix}`) + " config!");
         valid = true;
      }
   }
   return valid;
}

/**
 * Check for existing .env file
 */
function env_exists(client)
{
   var envFileExists = fileExists('./.env');

   gutil.log((envFileExists ? "Discovered" + gcl.cyan(' .env') : gcl.cyan("Couldn't find") + '.env') + " file");

   return envFileExists;
}

/**
 * Require .env configs
 */
function env_require()
{
   require('dotenv').config();
}

///////////////////////////////
// Static Ressource Building //
///////////////////////////////

/**
 * Build the release static resource.
 */
function static_resource_min_release()
{
   return static_resource(`${RELEASE_CRC32}-release`);
}
/**
 * Build the dev static resource.
 */
function static_resource_dev()
{
   return static_resource('dev');
}

/**
 * This builds the deployemnt package
 * for deployment with jsforce and the SF APIs.
 */
function static_resource(build_type)
{
   return gulp.src(`./*-${build_type}.zip`,
      {
         base: "."
      })
      // rename
      .pipe(rename('CompanyComponents.resource'))
      // move to SF package
      .pipe(gulp.dest('src/staticresources'));
}

///////////////////////////////////////
// Delegate functions for gulp tasks //
///////////////////////////////////////

function build_dev()
{
   var src = gulp.src(['./components/**/*.*', '!./components/skuid_*.json']);

   var min_configs = gulp.src('./components/skuid_*.json')
      // minify configs
      .pipe(jsonminify());

   return merge(src, min_configs)
      // then make them into a resource bundle
      .pipe(gulp.dest('./resource-bundles/CompanyComponents.resource'))
      // zip the files
      .pipe(zip('./CompanyComponents-dev.zip')) // eventually remove this
      // drop the zip in the top level folder
      .pipe(gulp.dest('./'));
}

/**
 * This is an interactive method.
 * It allows the user, from the command line,
 * to state by name which packages to build.
 */
function build_min_components(cb)
{
   const SPECIAL = {
      pI: "progressIndicator",
      ppC: "popupController"
   };

   var comp = [],
      exclude,
      argv = require('yargs')
      .usage(gutil.log('Usage: $0 $1 --c [name]'))
      .demand(['c'])
      .alias('c', 'component')
      .describe('name', 'specify a component name')
      .choices('name', ['timer', 'template', 'pI', 'ppC'])
      .example('gulp build-min --c ppC', 'Make a minifed build of the popupController.')
      .argv;

   if (SPECIAL[argv.c])
   {
      comp.push(SPECIAL[argv.c]);
   }
   else
   {
      comp.push(argv.c);
   }

   if (comp.contains("timer"))
   {
      exclude = "timer";
   }
   else if (comp.contains("progressIndicator"))
   {
      exclude = "progressIndicator";
   }
   return build_min(comp, "custom", cb);
}

function build_min_release(cb)
{
   return build_min(RELEASE_BUILD, "release", cb);
}

function build_min(comps, build_type, cb)
{
   var js = [],
      css = [],
      remains = 0;

   comps.forEach(function (comp)
   {
      js.push(`./components/*_${comp}/*.js`);
      css.push(`./components/*_${comp}/*.css`);
   });

   remains++;
   // minify-js
   var min_js = pump([
      gulp.src(js),
      list(),
      babel(
      {
         presets: ['es2015']
      }),
      uglify()
   ], completed);

   //minify-css
   var min_css = gulp.src(css)
      .pipe(list())
      .pipe(cleanCSS(
      {
         debug: true
      }, res => gutil.log(`${res.name} : ${res.stats.originalSize} → ${res.stats.minifiedSize}`)));

   // combine
   var min_src = merge(min_js, min_css)
      // append header to config files
      .pipe(header(banner,
      {
         pkg: npm_pkg
      }));

   // configs
   var crc32,
      excludeStart = `start-${build_type}-excludes`,
      excludeEnd = `end-${build_type}-excludes`;

   if (build_type === "release")
   {
      crc32 = RELEASE_CRC32;
   }
   else
   {
      crc32 = crc.crc32(comps.sort()).toString(16);
   }

   var min_configs = gulp.src('./components/skuid_*.json')
      // strip unrelated stuff
      .pipe(stripCode(
      {
         start_comment: excludeStart,
         end_comment: excludeEnd
      }))
      // minify configs
      .pipe(jsonminify());

   remains++;
   // Zip all files
   pump([
      merge(min_src, min_configs),
      zip(`./CompanyComponents-min-${crc32}-${build_type}.zip`),
      gulp.dest('./')
   ], completed);

   /**
    * This is sort of a hacky status function called at the end of each pump
    * to report on the status of the build. If this function was called with
    * an error as argument, pass that along to the callback function, otherwise
    * continue until we have no operatons remaining and the build is done. The
    * callback method is then called sin arguments to signify a passed build.
    * @param  {Error} err This will be non-null if one of the pumps errored out.
    */
   function completed(err)
   {
      if (err)
      {
         cb(err);
      }
      else if ((--remains) === 0)
      {
         cb();
      }
   }
}
