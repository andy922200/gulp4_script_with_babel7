const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const del = require('del');
const parseArgs = require('minimist');
const path = require('path');
const browserSync = require('browser-sync').create();
const envOption = parseArgs(process.argv.slice(2)).env;
const uglify = require('gulp-uglify-es').default;
const browserify = require('browserify');
const vinylSourceStream = require('vinyl-source-stream');
const vinylBuffer = require('vinyl-buffer');

gulp.task('clean', () => {
  return del(['./demo/dist']);
});

gulp.task('html', () => {
  return gulp
    .src(['./demo/*.html'])
    .pipe($.plumber())
    .pipe(browserSync.stream({ stream: true }));
});

gulp.task('sass', () => {
  let postcssPlugins = [autoprefixer()];
  return gulp
    .src('./demo/resources/**/*.scss')
    .pipe($.plumber())
    .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(postcssPlugins))
    .pipe($.if(envOption === 'production', $.cleanCss({ compatibility: 'ie9' })))
    .pipe(
      $.rename(function (path) {
        path.dirname = '/';
      })
    )
    .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
    .pipe(gulp.dest('./demo/dist/css'))
    .pipe(browserSync.stream({ stream: true }));
});

gulp.task('plugins', () => {
  return gulp
    .src(['./demo/resources/plugins/**/*.js', './node_modules/bootstrap-sass/assets/javascripts/bootstrap.js'], {
      base: '.',
    })
    .pipe($.plumber())
    .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
    .pipe($.concat('plugins.js'))
    .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
    .pipe(gulp.dest('./demo/dist/js'));
});

gulp.task('javascript', () => {
  return gulp
    .src('./demo/resources/js/**/*.js')
    .pipe($.plumber())
    .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
    .pipe($.babel())
    .pipe($.if(envOption !== 'production', uglify()))
    .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
    .pipe(gulp.dest('./demo/dist/js'))
    .pipe(browserSync.stream());
});

gulp.task('browserify', function () {
  return browserify('./demo/dist/js/assignPermission.js', { debug: true })
    .bundle()
    .pipe($.plumber())
    .pipe(vinylSourceStream('./demo/dist/js/assignPermission.js'))
    .pipe(vinylBuffer())
    .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
    .pipe(
      $.rename(function (path) {
        path.dirname = '/';
      })
    )
    .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
    .pipe(gulp.dest('./demo/dist/js'))
    .pipe(browserSync.stream());
});

gulp.task('watch', () => {
  gulp.watch('./demo/*.html', gulp.series('html'));
  gulp.watch('./demo/resources/**/*.scss', gulp.series('sass'));
  gulp.watch(
    ['./demo/resources/js/**/*.js', './demo/resources/plugins/*.js'],
    gulp.series('plugins', 'javascript', 'browserify')
  );
});

gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: './demo',
      directory: true,
    },
  });
});

gulp.task('default', gulp.series('clean', 'sass', 'plugins', 'javascript', gulp.parallel('watch', 'browser-sync')));
