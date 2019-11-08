const { Storage: GoogleCloudStorage } = require( '@google-cloud/storage' );
const sharp = require('sharp');

function GoogleStorage ( options ) {
	const {
		key: keyFilename,
		url,
		bucket: bucketName,
		owner,
		folder,
		size,
	} = options;
	if ( !keyFilename ) {
		throw new Error( `GoogleStorage.key needed` );
	}
	if ( !url ) {
		throw new Error( `GoogleStorage.url needed` );
	}
	if ( !bucketName ) {
		throw new Error( `GoogleStorage.bucket needed` );
	}
	if ( !owner ) {
		throw new Error( `GoogleStorage.owner needed` );
	}
	if ( !folder ) {
		throw new Error( `GoogleStorage.folder needed` );
	}
	if ( !size || !size.width || !size.height ) {
		throw new Error( `GoogleStorage.size needed` );
	}

	const storage = new GoogleCloudStorage({ keyFilename, });
	const bucket = storage.bucket( bucketName );
	const sizes = `${ size.width }x${ size.height }`;
	const prefixId = ( owner, req ) => `${ owner }/${ +req.user.id }`;
	const prefix = ( req ) => `${ prefixId( owner, req ) }/${ folder }/${ sizes }`;
	const fileName = ( file ) => `${ Date.now() }-${ file.originalname }`;
	const transformer = () => sharp()
		.resize({
			fit: sharp.fit.cover,
			position: sharp.strategy.entropy,
			...size,
		});

	this._handleFile = ( req, uploadingFile, next ) => {
		try {
			const destination = prefix( req );
			const filename = fileName( uploadingFile );
			const path = `${ destination }/${ filename }`;
			const file = bucket.file( path );
			const istream = uploadingFile.stream;
			const ostream = file.createWriteStream( {
				metadata: {
					contentType: uploadingFile.mimetype,
				},
				public: true,
			} );
			istream
				.pipe( transformer() )
				.pipe( ostream )
				.on( 'error', next )
				.on( 'finish', ( ) => {
					next( null, {
						...uploadingFile,
						path,
						filename,
						destination,
					} );
				} );
		} catch ( error ) {
			next( error )
		}
	}

	this._removeFile = ( req, uploadingFile, next ) => {
		try {
			const destination = prefix( req );
			const filename = fileName( uploadingFile );
			const path = `${ destination }/${ filename }`;
			const file = bucket.file( path );
			file.delete( ( error ) => {
				if ( error ) {
					next( error );
				} else {
					next( null, {
						...uploadingFile,
						path,
						filename,
						destination,
					} );					
				}
			} );
		} catch ( error ) {
			next( error );
		}
	}

	this.deleteByFile = async( path ) => await bucket.file( path ).delete( );

	this.deleteByPrefixId = async( prefix ) => await bucket.deleteFiles({ prefix });

	this.prefix = `${ url }/${ bucketName }/`;
};

module.exports = {
	GoogleStorage,
};