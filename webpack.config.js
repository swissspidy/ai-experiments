const { resolve } = require( 'node:path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		'edit-post': resolve( __dirname, 'packages/editor/src/index.tsx' ),
	},
	output: {
		filename: '[name].js',
		path: resolve( __dirname, 'build' ),
		globalObject: 'self',
	},
	resolve: {
		extensions: [ '.jsx', '.ts', '.tsx', '...' ],
		fallback: {
			crypto: false,
			path: false,
			util: false,
			zlib: false,
			assert: false,
			stream: false,
			fs: false,
		},
	},
};
