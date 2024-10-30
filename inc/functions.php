<?php
/**
 * Collection of functions.
 *
 * @package AiExperiments
 */

declare(strict_types = 1);

namespace AiExperiments;

use WP_Block;
use WP_Block_Supports;

/**
 * Registers the summarize button block.
 */
function register_summarize_button_block() {
	register_block_type(
		dirname( __DIR__ ) . '/build/summarize-button',
		[
			'render_callback' => __NAMESPACE__ . '\render_summarize_block',
		]
	);
}

add_action( 'init', __NAMESPACE__ . '\register_summarize_button_block' );

/**
 * Render callback for the summarize block.
 *
 * @param array<string, mixed> $attributes Block attributes.
 * @param string               $content    Block content.
 * @param WP_Block             $block      Block instance.
 * @return string Rendered block type output.
 */
function render_summarize_block( $attributes, string $content, WP_Block $block ) {
	wp_enqueue_script_module( '@ai-experiments/summarize-button' );
	wp_enqueue_style( 'ai-experiments-summarize-button' );

	// TODO: Figure out why the stylesheet is not enqueued the regular way.
	wp_add_inline_style(
		'wp-block-library',
		file_get_contents(
			plugin_dir_path( __DIR__ ) . 'build/style-summarize-button.css'
		)
	);

	$id = wp_generate_uuid4();

	$popover_button_id = "ai-summary-button=$id";
	$popover_id        = "ai-summary-popover=$id";

	$summary_context = $attributes['context'] ?? 'post';

	$context = [
		'summary'        => '',
		'summaryContext' => $summary_context,
		'isLoading'      => false,
		'isOpen'         => false,
		'buttonText'     => __( 'Read AI-generated summary', 'ai-experiments' ),
	];

	ob_start();
	?>
	<div
			<?php echo WP_Block_Supports::$block_to_render ? get_block_wrapper_attributes() : ''; ?>
			<?php echo wp_interactivity_data_wp_context( $context ); ?>
			data-wp-interactive="ai-experiments/summarize-button"
	>
		<button
				class="ai-summary-button wp-block-button__link is-layout-flex"
				id="<?php echo esc_attr( $popover_button_id ); ?>"
				popovertarget="<?php echo esc_attr( $popover_id ); ?>"
				popovertargetaction="toggle"
				data-wp-on-async--click="actions.generateSummary"
				data-wp-class--loading="context.isLoading"
				data-wp-bind--disabled="context.isLoading"
		>
			<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24"
					viewBox="0 -960 960 960"
					width="24"
					fill="#5f6368"
			>
				<path d="M480-80q0-83-31.5-156T363-363q-54-54-127-85.5T80-480q83 0 156-31.5T363-597q54-54 85.5-127T480-880q0 83 31.5 156T597-597q54 54 127 85.5T880-480q-83 0-156 31.5T597-363q-54 54-85.5 127T480-80Z" />
			</svg>

			<span data-wp-text="context.buttonText">
				<?php esc_html_e( 'Read AI-generated summary', 'ai-experiments' ); ?>
			</span>
		</button>
		<div
			class="ai-summary-popover"
			id="<?php echo esc_attr( $popover_id ); ?>"
			anchor="<?php echo esc_attr( $popover_button_id ); ?>"
			popover
		>
			<button
				class="ai-summary-popover-close"
				popovertarget="<?php echo esc_attr( $popover_id ); ?>"
				popovertargetaction="hide"
				data-wp-on-async--click="actions.closeSummary"
			>
				<?php esc_html_e( 'Close', 'ai-experiments' ); ?>
			</button>
			<p data-wp-text="context.summary"></p>
		</div>
	</div>
	<?php
	return (string) ob_get_clean();
}


/**
 * Filters hooked blocks to change summary type.
 *
 * This way the same block can be used to summarize both comments and posts.
 *
 * @param array|null $hooked_block The parsed block array for the given hooked block type, or null to suppress the block.
 * @param string     $hooked_block_type   The hooked block type name.
 * @param string     $relative_position   The relative position of the hooked block.
 * @param array      $anchor_block The anchor block, in parsed block array format.
 * @return array Filtered block data.
 */
function set_summarize_context_based_on_adjacent_block( $hooked_block, $hooked_block_type, $relative_position, $anchor_block ) {
	if ( 'core/comment-template' === $anchor_block['blockName'] ) {
		$hooked_block['attrs']['context'] = 'comments';
	}

	return $hooked_block;
}

add_filter( 'hooked_block_ai-experiments/summarize-button', __NAMESPACE__ . '\set_summarize_context_based_on_adjacent_block', 10, 4 );

/**
 * Filters hooked blocks to inherit the layout attribute
 *
 * @param array|null $hooked_block The parsed block array for the given hooked block type, or null to suppress the block.
 * @param string     $hooked_block_type   The hooked block type name.
 * @param string     $relative_position   The relative position of the hooked block.
 * @param array      $anchor_block The anchor block, in parsed block array format.
 * @return array Filtered block data.
 */
function set_block_layout_attribute_based_on_adjacent_block( $hooked_block, $hooked_block_type, $relative_position, $anchor_block ) {
	// Is the hooked block adjacent to the anchor block?
	if ( 'before' !== $relative_position && 'after' !== $relative_position ) {
		return $hooked_block;
	}

	// Does the anchor block have a layout attribute?
	if ( isset( $anchor_block['attrs']['layout'] ) ) {
		// Copy the anchor block's layout attribute to the hooked block.
		$hooked_block['attrs']['layout'] = $anchor_block['attrs']['layout'];
	}

	return $hooked_block;
}

add_filter( 'hooked_block_ai-experiments/summarize-button', __NAMESPACE__ . '\set_block_layout_attribute_based_on_adjacent_block', 10, 4 );
add_filter( 'hooked_block_ai-experiments/translate-button', __NAMESPACE__ . '\set_block_layout_attribute_based_on_adjacent_block', 10, 4 );

/**
 * Enqueues scripts for the block editor.
 */
function enqueue_block_editor_assets(): void {
	$asset_file = dirname( __DIR__ ) . '/build/editor.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_enqueue_script(
		'ai-experiments-editor',
		plugins_url( 'build/editor.js', __DIR__ ),
		$asset['dependencies'],
		$asset['version'],
		array(
			'strategy' => 'defer',
		)
	);

	wp_set_script_translations( 'ai-experiments-editor', 'ai-experiments' );

	wp_enqueue_style(
		'ai-experiments-editor',
		plugins_url( 'build/style-editor.css', __DIR__ ),
		array( 'wp-components' ),
		$asset['version']
	);

	wp_style_add_data( 'media-experiments-editor', 'rtl', 'replace' );

	$asset_file = dirname( __DIR__ ) . '/build/summarize-button.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_enqueue_script(
		'ai-experiments-summarize-button',
		plugins_url( 'build/summarize-button.js', __DIR__ ),
		$asset['dependencies'],
		$asset['version'],
		array(
			'strategy' => 'defer',
		)
	);

	$asset_file = dirname( __DIR__ ) . '/build/translate-button.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_enqueue_script(
		'ai-experiments-translate-button',
		plugins_url( 'build/translate-button.js', __DIR__ ),
		$asset['dependencies'],
		$asset['version'],
		array(
			'strategy' => 'defer',
		)
	);
}

add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );

/**
 * Enqueues scripts for the block editor, iframed.
 *
 * @return void
 */
function enqueue_block_assets(): void {
	if ( ! is_admin() ) {
		return;
	}

	$asset_file = dirname( __DIR__ ) . '/build/editor.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_enqueue_style(
		'ai-experiments-editor',
		plugins_url( 'build/style-editor.css', __DIR__ ),
		array( 'wp-components' ),
		$asset['version']
	);

	wp_style_add_data( 'media-experiments-editor', 'rtl', 'replace' );
}

add_action( 'enqueue_block_assets', __NAMESPACE__ . '\enqueue_block_assets' );

/**
 * Registers assets for the frontend.
 */
function register_frontend_assets() {
	$asset_file = dirname( __DIR__ ) . '/build/summarize-button-view.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_register_script_module(
		'@ai-experiments/summarize-button',
		plugins_url( 'build/summarize-button-view.js', __DIR__ ),
		array( '@wordpress/interactivity' ),
		$asset['version'],
	);

	$asset_file = dirname( __DIR__ ) . '/build/summarize-button.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_register_style(
		'ai-experiments-summarize-button',
		plugins_url( 'build/style-summarize-button.css', __DIR__ ),
		$asset['dependencies'],
		$asset['version'],
	);

	$asset_file = dirname( __DIR__ ) . '/build/translate-button-view.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_register_script_module(
		'@ai-experiments/translate-button',
		plugins_url( 'build/translate-button-view.js', __DIR__ ),
		array( '@wordpress/interactivity' ),
		$asset['version'],
	);

	$asset_file = dirname( __DIR__ ) . '/build/translate-button.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_register_style(
		'ai-experiments-translate-button',
		plugins_url( 'build/style-translate-button.css', __DIR__ ),
		$asset['dependencies'],
		$asset['version'],
	);
}

add_action( 'init', __NAMESPACE__ . '\register_frontend_assets' );


/**
 * Registers the translate button block.
 */
function register_translate_button_block() {
	register_block_type(
		dirname( __DIR__ ) . '/build/translate-button',
		[
			'render_callback' => __NAMESPACE__ . '\render_translate_block',
		]
	);
}

add_action( 'init', __NAMESPACE__ . '\register_translate_button_block' );

/**
 * Render callback for the translate block.
 *
 * @param array<string, mixed> $attributes Block attributes.
 * @param string               $content    Block content.
 * @param WP_Block             $block      Block instance.
 * @return string Rendered block type output.
 */
function render_translate_block( $attributes, string $content, WP_Block $block ) {
	wp_enqueue_script_module( '@ai-experiments/translate-button' );
	wp_enqueue_style( 'ai-experiments-translate-button' );

	// TODO: Figure out why the stylesheet is not enqueued the regular way.
	// TODO: Only load it once.
	wp_add_inline_style(
		'wp-block-library',
		file_get_contents(
			plugin_dir_path( __DIR__ ) . 'build/style-translate-button.css'
		)
	);

	$context = [
		'isTranslatable'       => false,
		'isLoading'            => false,
		'isShowingTranslation' => false,
		'translation'          => null,
		'commentId'            => $block->context['commentId'],
		'buttonText'           => __( 'Translate', 'ai-experiments' ),
		'sourceLanguage'       => explode( '_', get_locale() )[0],
		'targetLanguage'       => explode( '_', get_locale() )[0],
	];

	ob_start();
	?>
	<div
		<?php echo WP_Block_Supports::$block_to_render ? get_block_wrapper_attributes() : ''; ?>
		<?php echo wp_interactivity_data_wp_context( $context ); ?>
		data-wp-interactive="ai-experiments/translate-button"
	>
		<button
			class="ai-translation-button wp-block-button__link is-style-outline is-layout-flex"
			data-wp-init="callbacks.checkIfTranslatable"
			data-wp-on-async--click="actions.translateText"
			data-wp-class--visible="context.isTranslatable"
			data-wp-bind--disabled="context.isLoading"
			data-wp-watch="callbacks.isTranslatable"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				height="24"
				viewBox="0 -960 960 960"
				width="24"
				fill="#5f6368"
			>
				<path d="M480-80q0-83-31.5-156T363-363q-54-54-127-85.5T80-480q83 0 156-31.5T363-597q54-54 85.5-127T480-880q0 83 31.5 156T597-597q54 54 127 85.5T880-480q-83 0-156 31.5T597-363q-54 54-85.5 127T480-80Z" />
			</svg>

			<span data-wp-text="context.buttonText">
				<?php esc_html_e( 'Translate', 'ai-experiments' ); ?>
			</span>
		</button>
		<div class="ai-translation-text" data-wp-text="context.translation" data-wp-class--visible="state.hasTranslation"></div>
	</div>
	<?php
	return (string) ob_get_clean();
}
