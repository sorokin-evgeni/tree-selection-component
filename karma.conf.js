module.exports = function(config) {
    config.set({

        files: [
            './node_modules/phantomjs-polyfill/bind-polyfill.js',
            './node_modules/phantomjs-polyfill-find-index/findIndex-polyfill.js',
            './node_modules/phantomjs-polyfill-find/find-polyfill.js',
            './node_modules/phantomjs-polyfill-object-assign/object-assign-polyfill.js',
            'src/**/*.spec.js'
        ],

        // frameworks to use
        frameworks: ['mocha'],

        preprocessors: {
            'src/**/*.spec.js': ['webpack']
        },

        reporters: ['spec', 'coverage-istanbul', 'mocha'],

        coverageIstanbulReporter: {

            reports: [ 'text-summary' ],
            fixWebpackSourcePaths: true
        },

        webpack: {
            module: {
                rules: [{
                    test: /\.js/,
                    use: [{
                        loader: 'babel-loader'
                    }]
                }, {
                    test: /(\.less|\.css)/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader'
                    }, {
                        loader: 'less-loader'
                    }]
                }]
            },
        },

        mochaReporter: {
            showDiff: 'inline',
            maxLogLines: 999
        },

        webpackMiddleware: {
            // webpack-dev-middleware configuration
            noInfo: true
        },

        plugins: [
            require("karma-webpack"),
            require("istanbul-instrumenter-loader"),
            require("karma-mocha"),
            require("karma-mocha-reporter"),
            require("karma-coverage-istanbul-reporter"),
            require("karma-phantomjs-launcher"),
            require("karma-spec-reporter")
        ],

        browsers: ['PhantomJS']
    });
};