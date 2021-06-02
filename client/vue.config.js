const SvgStore = require('webpack-svgstore-plugin');

module.exports = {
    outputDir: '../dist',
    productionSourceMap: process.env.NODE_ENV !== 'production',
    configureWebpack: {
        plugins: [
            // svg icons
            new SvgStore({
                prefix: 'icon--',
                svgoOptions: {
                    plugins: [
                        { cleanupIDs: false },
                        { collapseGroups: false },
                        { removeTitle: true },
                    ],
                },
            }),
        ]
      }
};