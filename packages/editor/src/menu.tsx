import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { DropdownMenu } from '@wordpress/components';

const sparkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24"
		viewBox="0 -960 960 960"
		width="24"
		fill="#5f6368"
	>
		<path d="M480-80q0-83-31.5-156T363-363q-54-54-127-85.5T80-480q83 0 156-31.5T363-597q54-54 85.5-127T480-880q0 83 31.5 156T597-597q54 54 127 85.5T880-480q-83 0-156 31.5T597-363q-54 54-85.5 127T480-80Z" />
	</svg>
);

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

const labelAutoIcon = () => (
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

const lightBulbTipsIcon = () => (
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

export function Menu() {
	const { editPost } = useDispatch( editorStore );
	const { getBlocks, taxonomies, termsPerTaxonomy } = useSelect(
		( select ) => {
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
			return {
				// @ts-ignore
				getBlocks: select( blockEditorStore ).getBlocks,
				// @ts-ignore
				getSelectedBlock: select( blockEditorStore ).getSelectedBlock,
				getSelectedBlockClientId:
					// @ts-ignore
					select( blockEditorStore ).getSelectedBlockClientId,
				taxonomies: visibleTaxonomies,
				termsPerTaxonomy: Object.fromEntries(
					visibleTaxonomies.map( ( { slug }: { slug: string } ) => {
						return [
							slug,
							getEntityRecords( 'taxonomy', slug, DEFAULT_QUERY ),
						];
					} )
				),
			};
		},
		[]
	);

	const termsList = (
		taxonomies?.map( ( { slug }: { slug: string } ) => {
			return `Taxonomy: ${ slug }:\n\n${
				termsPerTaxonomy[ slug ]
					?.map(
						( { name: term, id }: { name: string; id: number } ) =>
							`* ${ term } (ID: ${ id })`
					)
					.join( '\n' ) || ''
			}`;
		} ) || []
	).join( '\n\n' );

	const [ inProgress, setInProgress ] = useState( false );

	return (
		<>
			<DropdownMenu
				controls={ [
					{
						title: __( 'Write excerpt', 'ai-experiments' ),
						icon: penSparkIcon,
						isDisabled: inProgress,
						onClick: async () => {
							setInProgress( true );

							const postContent =
								new window.DOMParser().parseFromString(
									serialize( getBlocks() ),
									'text/html'
								).body.textContent || '';

							const session = await window.ai.createTextSession();

							const stream = session.executeStreaming(
								`Summarise the following text in full sentences in less than 300 characters: ${ postContent }`
							);

							const textArea: HTMLTextAreaElement | null =
								document.querySelector(
									'.editor-post-excerpt textarea'
								);

							let result = '';

							for await ( const value of stream ) {
								// Each result contains the full data, not just the incremental part.
								result = value;

								if ( textArea ) {
									textArea.value = value;
								}
							}

							result = result.replaceAll( '\n\n\n\n', '\n\n' );

							editPost( { excerpt: result } );

							setInProgress( false );
						},
					},
					{
						title: __(
							'Assign tags and categories',
							'ai-experiments'
						),
						icon: labelAutoIcon,
						isDisabled: inProgress,
						onClick: async () => {
							// editPost( { [ taxonomy.rest_base ]: newTermIds } );

							setInProgress( true );

							const postContent =
								new window.DOMParser().parseFromString(
									serialize( getBlocks() ),
									'text/html'
								).body.textContent || '';

							const session = await window.ai.createTextSession();

							const prompt =
								`The following taxonomies and terms exist:

								${ termsList }

								Based on that, determine the most suitable terms to describe the following content.
								Provide the output as a comma-separated list of recommended numeric term IDs.

								Content:

								${ postContent }`
									.replaceAll( '\t', '' )
									.replaceAll( '\n\n\n\n', '\n\n' );

							const stream = session.executeStreaming( prompt );

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

							setInProgress( false );
						},
					},
					{
						title: __( 'Sentiment analysis', 'ai-experiments' ),
						icon: lightBulbTipsIcon,
						isDisabled: inProgress,
						onClick: async () => {
							setInProgress( true );

							const postContent =
								new window.DOMParser().parseFromString(
									serialize( getBlocks() ),
									'text/html'
								).body.textContent || '';

							const session = await window.ai.createTextSession();

							const stream = session.executeStreaming(
								`What is the overall vibe of this content? Only respond with "positive" or "negative". Do not provide any explanation for your answer. ${ postContent }`
							);

							let result = '';

							for await ( const value of stream ) {
								// Each result contains the full data, not just the incremental part.
								result = value;
							}

							// eslint-disable-next-line no-alert -- For testing only.
							alert( result );

							setInProgress( false );
						},
					},
				] }
				icon={ sparkIcon }
				label={ __( 'AI Experiments', 'ai-experiments' ) }
			/>
		</>
	);
}
