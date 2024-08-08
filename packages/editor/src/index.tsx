import {
	createPortal,
	Fragment,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { registerPlugin } from '@wordpress/plugins';
import { store as editorStore } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';

import { Menu } from './menu';
import { serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

function WrappedMenu() {
	const root = useRef< HTMLDivElement | null >( null );
	const referenceNode = useRef< HTMLDivElement | null >( null );

	const { isEditedPostSaveable } = useSelect( ( select ) => {
		return {
			// @ts-ignore
			isEditedPostSaveable: select( editorStore ).isEditedPostSaveable(),
		};
	}, [] );

	useLayoutEffect( () => {
		// The button should always be inserted right before any other buttons.
		referenceNode.current = document.querySelector(
			'.editor-header__settings'
		);

		if ( referenceNode.current ) {
			if ( ! root.current ) {
				root.current = document.createElement( 'div' );
				root.current.className = 'ai-experiments-menu';
			}

			referenceNode.current.prepend( root.current );
		}

		return () => {
			if ( referenceNode.current && root.current ) {
				referenceNode.current.removeChild( root.current );
				referenceNode.current = null;
			}
		};

		// The button should be "refreshed" whenever settings in the post editor header are re-rendered.
		// - When saveable property changes, the toolbar is reshuffled heavily.
	}, [ isEditedPostSaveable ] );

	return root.current ? createPortal( <Menu />, root.current ) : null;
}

registerPlugin( 'ai-experiments-menu', {
	render: WrappedMenu,
} );

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

const addAiControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const {
			updateBlock,
			__unstableMarkNextChangeAsNotPersistent,
			__unstableMarkLastChangeAsPersistent,
		} = useDispatch( blockEditorStore );
		const { getSelectedBlock, getSelectedBlockClientId } = useSelect(
			( select ) => {
				return {
					getSelectedBlock:
						// @ts-ignore
						select( blockEditorStore ).getSelectedBlock,
					getSelectedBlockClientId:
						// @ts-ignore
						select( blockEditorStore ).getSelectedBlockClientId,
				};
			},
			[]
		);

		const [ inProgress, setInProgress ] = useState( false );

		if ( props.name !== 'core/paragraph' ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<BlockControls group="inline">
					<ToolbarButton
						label={ __( 'Rephrase paragraph', 'ai-experiments' ) }
						icon={ penSparkIcon }
						isDisabled={ inProgress }
						onClick={ async () => {
							setInProgress( true );

							const postContent =
								new window.DOMParser().parseFromString(
									serialize( [ getSelectedBlock() ] ),
									'text/html'
								).body.textContent || '';

							const session = await window.ai.createTextSession( {
								systemPrompt:
									'You are a writing assistant tasked with providing feedback on content and rephrasing texts to make them more readable and contain less errors.',
							} );

							const stream = session.promptStreaming(
								`Rephrase the following paragraph: ${ postContent }`
							);

							let result = '';

							void __unstableMarkLastChangeAsPersistent();

							for await ( const value of stream ) {
								// Each result contains the full data, not just the incremental part.
								result = value.replaceAll( '\n\n\n\n', '\n\n' );

								void __unstableMarkNextChangeAsNotPersistent();
								void updateBlock( getSelectedBlockClientId(), {
									attributes: {
										content: result,
									},
								} );
							}

							void updateBlock( getSelectedBlockClientId(), {
								attributes: {
									content: result,
								},
							} );
							void __unstableMarkLastChangeAsPersistent();

							setInProgress( false );
						} }
					/>
				</BlockControls>
			</Fragment>
		);
	},
	'withAiControls'
);

addFilter(
	'editor.BlockEdit',
	'ai-experiments/add-ai-controls',
	addAiControls
);
