declare global {
	interface ModelManager {
		canCreateGenericSession(
			opts?: SessionOptions
		): Promise< 'no' | 'readily' >;

		createGenericSession(): Promise< ModelGenericSession >;
	}

	interface ModelGenericSession {
		executeStreaming( prompt: string ): IterableIterator< string >;
		execute( prompt: string ): Promise< string >;
	}

	interface SessionOptions {
		temperature: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
		topK: number;
	}

	interface Window {
		model: ModelManager;
	}
}

export type {};
