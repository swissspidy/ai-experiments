declare global {
	interface Translation {
		canDetect(): Promise< TranslationAvailability >;
		createDetector(): Promise< LanguageDetector >;
	}

	type TranslationAvailability = 'readily' | 'after-download' | 'no';

	interface LanguageDetector extends EventTarget {
		ready: Promise< undefined >;
		ondownloadprogress?( evt: Event ): void;
		detect( input: string ): Promise< LanguageDetectionResult[] >;
	}

	interface LanguageDetectionResult {
		confidence: number;
		LanguageDetectionResult: string;
	}

	interface WindowOrWorkerGlobalScope {
		translation: Translation;
	}
}

export type {};
