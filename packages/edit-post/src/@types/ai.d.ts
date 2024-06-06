declare global {
	interface AI {
		canCreateTextSession(
			opts?: AITextSessionOptions
		): Promise< 'no' | 'readily' >;
		createTextSession(): Promise< AITextSession >;
		defaultTextAITextSessionOptions(): Promise<AITextSessionOptions>
	}

	interface AITextSession {
		executeStreaming( prompt: string ): IterableIterator< string >;
		execute( prompt: string ): Promise< string >;
		promptStreaming( prompt: string ): IterableIterator< string >;
		prompt( prompt: string ): Promise< string >;
	}

	interface AITextSessionOptions {
		temperature: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
		topK: number;
	}

	interface Window {
		ai: AI;
	}
}

export type {};
