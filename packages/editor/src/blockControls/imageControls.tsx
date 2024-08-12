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

import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';

const photoSparkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="24"
		viewBox="0 -960 960 960"
		width="24"
		fill="#5f6368"
	>
		<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160 120-160 90 120 120-160 150 200H240Zm460-200q0-92-64-156t-156-64q92 0 156-64t64-156q0 92 64 156t156 64q-92 0-156 64t-64 156Z" />
	</svg>
);

// @ts-ignore
export function ImageControls( { attributes, setAttributes } ) {
	const [ inProgress, setInProgress ] = useState( false );

	const model = useRef< PreTrainedModel >();
	const processor = useRef< Processor >();
	const tokenizer = useRef< PreTrainedTokenizer >();

	if ( ! attributes.url ) {
		return null;
	}

	async function loadModels() {
		env.allowLocalModels = false;
		env.allowRemoteModels = true;
		env.backends.onnx.wasm.proxy = false;

		const modelId = 'onnx-community/Florence-2-base-ft';
		model.current = await Florence2ForConditionalGeneration.from_pretrained(
			modelId,
			{
				dtype: 'fp32',
				device: 'webgpu',
			}
		);
		processor.current = await AutoProcessor.from_pretrained( modelId );
		tokenizer.current = await AutoTokenizer.from_pretrained( modelId );
	}

	async function runTask(
		task:
			| '<CAPTION>'
			| '<DETAILED_CAPTION>'
			| '<MORE_DETAILED_CAPTION>' = '<CAPTION>'
	) {
		setInProgress( true );

		if ( ! processor.current || ! model.current || ! tokenizer.current ) {
			await loadModels();
		}

		if ( ! processor.current || ! model.current || ! tokenizer.current ) {
			return;
		}

		// Load image and prepare vision inputs
		const image = await RawImage.fromURL( attributes.url );
		// @ts-ignore
		const visionInputs = await processor.current( image );

		// @ts-ignore
		const prompts = processor.current.construct_prompts( task );
		// @ts-ignore
		const textInputs = tokenizer.current( prompts );

		// Generate text
		// @ts-ignore
		const generatedIds = ( await model.current.generate( {
			...textInputs,
			...visionInputs,
			max_new_tokens: 100,
		} ) ) as Tensor;

		// Decode generated text
		// @ts-ignore
		const generatedText = tokenizer.current.batch_decode( generatedIds, {
			skip_special_tokens: false,
		} )[ 0 ];

		// Post-process the generated text
		// @ts-ignore
		const result = processor.current.post_process_generation(
			generatedText,
			task,
			image.size
		);

		setInProgress( false );

		return result[ task ];
	}

	const controls = [
		{
			title: __( 'Write caption', 'ai-experiments' ),
			onClick: async () => {
				const task = '<CAPTION>';
				const result = await runTask( task );

				setAttributes( { caption: result } );
			},
			role: 'menuitemradio',
			icon: undefined,
		},
		{
			title: __( 'Write alternative text', 'ai-experiments' ),
			onClick: async () => {
				const task = '<MORE_DETAILED_CAPTION>';
				const result = await runTask( task );

				setAttributes( { alt: result } );
			},
			role: 'menuitemradio',
			icon: undefined,
		},
	];
	return (
		<BlockControls group="inline">
			<ToolbarDropdownMenu
				label={ __( 'Help me write', 'ai-experiments' ) }
				icon={ photoSparkIcon() }
				controls={ controls }
				toggleProps={ {
					disabled: inProgress,
				} }
			/>
		</BlockControls>
	);
}
