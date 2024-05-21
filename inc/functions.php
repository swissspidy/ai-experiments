<?php
/**
 * Collection of functions.
 *
 * @package AiExperiments
 */

declare(strict_types = 1);

namespace AiExperiments;

/**
 * Enqueues scripts for the block editor.
 *
 * @return void
 */
function enqueue_block_editor_assets(): void {
	$asset_file = dirname( __DIR__ ) . '/build/edit-post.asset.php';
	$asset      = is_readable( $asset_file ) ? require $asset_file : [];

	$asset['dependencies'] = $asset['dependencies'] ?? [];
	$asset['version']      = $asset['version'] ?? '';

	wp_enqueue_script(
	  'ai-experiments-edit-post',
	  plugins_url( 'build/edit-post.js', __DIR__ ),
	  $asset['dependencies'],
	  $asset['version'],
	  array(
		'strategy' => 'defer',
	  )
	);

	wp_set_script_translations( 'ai-experiments', 'ai-experiments' );
}

add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );

