type ModelListResponse = {
	data: Array<{
		id: string;
		name: string;
		created: number;
		description: string;
		context_length: number;
		architecture: {
			modality: string;
			tokenizer: string;
			instruct_type?: string;
		};
		pricing: {
			prompt: string;
			completion: string;
			image: string;
			request: string;
		};
		top_provider: {
			context_length?: number;
			max_completion_tokens?: number;
			is_moderated: boolean;
		};
	}>;
};
