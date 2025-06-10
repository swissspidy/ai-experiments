export async function detectSourceLanguage(
	textToTranslate: string
): Promise< string | null > {
	const availability = await LanguageDetector.availability();

	// Otherwise, let's detect the source language.
	if ( availability !== 'unavailable' ) {
		if ( availability !== 'available' ) {
			// eslint-disable-next-line no-console
			console.log(
				'Language detection is available, but something will have to be downloaded. Hold tight!'
			);
		}

		// @ts-ignore
		const detector = await LanguageDetector.create();
		const [ bestResult ] = await detector.detect( textToTranslate );

		if (
			bestResult.detectedLanguage === null ||
			( bestResult.confidence && bestResult.confidence < 0.4 )
		) {
			// Return null to indicate no translation should happen.
			// It's probably mostly punctuation or something.
			return null;
		}

		return bestResult.detectedLanguage || null;
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
	// 	await LanguageModel.capabilities();

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

	const translator = await Translator.create( {
		sourceLanguage,
		targetLanguage,
	} );

	// eslint-disable-next-line no-console
	console.log( translator, 'translate' in translator );

	return translator.translate( content );
}
