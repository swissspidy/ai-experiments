declare global {
	interface AI {
		assistant: AIAssistantFactory;
		summarizer: AISummarizerFactory;
	}

	interface AIAssistantFactory {
		create(
			opts?: AIAssistantCreateOptions
		): Promise< AIAssistant >;
		capabilities(): Promise< AIAssistantCapabilities >
	}

	type AICapabilityAvailability = 'readily' | 'after-download' | 'no';

	interface AISummarizerFactory {
		create(): Promise< AISummarizer >;
		capabilities(): Promise< AISummarizerCapabilities >;
	}

	interface AIAssistantCapabilities {
		available: AICapabilityAvailability;
		defaultTopK?: number | null;
		maxTopK?: number | null;
		defaultTemperature?: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0 | null;
		supportsLanguage(languageTag: string): AICapabilityAvailability
	}

	interface AISummarizerCapabilities {
		available: AICapabilityAvailability;
	}

	interface AISummarizer extends EventTarget {
		ready: Promise< undefined >;
		summarize( input: string ): Promise< string >;
	}

	interface AIAssistant {
		promptStreaming( input: string, options?: AIAssistantPromptOptions ): IterableIterator< string >;
		prompt( input: string, options?: AIAssistantPromptOptions ): Promise< string >;
		countPromptTokens( input: string, options?: AIAssistantPromptOptions ): number;
		destroy(): void;
		clone(): AIAssistant;
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

	interface AIAssistantCreateOptions {
		temperature?: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
		topK?: number;
		systemPrompt?: string;
		initialPrompts?: [
			SystemPrompt,
			...Array< UserPrompt | AssistantPrompt >,
		];
		signal?: AbortSignal;
		monitor?: AICreateMonitorCallback;
	}

	interface AIAssistantPromptOptions {
		signal?: AbortSignal;
	}

	interface AICreateMonitor extends EventTarget {

	}

	type AICreateMonitorCallback = (monitor: AICreateMonitor) => void;

	interface WindowOrWorkerGlobalScope {
		ai: AI;
	}
}

export type {};
