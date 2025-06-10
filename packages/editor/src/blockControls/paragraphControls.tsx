import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	type BlockInstance,
	getBlockContent,
	serialize,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { RichTextData } from '@wordpress/rich-text';

import { translate as translateString } from '../utils';

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

	const { mostRecentPost } = useSelect( ( select ) => {
		// @ts-ignore
		const postType = select( editorStore ).getCurrentPostType();
		const { getEntityRecords } = select( coreStore );

		// @ts-ignore
		const posts = getEntityRecords( 'postType', postType, {
			per_page: 1,
			status: 'publish',
			_fields: 'id,content',
		} );

		return {
			mostRecentPost: posts && posts.length > 0 ? posts[ 0 ] : null,
		};
	}, [] );

	const [ inProgress, setInProgress ] = useState( false );

	async function write() {
		setInProgress( true );

		const postContent = serialize( [
			getBlock( clientId ) as BlockInstance,
		] );

		let context = `
		Avoid any toxic language and be as constructive as possible.
		`;

		const session = await LanguageModel.create();

		if (
			mostRecentPost &&
			'content' in mostRecentPost &&
			mostRecentPost.content
		) {
			const result = await session?.prompt(
				`
					You are an AI writing assistant. Your goal is to help users with writing tasks by analyzing their writing and writing instructions for generating relevant and high-quality text in the same tone. You do NOT answer questions, you simply write on behalf of a user. Focus on producing error-free and engaging writing. Do not explain your response, just provide the generated instructions.
					Describe the tone of the following text so the same tone can be used for future writing tasks. DO NOT mention the topic of the text itself, focus only on the tone. Respond with instructions that you would give yourself for writing texts in a similar writing style. Use plain-text, NO markup. ONLY respond with the instructions, nothing else. Keep it short.

	This is the text:

	${ mostRecentPost.content.rendered.slice( 0, 500 ) }`
			);

			context += `\n${ result }`;
		}

		const stream = session.promptStreaming(
			`You are an AI writing assistant. Your goal is to help users with writing tasks by generating relevant and high-quality text. You do NOT answer questions, you simply write on behalf of a user. Consider the "input" (writing task) and the "context" (extra information) to tailor your response. Focus on producing error-free and engaging writing. Do not explain your response, just provide the generated text.

Input: ${ postContent }
Context:  ${ context }`
		);

		let result = '';

		for await ( const value of stream ) {
			// Each result contains the full data, not just the incremental part.
			result = value;

			void __unstableMarkNextChangeAsNotPersistent();

			void setAttributes( {
				content: RichTextData.fromPlainText( result ),
			} );
		}

		void __unstableMarkLastChangeAsPersistent();

		setInProgress( false );
	}

	async function rewrite( type: string ) {
		setInProgress( true );

		const postContent = serialize( [
			getBlock( clientId ) as BlockInstance,
		] );

		let tone: RewriterTone = 'as-is';
		let length: RewriterLength = 'as-is';

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

		const rewriter = await Rewriter.create( {
			sharedContext: 'A blog post',
			tone,
			length,
		} );

		const stream = rewriter.rewriteStreaming( postContent, {
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

		const postContent = serialize( [
			getBlock( clientId ) as BlockInstance,
		] );

		const summarizer = await Summarizer.create( {
			sharedContext: 'A blog post',
		} );

		const stream = summarizer.summarizeStreaming( postContent, {
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

	async function translate( targetLanguage: string ) {
		setInProgress( true );

		try {
			const block = getBlock( clientId ) as BlockInstance;
			const blockContent = getBlockContent( block );

			const result = await translateString(
				blockContent,
				targetLanguage
			);

			if ( null === result ) {
				return;
			}

			void setAttributes( {
				content: result,
			} );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.log( 'Error happened', e );
		} finally {
			setInProgress( false );
		}
	}

	const controls = [
		{
			title: __( 'Help me write', 'ai-experiments' ),
			onClick: () => write(),
			role: 'menuitemradio',
			icon: undefined,
		},
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
			title: __( 'Make formal', 'ai-experiments' ),
			onClick: () => rewrite( 'formal' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Make informal', 'ai-experiments' ),
			onClick: () => rewrite( 'informal' ),
			role: 'menuitemradio',
			icon: undefined,
		},
		// TODO: Add ability to choose language.
		{
			title: __( 'Translate', 'ai-experiments' ),
			onClick: () => translate( 'es' ),
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
