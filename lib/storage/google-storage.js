const { Storage: GoogleCloudStorage } = require( '@google-cloud/storage' );
const sharp = require('sharp');

class GoogleStorage {

	constructor( options ){
		const {
			key: keyFilename,
			bucket: bucketName,
			size,
			owner,
			folder,
			url,
		} = options;
		if ( !keyFilename ) {
			throw new Error( `GoogleStorage.key needed` );
		}
		if ( !bucketName ) {
			throw new Error( `GoogleStorage.bucket needed` );
		}
		if ( !size || !size.width || !size.height ) {
			throw new Error( `GoogleStorage.size needed` );
		}
		if ( !owner ) {
			throw new Error( `GoogleStorage.owner needed` );
		}
		if ( !folder ) {
			throw new Error( `GoogleStorage.folder needed` );
		}
		if ( !url ) {
			throw new Error( `GoogleStorage.url needed` );
		}
	
		this._storage = new GoogleCloudStorage({ keyFilename, });
		this._bucket = this._storage.bucket( bucketName );
		this._size = size;
		this._sizes = `${ size.width }x${ size.height }`;
		this._owner = owner;
		this._folder = folder;
		this._url = url;

		this.prefix = `${ url }/${ bucketName }/`;
	}


	_fileName = ( file ) => `${ Date.now() }-${ file.originalname }`;
	_prefixId = ( userId ) => `${ this._owner }/${ userId }`;
	_prefix = ( userId ) => `${ this._prefixId( userId ) }/${ this._folder }/${ this._sizes }`;

	_handleFile = ( req, uploadingFile, next ) => {
		const transformer = () => sharp()
		.resize({
			fit: sharp.fit.cover,
			position: sharp.strategy.entropy,
			...this._size,
		});
		try {
			const filename = this._fileName( uploadingFile );
			const destination = this._prefix( +req.user.id );
			const path = `${ destination }/${ filename }`;
			const file = this._bucket.file( path );
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

	_removeFile = ( req, uploadingFile, next ) => {
		try {
			const filename = this._fileName( uploadingFile );
			const destination = this._prefix( +req.user.id );
			const path = `${ destination }/${ filename }`;
			const file = this._bucket.file( path );
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

	deleteFile = async( path ) => await this._bucket.file( path ).delete( );
	deleteUserFiles = async( userId ) => await this._bucket.deleteFiles({
		prefix: `${ this._prefixId( userId ) }/`,
	} );

}

module.exports = {
	GoogleStorage,
};