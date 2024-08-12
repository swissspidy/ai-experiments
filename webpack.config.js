const { resolve, basename, dirname } = require( 'node:path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const regular = {
	...defaultConfig,
	entry: {
		editor: resolve( __dirname, 'packages/editor/src/index.tsx' ),
		'summarize-button': resolve(
			__dirname,
			'packages/summarize-button/src/index.tsx'
		),
	},
	output: {
		filename: '[name].js',
		path: resolve( __dirname, 'build' ),
		globalObject: 'self',
	},
	plugins: [
		...defaultConfig.plugins,
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: 'packages/*/src/block.json',
					noErrorOnMissing: true,
					to: ( pathData ) => {
						return resolve(
							__dirname,
							'build',
							basename(
								dirname( dirname( pathData.absoluteFilename ) )
							),
							'block.json'
						);
					},
				},
			],
		} ),
	],
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

const modules = {
	...regular,
	entry: {
		'summarize-button-view': resolve(
			__dirname,
			'packages/summarize-button/src/view.ts'
		),
	},
	output: {
		...regular.output,
		module: true,
	},
	experiments: { outputModule: true },
	plugins: [
		...regular.plugins.filter(
			( plugin ) =>
				plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
		),
		new DependencyExtractionWebpackPlugin( {
			// With modules, use `requestToExternalModule`:
			requestToExternalModule( request ) {
				if ( request === '@ai-experiments/summarize-block' ) {
					return request;
				}
			},
		} ),
	],
};

module.exports = [ regular, modules ];
