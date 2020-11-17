const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const del = require('del');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const rigger = require('gulp-rigger');

const paths = {
    html: {
        src: './src/**/*.html',
        dest: './build'
    },
    styles: {
        src: './src/scss/**/*.scss',
        dest: './build/assets/css'
    },
    scripts: {
        src: './src/js/main.js',
        dest: './build/assets/js'
    },
    images: {
        src: './src/img/**/*',
        dest: './build/assets/img'
    },
    fonts: {
        src: './src/fonts/**/*',
        dest: './build/assets/fonts'
    },
    favicon: {
        src: './src/favicon/**/*',
        dest: './build/assets/favicon'
    }
};


// Clean assets
const clean = () => del(['./build']);

// Cache busting to prevent browser caching issues
const curTime = new Date().getTime();
const cacheBust = () =>
    gulp
        .src(paths.html.src)
        .pipe(plumber())
        .pipe(replace(/cb=\d+/g, 'cb=' + curTime))
        .pipe(gulp.dest(paths.html.dest));

// Copies all html files
const html =() =>
    gulp
        .src(paths.html.src)
        .pipe(plumber())
        .pipe(gulp.dest(paths.html.dest));

// Convert scss to css, auto-prefix
const styles = () =>
    gulp
        .src(paths.styles.src)
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());

// Minify all javascript files
const scripts = () =>
    gulp
        .src(paths.scripts.src)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(
            babel({
                presets: ['@babel/preset-env']
            })
        )
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(concat('app.min.js'))
        .pipe(gulp.dest(paths.scripts.dest));

// Copy and minify images
const images = () =>
    gulp
        .src(paths.images.src)
        .pipe(plumber())
        .pipe(imagemin([
            //imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 85, progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: false},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(paths.images.dest));

// Copy the fonts
const fonts = () =>
    gulp
        .src(paths.fonts.src)
        .pipe(plumber())
        .pipe(gulp.dest(paths.fonts.dest));

// Copy the favicon
const favicon = () =>
    gulp
        .src(paths.favicon.src)
        .pipe(plumber())
        .pipe(gulp.dest(paths.favicon.dest));

// Watches all .scss, .js and .html changes and executes the corresponding task
function watchFiles() {
    browserSync.init({
        server: {
            baseDir: './build'
        },
        notify: false
    });

    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.favicon.src, favicon).on('change', browserSync.reload);
    gulp.watch(paths.fonts.src, fonts).on('change', browserSync.reload);
    gulp.watch(paths.scripts.src, scripts).on('change', browserSync.reload);
    gulp.watch(paths.images.src, images).on('change', browserSync.reload);
    gulp.watch('./src/*.html', html).on('change', browserSync.reload);
}

const build = gulp.series(
    clean,
    gulp.parallel(styles, scripts, images, favicon, fonts),
    cacheBust
);

const watch = gulp.series(build, watchFiles);

exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.favicon = favicon;
exports.fonts = fonts;
exports.watch = watch;
exports.build = build;
exports.default = build;