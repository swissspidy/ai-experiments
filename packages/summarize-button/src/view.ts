/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

async function summarizePostContent() {
	const postContent =
		document.querySelector( '.wp-block-post-content' )?.textContent || '';
	const summarizer = await Summarizer.create( {
		sharedContext: 'A blog post',
		format: 'plain-text',
	} );
	return summarizer.summarize( postContent, {
		context: 'Avoid any toxic language and be as constructive as possible.',
	} );
}

async function summarizeComments() {
	let allComments = '';
	document
		.querySelectorAll( '.wp-block-comment-content' )
		.forEach( ( node ) => ( allComments += node.textContent + '\n\n' ) );
	const summarizer = await Summarizer.create( {
		sharedContext: 'A list of user-generated comments on a blog post',
		format: 'plain-text',
		type: 'tldr',
	} );
	return summarizer.summarize( allComments, {
		context: 'Avoid any toxic language and be as constructive as possible.',
	} );
}

type BlockContext = {
	summaryContext: string;
	summary: string;
	isOpen: boolean;
	isLoading: boolean;
	buttonText: string;
};

store(
	'ai-experiments/summarize-button',
	{
		state: {
			get isLoading(): boolean {
				const context = getContext< BlockContext >();
				return context.isOpen && ! context.summary;
			},
		},
		actions: {
			*generateSummary() {
				const context = getContext< BlockContext >();

				context.isOpen = ! context.isOpen;

				if ( ! context.summary ) {
					context.isLoading = true;
					context.buttonText = 'Loading...';

					if ( 'post' === context.summaryContext ) {
						context.summary = yield summarizePostContent();
					} else {
						context.summary = yield summarizeComments();
					}

					context.buttonText = 'Read AI-generated summary';
					context.isLoading = false;
				}
			},
		},
		callbacks: {
			closeSummary: () => {
				const context = getContext< BlockContext >();

				context.isOpen = ! context.isOpen;
				context.buttonText = 'Read AI-generated summary';
			},
		},
	},
	{ lock: true }
);
