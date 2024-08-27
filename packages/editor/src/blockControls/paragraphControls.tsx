import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
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

		let tone: AIRewriterTone = 'as-is';
		let length: AIRewriterLength = 'as-is';

		switch ( type ) {
			case 'rephrase':
			default:
				break;

			case 'longer':
				length = 'longer';
				break;

			case 'shorter':
				length = 'shorter';
				break;

			case 'formal':
				tone = 'more-formal';
				break;

			case 'informal':
				tone = 'more-casual';
				break;
		}

		const rewriter = await window.ai.rewriter.create( {
			sharedContext: 'A blog post',
			tone,
			length,
		} );

		const stream = await rewriter.rewriteStreaming( postContent, {
			context:
				'Avoid any toxic language and be as constructive as possible.',
		} );

		let result = '';

		for await ( const value of stream ) {
			// Each result contains the full data, not just the incremental part.
			result = value;

			void __unstableMarkNextChangeAsNotPersistent();

			void setAttributes( {
				content: result,
			} );
		}

		void __unstableMarkLastChangeAsPersistent();

		setInProgress( false );
	}

	async function summarize() {
		setInProgress( true );

		const postContent = serialize( [ getBlock( clientId ) ] );

		const summarizer = await window.ai.summarizer.create( {
			sharedContext: 'A blog post',
		} );

		const stream = await summarizer.summarizeStreaming( postContent, {
			context:
				'Avoid any toxic language and be as constructive as possible.',
		} );

		let result = '';

		for await ( const value of stream ) {
			// Each result contains the full data, not just the incremental part.
			result = value.replaceAll( '\n\n\n\n', '\n\n' );

			void __unstableMarkNextChangeAsNotPersistent();

			void setAttributes( {
				content: result,
			} );
		}

		void __unstableMarkLastChangeAsPersistent();

		setInProgress( false );
	}

	const controls = [
		{
			title: __( 'Summarize', 'ai-experiments' ),
			onClick: () => summarize(),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Rephrase', 'ai-experiments' ),
			onClick: () => rewrite( 'rephrase' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Elaborate', 'ai-experiments' ),
			onClick: () => rewrite( 'longer' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Shorten', 'ai-experiments' ),
			onClick: () => rewrite( 'shorter' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Formal', 'ai-experiments' ),
			onClick: () => rewrite( 'formal' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Informal', 'ai-experiments' ),
			onClick: () => rewrite( 'informal' ),
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
