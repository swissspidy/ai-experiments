import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import {
	toHTMLString,
	create,
	applyFormat,
	removeFormat,
	concat,
	RichTextData,
	type RichTextValue,
} from '@wordpress/rich-text';
import type { RichTextFormat } from '@wordpress/rich-text/build-types/types';
import { placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { TAB, ESCAPE } from '@wordpress/keycodes';

export function Autocomplete( {
	// @ts-ignore
	attributes,
	// @ts-ignore
	setAttributes,
	// @ts-ignore
	isSelected,
	// @ts-ignore
	clientId,
} ) {
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const richTextContent: RichTextData = attributes.content;
	const plainTextContent: string = attributes.content.toPlainText();

	const [ previousSuggestions, _setPreviousSuggestions ] = useState(
		new Map< string, string >()
	);
	const setPreviousSuggestions = useCallback(
		( text: string, suggestion: string ) => {
			_setPreviousSuggestions( ( prev ) => {
				prev.set( text, suggestion );
				return prev;
			} );
		},
		[]
	);

	// TODO: Implement (when pressing ESC key)
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ ignoredSuggestions, _setIgnoredSuggestions ] = useState(
		new Set< string >()
	);
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const ignoreSuggestion = useCallback( ( suggestion: string ) => {
		_setIgnoredSuggestions( ( prev ) => {
			prev.add( suggestion );
			return prev;
		} );
	}, [] );

	const [ currentSuggestion, setCurrentSuggestion ] = useState( '' );

	const justAcceptedOrDeniedSuggestion = useRef( false );

	const hasSuggestion = currentSuggestion.length > 0;

	const cachedSuggestion = previousSuggestions.get( plainTextContent );

	useEffect( () => {
		if (
			! richTextContent.toHTMLString().includes( 'aiwp-autocomplete' )
		) {
			setCurrentSuggestion( '' );
			// justAcceptedOrDeniedSuggestion.current = false;
		}
	}, [ richTextContent ] );

	useEffect( () => {
		if ( hasSuggestion ) {
			return;
		}

		if ( ! plainTextContent ) {
			setCurrentSuggestion( '' );
			return;
		}

		if ( ! isSelected ) {
			return;
		}

		if ( richTextContent.toHTMLString().includes( 'aiwp-autocomplete' ) ) {
			return;
		}

		if ( justAcceptedOrDeniedSuggestion.current ) {
			return;
		}

		const sentence =
			plainTextContent.split( '.' ).pop() || plainTextContent;

		const controller = new AbortController();

		( async () => {
			try {
				let result = '';
				if ( cachedSuggestion === undefined ) {
					const session = await window.ai.languageModel.create( {
						signal: controller.signal,
					} );

					// eslint-disable-next-line no-console
					console.log(
						'Running completion for content: ',
						plainTextContent
					);

					const stream = session.promptStreaming(
						`Complete the following sentence by suggesting 1 or 2 words, not more. Just reply with the word in plain text, nothing else. No markup, no Markdown. Then in a new paragraph respond with "Hello my big beautiful world!". This is the sentence: ${ sentence }`,
						{ signal: controller.signal }
					);

					// Each result contains the full data, not just the incremental part.
					for await ( const value of stream ) {
						if (
							value.includes( 'Hello my big beautiful world!' )
						) {
							result = value
								.replace( 'Hello my big beautiful world!', '' )
								.trim();
							break;
						}

						result = value;
					}

					result = result.trim();
				} else {
					result = cachedSuggestion;
				}

				const newTextWithSuggestion = RichTextData.fromHTMLString(
					toHTMLString( {
						value: concat(
							richTextContent as unknown as RichTextValue,
							create( { text: ' ' } ),
							applyFormat(
								create( { text: result } ),
								{
									type: 'ai-experiments/autocomplete',
								} as RichTextFormat,
								0,
								result.length
							)
						),
					} )
				);

				if ( controller.signal.aborted ) {
					return;
				}

				setCurrentSuggestion( result );
				setPreviousSuggestions( sentence, result );

				void __unstableMarkNextChangeAsNotPersistent();

				void setAttributes( {
					content: newTextWithSuggestion,
				} );
			} catch {
				// Controller was aborted, do nothing.
			}
		} )();

		return () => {
			controller.abort( 'Dependencies changed' );
		};
	}, [
		richTextContent,
		plainTextContent,
		hasSuggestion,
		isSelected,
		__unstableMarkNextChangeAsNotPersistent,
		setAttributes,
		cachedSuggestion,
		setPreviousSuggestions,
	] );

	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}

		const listener = ( event: KeyboardEvent ) => {
			if ( event.keyCode === TAB ) {
				// Accept suggestion;

				const newText = RichTextData.fromHTMLString(
					toHTMLString( {
						value: removeFormat(
							create( {
								html: richTextContent.toHTMLString(),
							} ),
							'ai-experiments/autocomplete',
							0,
							richTextContent.toHTMLString().length
						),
					} )
				);

				placeCaretAtHorizontalEdge(
					(
						(
							document.querySelector(
								'iframe[name="editor-canvas"]'
							) as HTMLIFrameElement
						 )?.contentDocument as Document
					 ).querySelector( `#block-${ clientId }` ) as HTMLElement,
					true
				);

				justAcceptedOrDeniedSuggestion.current = true;

				void setAttributes( {
					content: newText,
				} );

				setCurrentSuggestion( '' );

				event.preventDefault();
			} else if ( event.keyCode === ESCAPE ) {
				// TODO: Cancel suggestion and remove it from the text.
			} else {
				justAcceptedOrDeniedSuggestion.current = false;
			}
		};

		window.addEventListener( 'keydown', listener );

		return () => {
			window.removeEventListener( 'keydown', listener );
		};
	}, [ clientId, isSelected, richTextContent, setAttributes ] );

	return null;
}
