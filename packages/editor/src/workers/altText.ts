import {
	env,
	Florence2ForConditionalGeneration,
	AutoProcessor,
	AutoTokenizer,
	RawImage,
	type Tensor,
	PreTrainedModel,
	Processor,
	PreTrainedTokenizer,
} from '@huggingface/transformers';

let model: PreTrainedModel;
let processor: Processor;
let tokenizer: PreTrainedTokenizer;

async function loadModels() {
	env.allowLocalModels = false;
	env.allowRemoteModels = true;
	if ( env.backends.onnx.wasm ) {
		env.backends.onnx.wasm.proxy = false;
	}

	const modelId = 'onnx-community/Florence-2-base-ft';
	model = await Florence2ForConditionalGeneration.from_pretrained( modelId, {
		dtype: 'fp32',
		device: 'webgpu',
	} );
	processor = await AutoProcessor.from_pretrained( modelId );
	tokenizer = await AutoTokenizer.from_pretrained( modelId );
}

export async function runTask(
	url: string,
	task:
		| '<CAPTION>'
		| '<DETAILED_CAPTION>'
		| '<MORE_DETAILED_CAPTION>' = '<CAPTION>'
) {
	if ( ! processor || ! model || ! tokenizer ) {
		await loadModels();
	}

	if ( ! processor || ! model || ! tokenizer ) {
		return;
	}

	// Load image and prepare vision inputs
	const image = await RawImage.fromURL( url );
	// @ts-ignore
	const visionInputs = await processor( image );

	// @ts-ignore
	const prompts = processor.construct_prompts( task );
	// @ts-ignore
	const textInputs = tokenizer( prompts );

	// Generate text
	// @ts-ignore
	const generatedIds = ( await model.generate( {
		...textInputs,
		...visionInputs,
		max_new_tokens: 100,
	} ) ) as Tensor;

	// Decode generated text
	// @ts-ignore
	const generatedText = tokenizer.batch_decode( generatedIds, {
		skip_special_tokens: false,
	} )[ 0 ];

	// Post-process the generated text
	// @ts-ignore
	const result = processor.post_process_generation(
		generatedText,
		task,
		image.size
	);

	return result[ task ];
}
