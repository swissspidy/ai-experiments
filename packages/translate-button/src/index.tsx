import { registerBlockType } from '@wordpress/blocks';

import './style.css';

import Edit from './edit';
import metadata from './block.json';

const SparkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24"
		viewBox="0 -960 960 960"
		width="24"
		fill="#5f6368"
	>
		<path d="M480-80q0-83-31.5-156T363-363q-54-54-127-85.5T80-480q83 0 156-31.5T363-597q54-54 85.5-127T480-880q0 83 31.5 156T597-597q54 54 127 85.5T880-480q-83 0-156 31.5T597-363q-54 54-85.5 127T480-80Z" />
	</svg>
);

// @ts-ignore
registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	icon: SparkIcon,
} );
