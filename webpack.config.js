const { resolve, basename, dirname } = require( 'node:path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { WebWorkerPlugin } = require( '@shopify/web-worker/webpack' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { hasBabelConfig, hasArgInCLI } = require( '@wordpress/scripts/utils' );

const isProduction = process.env.NODE_ENV === 'production';
const hasReactFastRefresh = hasArgInCLI( '--hot' ) && ! isProduction;

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
		globalObject: 'self', // This is the default, but required for @shopify/web-worker.
	},
	resolve: {
		// Ensure "require" has a higher priority when matching export conditions.
		// https://webpack.js.org/configuration/resolve/#resolveconditionnames
		// Needed for @huggingface/transformers.
		conditionNames: [ 'node', 'require', 'import' ],
		extensions: [ '.jsx', '.ts', '.tsx', '...' ],
	},
	module: {
		rules: [
			{
				test: /\.(m?[jt])sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,

							// Provide a fallback configuration if there's not
							// one explicitly available in the project.
							...( ! hasBabelConfig() && {
								babelrc: false,
								configFile: false,
								presets: [
									require.resolve(
										'@wordpress/babel-preset-default'
									),
								],
								plugins: [
									require.resolve(
										'@shopify/web-worker/babel'
									),
									hasReactFastRefresh &&
										require.resolve(
											'react-refresh/babel'
										),
								].filter( Boolean ),
							} ),
						},
					},
				],
			},
			...defaultConfig.module.rules.slice( 1 ),
		],
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
		new WebWorkerPlugin(),
	],
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
				! [
					'DependencyExtractionWebpackPlugin',
					'WebWorkerPlugin',
				].includes( plugin.constructor.name )
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
