import { resolve } from '../';

describe( 'resolve', () => {
	it( 'resolves file in monorepo package', () => {
		const result = resolve( '@ai-experiments/upload-media', 'index.ts' );
		expect( result.found ).toBe( true );
	} );
} );
