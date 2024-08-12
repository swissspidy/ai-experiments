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

	ob_start();
	?>
	<div
			<?php echo WP_Block_Supports::$block_to_render ? get_block_wrapper_attributes() : ''; ?>
	>
		<button
				class="ai-summary-button wp-block-button__link is-layout-flex"
				data-wp-interactive="ai-experiments/summarize-button"
				data-wp-on-async--click="actions.showLightbox"
				data-wp-class--visible="state.overlayEnabled"
				data-wp-class--loading="state.isLoading"
				data-wp-bind--disabled="state.isLoading"
				data-wp-watch="callbacks.toggleModal"
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

			<span data-wp-text="state.buttonText">
				<?php esc_html_e( 'Summarize post content', 'ai-experiments' ); ?>
			</span>
		</button>
	</div>
	<?php
	return (string) ob_get_clean();
}

/**
 * Renders the post summary overlay.
 */
function render_summary_overlay() {
	?>
		<dialog
			class="ai-summary-lightbox-overlay"
			data-wp-interactive="ai-experiments/summarize-button"
			data-wp-on--keydown="actions.handleKeydown"
			>
			<form method="dialog">
				<button type="button" aria-label="<?php esc_attr_e( 'Close', 'ai-experiments' ); ?>" class="close-button" data-wp-on-async--click="actions.hideLightbox">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>
				</button>
			</form>
			<div data-wp-text="state.summary" data-wp-class--visible="state.isReady" class="summary"></div>
			<div data-wp-class--visible="state.isLoading" class="loading">
				<?php esc_html_e( 'Generating summary...', 'ai-experiments' ); ?>
			</div>
		</dialog>
	<?php
}

add_action( 'wp_footer', __NAMESPACE__ . '\render_summary_overlay' );

/**
 * Filters the summarize button block to inherit the a
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
}

add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );


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
}

add_action( 'init', __NAMESPACE__ . '\register_frontend_assets' );
