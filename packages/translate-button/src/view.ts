/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

function languageTagToHumanReadable(
	languageTag: string,
	targetLanguage: string
) {
	const displayNames = new Intl.DisplayNames( [ targetLanguage ], {
		type: 'language',
	} );
	return displayNames.of( languageTag );
}

export async function detectSourceLanguage(
	textToTranslate: string
): Promise< string | null > {
	const languageDetectorCapabilities =
		// @ts-ignore
		await window.ai.languageDetector.capabilities();

	// Otherwise, let's detect the source language.
	if ( languageDetectorCapabilities.available !== 'no' ) {
		if ( languageDetectorCapabilities.available === 'after-download' ) {
			// eslint-disable-next-line no-console
			console.log(
				'Language detection is available, but something will have to be downloaded. Hold tight!'
			);
		}

		// @ts-ignore
		const detector = await window.ai.languageDetector.create();
		const [ bestResult ] = await detector.detect( textToTranslate );

		if (
			bestResult.detectedLangauge === null ||
			bestResult.confidence < 0.4
		) {
			// Return null to indicate no translation should happen.
			// It's probably mostly punctuation or something.
			return null;
		}

		return bestResult.detectedLanguage;
	}

	// If `languageDetectorCapabilities.available === "no"`, then assume the source language is the
	// same as the document language.
	return document.documentElement.lang;
}

export async function translate( content: string, targetLanguage: string ) {
	const sourceLanguage = await detectSourceLanguage( content );

	if ( null === sourceLanguage ) {
		// eslint-disable-next-line no-console
		console.log( 'Language detection failed. Do not translate' );
		return null;
	}

	// const translatorCapabilities =
	// 	await window.ai.languageModel.capabilities();

	// Now we've figured out the source language. Let's translate it!
	// Note how we can just check `translatorCapabilities.languagePairAvailable()` instead of also checking
	// `translatorCapabilities.available`.

	// const availability = translatorCapabilities.languagePairAvailable(
	// 	sourceLanguage,
	// 	targetLanguage
	// );
	// if ( availability === 'no' ) {
	// 	console.warn(
	// 		'Translation is not available. Need to use Cloud API.'
	// 	);
	// 	setInProgress( false );
	// }
	//
	// if ( availability === 'after-download' ) {
	// 	console.log(
	// 		'Translation is available, but something will have to be downloaded. Hold tight!'
	// 	);
	// }

	const translator = await window.translation.createTranslator( {
		sourceLanguage,
		targetLanguage,
	} );

	// eslint-disable-next-line no-console
	console.log( translator, 'translate' in translator );

	return translator.translate( content );
}

type BlockContext = {
	commentId: number | null;
	isTranslatable: boolean | null;
	isLoading: boolean;
	isShowingTranslation: boolean;
	buttonText: string;
	sourceLanguage: string;
	targetLanguage: string;
	translation: string | null;
};

store(
	'ai-experiments/translate-button',
	{
		state: {
			get hasTranslation() {
				const { translation, isShowingTranslation } =
					getContext< BlockContext >();
				return translation !== null && isShowingTranslation;
			},
		},
		actions: {
			*translateText() {
				const context = getContext< BlockContext >();

				if ( context.isShowingTranslation ) {
					context.isShowingTranslation = false;
					return;
				}

				if ( ! context.translation ) {
					if ( context.commentId ) {
						const commentContent: HTMLElement =
							document.querySelector(
								`#comment-${ context.commentId } .wp-block-comment-content`
							) as HTMLElement;

						if ( ! commentContent.textContent ) {
							return;
						}

						context.isLoading = true;
						// context.buttonText = `Translating from ${ languageTagToHumanReadable(
						// 	context.sourceLanguage,
						// 	context.targetLanguage
						// ) }`;

						// TODO: Alternatively, use navigator.language as target.
						context.translation = yield translate(
							commentContent.textContent,
							context.targetLanguage
						);

						// context.buttonText = `Translate from ${ languageTagToHumanReadable(
						// 	context.sourceLanguage,
						// 	context.targetLanguage
						// ) }`;
					} else {
						const postContent =
							document.querySelector( '.wp-block-post-content' )
								?.textContent || '';

						context.isLoading = true;

						context.translation = yield translate(
							postContent,
							context.targetLanguage
						);
					}
				}

				context.isLoading = false;
				context.isShowingTranslation = true;
			},
		},
		callbacks: {
			async checkIfTranslatable() {
				const context = getContext< BlockContext >();

				// We're translating a comment into the same language as the post.
				if ( context.commentId ) {
					const commentContent = document.querySelector(
						`#comment-${ context.commentId } .wp-block-comment-content`
					);

					if ( ! commentContent || ! commentContent.textContent ) {
						return;
					}

					const detectedLanguage = await detectSourceLanguage(
						commentContent.textContent
					);

					if ( ! detectedLanguage ) {
						return;
					}

					if ( context.targetLanguage !== detectedLanguage ) {
						context.isTranslatable = true;
						context.sourceLanguage = detectedLanguage;
						context.buttonText = `Translate from ${ languageTagToHumanReadable(
							detectedLanguage,
							context.targetLanguage
						) }`;
					}
				} else {
					const postContent =
						document.querySelector( '.wp-block-post-content' )
							?.textContent || '';

					const detectedLanguage =
						await detectSourceLanguage( postContent );

					if ( ! detectedLanguage ) {
						return;
					}

					context.targetLanguage =
						navigator.language.split( '-' )[ 0 ];

					if ( context.targetLanguage !== detectedLanguage ) {
						context.isTranslatable = true;
						context.sourceLanguage = detectedLanguage;
						context.buttonText = `Translate from ${ languageTagToHumanReadable(
							detectedLanguage,
							context.targetLanguage
						) }`;
					}
				}
			},
		},
	},
	{ lock: true }
);
