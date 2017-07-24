const path = require('path'),
    HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {

    entry: {
        treeSelectionComponent: './src/index.jsx'
    },

    output: {
        path: path.resolve('dist'),
        filename: 'static/[name].js',
        library: '[name]',
        libraryTarget: 'umd'
    },

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

    plugins: [
        new HtmlWebpackPlugin({
            title: 'My App',
            filename: 'index.html',
            template: './src/index.ejs'
        })
    ]

};