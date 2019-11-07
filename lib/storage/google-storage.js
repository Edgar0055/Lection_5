const { Storage: GoogleCloudStorage } = require( '@google-cloud/storage' );
const sharp = require('sharp');

function GoogleStorage ( options ) {
	const {
		key: keyFilename,
		bucket: bucketName,
		owner,
		userId,
		folder,
		size,
	} = options;
	if ( !keyFilename ) {
		throw new Error( `GoogleStorage.key needed` );
	}
	if ( !bucketName ) {
		throw new Error( `GoogleStorage.bucket needed` );
	}
	if ( !owner ) {
		throw new Error( `GoogleStorage.owner needed` );
	}
	if ( !( userId instanceof Function ) ) {
		throw new Error( `GoogleStorage.userId function needed` );
	}
	if ( !folder ) {
		throw new Error( `GoogleStorage.folder needed` );
	}
	if ( !size || !size.width || !size.height ) {
		throw new Error( `GoogleStorage.size needed` );
	}

	let _storage = null, _bucket = null;
	const storage = () => {
		if ( !_storage ) {
			_storage = new GoogleCloudStorage({ keyFilename, });
		}
		return _storage;
	};
	const bucket = () => {
		if ( !_bucket ) {
			_bucket = storage().bucket( bucketName );
		}
		return _bucket;
	}
	const sizes = `${ size.width }x${ size.height }`;
	const prefixId = ( owner, req ) => `${ owner }/${ userId( req ) }`;
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
			const file = bucket().file( path );
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
						delete: async() => await this.deleteByFile(path),
						deleteByFile: this.deleteByFile,
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
			const file = bucket().file( path );
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

	this.deleteByFile = async( path ) => await bucket()
		.file( path ).delete( );

	this.deleteByPrefixId = async( owner, req ) => await bucket()
		.deleteFiles({ prefix: prefixId( owner, req ) });

};

module.exports = {
	GoogleStorage,
};