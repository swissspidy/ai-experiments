import { createPortal, useLayoutEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { registerPlugin } from '@wordpress/plugins';
import { store as editorStore } from '@wordpress/editor';

import { Menu } from './menu';

function WrappedMenu() {
	const root = useRef< HTMLDivElement | null >( null );
	const referenceNode = useRef< HTMLDivElement | null >( null );

	const { isEditedPostSaveable } = useSelect( ( select ) => {
		return {
			isEditedPostSaveable: select( editorStore ).isEditedPostSaveable(),
		};
	}, [] );

	useLayoutEffect( () => {
		// The upload status indicator should always be inserted right before any other buttons.
		referenceNode.current = document.querySelector(
			'.edit-post-header__settings'
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
