import { registerFormatType } from '@wordpress/rich-text';

registerFormatType( 'ai-experiments/autocomplete', {
	name: 'ai-experiments/autocomplete',
	title: 'Autocomplete',
	tagName: 'samp',
	className: 'aiwp-autocomplete',
	interactive: false,
	edit: () => null,
	object: false,
} );
