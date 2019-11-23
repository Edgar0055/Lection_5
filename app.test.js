
// https://jestjs.io/docs/en/api.html#testname-fn

describe ( 'app.test 1', () => {
    test( 'test toBe success', ( ) => {
        expect( 1 ).toBe( 1 );
    } );
    
    test( 'test not toBe success', ( ) => {
        expect( 2 ).not.toBe( 1 );
    } );
} );

describe ( 'app.test 2', () => {
    test( 'test toBe success', ( ) => {
        expect( 1 ).toBe( 1 );
    } );
    
    test( 'test not toBe success', ( ) => {
        expect( 2 ).not.toBe( 1 );
    } );
} );

describe ( 'app.test 3', () => {
    test( 'test toBe success', ( ) => {
        expect( 1 ).toBe( 1 );
    } );
    
    test( 'test not toBe success', ( ) => {
        expect( 2 ).not.toBe( 1 );
    } );
} );
