import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { pasteHandler, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

const penSparkIcon = () => (
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

// @ts-ignore
export function ParagraphControls( { setAttributes, clientId } ) {
	const {
		replaceBlock,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );
	const { getBlock } = useSelect( ( select ) => {
		return {
			getBlock:
				// @ts-ignore
				select( blockEditorStore ).getBlock,
		};
	}, [] );

	const [ inProgress, setInProgress ] = useState( false );

	async function rewrite( type: string ) {
		setInProgress( true );

		const postContent = serialize( [ getBlock( clientId ) ] );

		const session = await window.ai.createTextSession( {
			systemPrompt:
				'You are a writing assistant tasked with providing feedback on content and rephrasing texts to make them more readable and contain less errors. Retain HTML markup and hyperlinks in the content.',
		} );

		let prompt: string = '';

		switch ( type ) {
			case 'rephrase':
			default:
				prompt = `Rephrase the following paragraph using full sentences and valid HTML markup:\n\n ${ postContent }`;
				break;

			case 'bulletize':
				prompt = `Summarize the following text using bullet points in valid Markdown format and valid HTML, fully retaining any hyperlinks:\n\n ${ postContent }`;
				break;

			case 'summarize':
				prompt = `Summarise the following text in full sentences:\n\n ${ postContent }`;
				break;

			case 'elaborate':
				prompt = `Expand and elaborate on the following text:\n\n ${ postContent }`;
				break;

			case 'shorten':
				prompt = `Make the following text shorter:\n\n ${ postContent }`;
				break;
		}

		const stream = session.promptStreaming( prompt );

		let result = '';

		let newClientId = clientId;

		for await ( const value of stream ) {
			// Each result contains the full data, not just the incremental part.
			result = value.replaceAll( '\n\n\n\n', '\n\n' );

			void __unstableMarkNextChangeAsNotPersistent();

			if ( 'bulletize' === type ) {
				const parsedBlocks = pasteHandler( {
					plainText: result,
					mode: 'BLOCKS',
				} );
				if ( parsedBlocks.length > 0 ) {
					replaceBlock( newClientId, parsedBlocks );
					newClientId = parsedBlocks[ 0 ].clientId;
				}
			} else {
				void setAttributes( {
					content: result,
				} );
			}
		}

		void __unstableMarkLastChangeAsPersistent();

		setInProgress( false );
	}

	const controls = [
		{
			title: __( 'Summarize', 'ai-experiments' ),
			onClick: () => rewrite( 'summarize' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Bulletize', 'ai-experiments' ),
			onClick: () => rewrite( 'bulletize' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Elaborate', 'ai-experiments' ),
			onClick: () => rewrite( 'elaborate' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Shorten', 'ai-experiments' ),
			onClick: () => rewrite( 'shorten' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Rephrase', 'ai-experiments' ),
			onClick: () => rewrite( 'rephrase' ),
			role: 'menuitemradio',
			icon: undefined,
		},
	];

	return (
		<BlockControls group="inline">
			<ToolbarDropdownMenu
				label={ __( 'Help me write', 'ai-experiments' ) }
				icon={ penSparkIcon }
				controls={ controls }
				toggleProps={ {
					disabled: inProgress,
				} }
			/>
		</BlockControls>
	);
}
