/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

async function summarizePostContent() {
	const summarizer = await window.ai.summarizer.create();
	const postContent =
		document.querySelector( '.wp-block-post-content' )?.textContent || '';
	return summarizer.summarize( postContent );
}

const { state, actions } = store(
	'ai-experiments/summarize-button',
	{
		state: {
			overlayEnabled: false,
			summary: null,
			buttonText: 'Summarize post content',
			get isLoading(): boolean {
				return state.overlayEnabled && state.summary === null;
			},
			get isReady(): boolean {
				return state.overlayEnabled && state.summary !== null;
			},
		},
		actions: {
			*showLightbox() {
				state.overlayEnabled = true;

				if ( state.summary === null ) {
					state.buttonText = 'Loading...';

					state.summary = yield summarizePostContent();
				}

				state.buttonText = 'Summarize post content';
			},
			hideLightbox() {
				state.overlayEnabled = false;
			},
			handleKeydown( event: KeyboardEvent ) {
				if ( state.overlayEnabled ) {
					if ( event.key === 'Escape' ) {
						actions.hideLightbox();
					}
				}
			},
		},
		callbacks: {
			toggleModal: () => {
				const dialog = document.querySelector(
					'.ai-summary-lightbox-overlay'
				) as HTMLDialogElement;

				if ( state.overlayEnabled ) {
					dialog.showModal();
				} else {
					dialog.close();
				}
			},
		},
	},
	{ lock: true }
);
