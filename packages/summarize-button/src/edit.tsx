import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit( {
	// @ts-ignore
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const blockProps = useBlockProps( { className: layoutClassNames } );
	return (
		<div { ...blockProps }>
			<button className="wp-block-button__link" disabled>
				<span>{ __( 'Summarize content', 'ai-experiments' ) }</span>
			</button>
		</div>
	);
}
