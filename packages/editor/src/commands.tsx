/**
 * WordPress dependencies
 */
// @ts-ignore
import { useCommandLoader } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { pasteHandler, serialize, createBlock } from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';

const PenSparkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24px"
		viewBox="0 -960 960 960"
		width="24px"
		fill="#5f6368"
	>
		<path d="M240-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T857-647L330-120H160Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28ZM260-480q0-92-64-156T40-700q92 0 156-64t64-156q0 92 64 156t156 64q-92 0-156 64t-64 156Z" />
	</svg>
);

const LabelAutoIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24px"
		viewBox="0 -960 960 960"
		width="24px"
		fill="#5f6368"
	>
		<path d="M480-480ZM200-200q-33 0-56.5-23.5T120-280v-200h80v200h400l142-200-142-200h-79v-80h79q20 0 37.5 9t28.5 25l174 246-174 246q-11 16-28.5 25t-37.5 9H200Zm60-280q0-92-64-156T40-700q92 0 156-64t64-156q0 92 64 156t156 64q-92 0-156 64t-64 156Z" />
	</svg>
);

const LightBulbTipsIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24px"
		viewBox="0 -960 960 960"
		width="24px"
		fill="#5f6368"
	>
		<path d="M176-280q-62-37-99-100T40-520q0-117 81.5-198.5T320-800q117 0 198.5 81.5T600-520q0 77-37 140t-99 100H176Zm24-80h240q38-29 59-70.5t21-89.5q0-83-58.5-141.5T320-720q-83 0-141.5 58.5T120-520q0 48 21 89.5t59 70.5Zm-24 200v-80h288v80H176ZM320-40q-33 0-56.5-23.5T240-120h160q0 33-23.5 56.5T320-40Zm420-519q0-75-53-128t-128-53q75 0 128-52.5T740-920q0 75 52.5 127.5T920-740q-75 0-127.5 53T740-559ZM320-360Z" />
	</svg>
);

const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};

function useAICommandLoader() {
	const { editPost } = useDispatch( editorStore );
	const {
		replaceBlock,
		insertBlock,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );

	const [ isLoading ] = useState( false );

	const { postContent } = useSelect( ( select ) => {
		const content =
			new window.DOMParser().parseFromString(
				// @ts-ignore
				serialize( select( blockEditorStore ).getBlocks() ),
				'text/html'
			).body.textContent || '';
		return {
			postContent: content,
		};
	}, [] );

	const { termsList } = useSelect( ( select ) => {
		// @ts-ignore
		const { getEntityRecords, getTaxonomies } = select( coreStore );

		// @ts-ignore
		const postType = select( editorStore ).getCurrentPostType();

		// @ts-ignore
		const _taxonomies = getTaxonomies( {
			per_page: -1,
		} );
		const visibleTaxonomies = ( _taxonomies ?? [] ).filter(
			( taxonomy: {
				types: string[];
				visibility?: { show_ui: boolean };
			} ) =>
				// In some circumstances .visibility can end up as undefined so optional chaining operator required.
				// https://github.com/WordPress/gutenberg/issues/40326
				taxonomy.types.includes( postType ) &&
				taxonomy.visibility?.show_ui
		);

		const termsPerTaxonomy = Object.fromEntries(
			visibleTaxonomies.map( ( { slug }: { slug: string } ) => {
				return [
					slug,
					// @ts-ignore
					getEntityRecords( 'taxonomy', slug, DEFAULT_QUERY ),
				];
			} )
		);

		// eslint-disable-next-line @typescript-eslint/no-shadow
		const termsList = (
			visibleTaxonomies?.map( ( { slug }: { slug: string } ) => {
				return `Taxonomy: ${ slug }:\n\n${
					termsPerTaxonomy[ slug ]
						?.map(
							( {
								name: term,
								id,
							}: {
								name: string;
								id: number;
							} ) => `* ${ term } (ID: ${ id })`
						)
						.join( '\n' ) || ''
				}`;
			} ) || []
		).join( '\n\n' );

		return {
			termsList,
		};
	}, [] );

	const commands = [
		{
			name: 'ai-experiments/write-excerpt',
			label: __( 'Write excerpt', 'ai-experiments' ),
			icon: <PenSparkIcon />,
			// @ts-ignore
			callback: async ( { close } ) => {
				close();

				const session = await window.ai.assistant.create();

				const stream = session.promptStreaming(
					`Summarise the following text in full sentences in less than 300 characters: ${ postContent }`
				);

				let result = '';

				for await ( const value of stream ) {
					// Each result contains the full data, not just the incremental part.
					result = value;

					editPost( { excerpt: result }, { isCached: true } );
				}

				result = result.replaceAll( '\n\n\n\n', '\n\n' );

				editPost( { excerpt: result } );
			},
		},
		{
			name: 'ai-experiments/assign-tags',
			label: __( 'Assign tags and categories', 'ai-experiments' ),
			icon: <LabelAutoIcon />,
			// @ts-ignore
			callback: async ( { close } ) => {
				close();

				const session = await window.ai.assistant.create( {
					initialPrompts: [
						{
							role: 'system',
							content: `You are a content assistant tasked with categorizing given content with the correct terms.

The following terms exist on the site:

${ termsList }

Given the provided content, determine the most suitable terms to describe the content.
Do not summarize the content. Do not hallucinate.
Provide the output as a comma-separated list of recommended term IDs.
`,
						},
						{
							role: 'user',
							content:
								'This is a presentation about my favorite content management system, WordPress. Go check it out.',
						},
						{
							role: 'assistant',
							content: '10,6',
						},
						{
							role: 'user',
							content: `I love pizza and Drupal!`,
						},
						{
							role: 'assistant',
							content: '1,3,4',
						},
					],
				} );

				const prompt =
					`You are a content assistant tasked with categorizing given content with the correct terms.

The following terms exist on the site:

${ termsList }

Given these terms and provided content, determine the most suitable terms to describe the content.
Do not summarize. Do not hallucinate.
Provide the output as a comma-separated list of numeric term IDs.

Content:

${ postContent }`
						.replaceAll( '\t', '' )
						.replaceAll( '\n\n\n\n', '\n\n' );

				const stream = session.promptStreaming( prompt );

				let result = '';

				for await ( const value of stream ) {
					// Each result contains the full data, not just the incremental part.
					result = value;
				}

				result = result.replaceAll( '\n\n\n\n', '\n\n' );

				const newTermIds = result
					.split( ',' )
					.filter( Boolean )
					.map( ( value ) => Number( value.trim() ) )
					.filter( ( value ) => ! Number.isNaN( value ) );

				// TODO: Map term IDs back to taxonomy rest_base.
				editPost( { tags: newTermIds } );
			},
		},
		{
			name: 'ai-experiments/sentiment',
			label: __( 'Sentiment analysis', 'ai-experiments' ),
			icon: <LightBulbTipsIcon />,
			// @ts-ignore
			callback: async ( { close } ) => {
				close();

				const session = await window.ai.assistant.create();

				const stream = session.promptStreaming(
					`What is the overall vibe of this content? Only respond with "positive" or "negative". Do not provide any explanation for your answer. ${ postContent }`
				);

				let result = '';

				for await ( const value of stream ) {
					// Each result contains the full data, not just the incremental part.
					result = value;
				}

				// eslint-disable-next-line no-alert -- For testing only.
				alert( result );

				close();
			},
		},
		{
			name: 'ai-experiments/generate-quote',
			label: __( 'Generate memorable quote', 'ai-experiments' ),
			icon: <PenSparkIcon />,
			// @ts-ignore
			callback: async ( { close } ) => {
				close();

				const session = await window.ai.assistant.create();

				const stream = session.promptStreaming(
					`You are a writing assistant tasked with providing feedback on content and rephrasing texts to make them more readable and contain less errors. From the following user-provided text, extract a short, memorable quote that can be easily shared in a tweet. The text is in English. Use English (US) grammer. Do not make spelling mistakes. Here is the text:
					${ postContent }`
				);

				let result = '';

				const quoteBlock = createBlock( 'core/quote', {}, [
					createBlock( 'core/paragraph', {
						content: __( 'Generating…', 'ai-experiments' ),
					} ),
				] );
				let newClientId = quoteBlock.clientId;

				insertBlock( quoteBlock, 0 );

				for await ( const value of stream ) {
					// Each result contains the full data, not just the incremental part.
					result = value.replaceAll( '\n\n\n\n', '\n\n' );
					result = `<blockquote>${ result }</blockquote>`;

					void __unstableMarkNextChangeAsNotPersistent();

					const parsedBlocks = pasteHandler( {
						plainText: result,
						mode: 'BLOCKS',
					} );
					if ( parsedBlocks.length > 0 ) {
						replaceBlock( newClientId, parsedBlocks );
						newClientId = parsedBlocks[ 0 ].clientId;
					}
				}

				void __unstableMarkLastChangeAsPersistent();

				close();
			},
		},
	];

	return {
		commands,
		isLoading,
	};
}

function RenderPlugin() {
	useCommandLoader( {
		name: 'ai-experiments/ai-commands',
		hook: useAICommandLoader,
	} );
	return null;
}

registerPlugin( 'ai-experiments', {
	render: RenderPlugin,
} );
