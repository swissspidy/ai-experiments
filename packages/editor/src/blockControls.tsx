import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

import { ParagraphControls } from './blockControls/paragraphControls';
import { ImageControls } from './blockControls/imageControls';

const addAiControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name === 'core/paragraph' ) {
			return (
				<>
					<BlockEdit { ...props } />
					<ParagraphControls { ...props } />
				</>
			);
		}

		if ( props.name === 'core/image' ) {
			return (
				<>
					<BlockEdit { ...props } />
					<ImageControls { ...props } />
				</>
			);
		}

		return <BlockEdit { ...props } />;
	},
	'withAiControls'
);

addFilter(
	'editor.BlockEdit',
	'ai-experiments/add-ai-controls',
	addAiControls
);
