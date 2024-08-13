import { createWorkerFactory } from '@shopify/web-worker';

import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useState } from '@wordpress/element';

const createAltTextWorker = createWorkerFactory(
	() => import( /* webpackChunkName: 'foo' */ '../workers/altText' )
);

const altTextWorker = createAltTextWorker();

const photoSparkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24"
		viewBox="0 -960 960 960"
		width="24"
		fill="#5f6368"
	>
		<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160 120-160 90 120 120-160 150 200H240Zm460-200q0-92-64-156t-156-64q92 0 156-64t64-156q0 92 64 156t156 64q-92 0-156 64t-64 156Z" />
	</svg>
);

// @ts-ignore
export function ImageControls( { attributes, setAttributes } ) {
	const [ inProgress, setInProgress ] = useState( false );

	if ( ! attributes.url ) {
		return null;
	}

	const controls = [
		{
			title: __( 'Write caption', 'ai-experiments' ),
			onClick: async () => {
				setInProgress( true );

				const task = '<CAPTION>';
				const result = await altTextWorker.runTask(
					attributes.url,
					task
				);

				setAttributes( { caption: result } );

				setInProgress( false );
			},
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Write alternative text', 'ai-experiments' ),
			onClick: async () => {
				setInProgress( true );

				const task = '<MORE_DETAILED_CAPTION>';
				const result = await altTextWorker.runTask(
					attributes.url,
					task
				);

				setAttributes( { alt: result } );

				setInProgress( false );
			},
			role: 'menuitemradio',
			icon: undefined,
		},
	];
	return (
		<BlockControls group="inline">
			<ToolbarDropdownMenu
				label={ __( 'Help me write', 'ai-experiments' ) }
				icon={ photoSparkIcon() }
				controls={ controls }
				toggleProps={ {
					disabled: inProgress,
				} }
			/>
		</BlockControls>
	);
}
