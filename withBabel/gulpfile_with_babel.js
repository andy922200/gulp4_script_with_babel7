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
const babelify = require('babelify');
const vinylSourceStream = require('vinyl-source-stream');
const vinylBuffer = require('vinyl-buffer');
const glob = require('glob');
const es = require('event-stream');

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
    .src(['./demo/resources/plugins/jquery-2.2.4.min.js', './node_modules/bootstrap-sass/assets/javascripts/bootstrap.js'], {
      base: '.',
    })
    .pipe($.plumber())
    .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
    .pipe($.concat('plugins.js'))
    .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
    .pipe(gulp.dest('./demo/dist/js'));
});

gulp.task('browserify', function (done) {
  /* 1. 用 glob 抓取所有要編譯的檔案*/
  /* 2. 給每一個檔案建立各自的 browserify 獨立資料流，並儲存成一個陣列*/
  /* 3. 用 event stream 合併所有資料流*/
  glob('./demo/resources/js/*.js',function(err,files){
    if(err) done(err);

    let tasks = files.map(function(entry){
      /*1. 在 browserify 啟用 transform，並用 babelify 來設定 babel 參數*/
      /*2. 參數的方式和於根目錄放置 .babelrc 內的設置是一模一樣的*/
      /*3. 從 babel 7.4 版以後，取消 babel-polyfill*/
      /*4. 由於 gulp 和 node 的資料流格式不同，所以要先用 vinyl-source-stream 來轉換給 gulp 支援*/
      /*5. 由於 uglify 所預期的資料流格式為 buffer ，所以要再度轉換*/
      return browserify({entries:[entry]}, { debug: true })
        .transform(babelify.configure({
          "presets":["@babel/preset-env"],
          "plugins":[
            [
              "@babel/plugin-transform-runtime",
              {
                "absoluteRuntime": false,
                "corejs": 3,
                "regenerator": true,
                "useESModules": false
              }
            ]
          ]
        }))
        .bundle()
        .pipe($.plumber())
        .pipe(vinylSourceStream(entry))
        .pipe(vinylBuffer())
        .pipe($.if(envOption !== 'production', $.sourcemaps.init({ loadMaps: true })))
        .pipe(
          $.rename(function (path) {
            path.dirname = '/';
          })
        )
        .pipe($.if(envOption !== 'production', uglify()))
        .pipe($.if(envOption !== 'production', $.sourcemaps.write('./')))
        .pipe(gulp.dest('./demo/dist/js'))
        .pipe(browserSync.stream());
    })

    es.merge(tasks).on('end',done)
  })
});

gulp.task('watch', () => {
  gulp.watch('./demo/*.html', gulp.series('html'));
  gulp.watch('./demo/resources/**/*.scss', gulp.series('sass'));
  gulp.watch(
    ['./demo/resources/js/**/*.js', './demo/resources/plugins/*.js'],
    gulp.series('plugins', 'browserify')
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

gulp.task('default', gulp.series('clean', 'sass', 'plugins', 'browserify', gulp.parallel('watch', 'browser-sync')));
