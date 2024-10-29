declare global {
	interface Translation {
		canTranslate(): Promise< TranslationAvailability >;
		createTranslator(
			options: CreateTranslatorArgs
		): Promise< Translator >;
	}

	interface CreateTranslatorArgs {
		sourceLanguage: Intl.UnicodeBCP47LocaleIdentifier;
		targetLanguage: Intl.UnicodeBCP47LocaleIdentifier;
	}

	type TranslationAvailability = 'readily' | 'after-download' | 'no';

	interface Translator extends EventTarget {
		ready: Promise< undefined >;
		ondownloadprogress?( evt: Event ): void;
		translate( input: string ): Promise< string >;
	}

	interface WindowOrWorkerGlobalScope {
		translation: Translation;
	}
}

export type {};
