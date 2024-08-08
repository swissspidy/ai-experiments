declare global {
	interface AI {
		canCreateTextSession(): Promise< AIModelAvailability >;
		createTextSession(
			opts?: AITextSessionOptions
		): Promise< AITextSession >;
		defaultTextSessionOptions(): Promise< AITextSessionOptions >;
		summarizer: AISummarizerFactory;
	}

	type AIModelAvailability = 'readily' | 'after-download' | 'no';

	interface AISummarizerFactory {
		create(): Promise< AISummarizer >;
		capabilities(): Promise< AISummarizerCapabilities >;
	}

	interface AISummarizerCapabilities {
		available: AIModelAvailability;
	}

	interface AISummarizer extends EventTarget {
		available: AIModelAvailability;
		ready: Promise< undefined >;
		summarize( prompt: string ): Promise< string >;
	}

	interface AITextSession {
		promptStreaming( input: string ): IterableIterator< string >;
		prompt( input: string ): Promise< string >;
		destroy(): void;
		clone(): AITextSession;
	}

	interface InitialPrompt {
		role: string;
		content: string;
	}

	interface AssistantPrompt extends InitialPrompt {
		role: 'assistant';
		content: string;
	}

	interface UserPrompt extends InitialPrompt {
		role: 'user';
		content: string;
	}

	interface SystemPrompt extends InitialPrompt {
		role: 'system';
	}

	interface AITextSessionOptions {
		temperature?: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
		topK?: number;
		systemPrompt?: string;
		initialPrompts?: [
			SystemPrompt,
			...Array< UserPrompt | AssistantPrompt >,
		];
	}

	interface WindowOrWorkerGlobalScope {
		ai: AI;
	}
}

export type {};
