/* jshint esversion: 6 */

define([], function() {
	
	const separator = '/';

	/**
	 * Search file in a current directory, subdirectories are ignored 
	 * 
	 * Params:
	 * 		filePath - full path to a file
	 * 		onSuccess(file) - used to return found file
	 * 		onError(error) - used if no such file found
	 * Returns:
	 * 		nothing
	 * */
	const hasSuchFile = function(filePath, onSuccess, onError) {
		tizen.filesystem.resolve(filePath, onSuccess, onError);
	};

	/**
	 * create file in specified directory
	 * 
	 * Params: 
	 * 		rootDirPath - root directory where new file will be placed
	 * 		dirName - name of a new directory
 
	 * 		onSuccess(file) - uses to return newly created directory
	 * 		onError(error) - uses to return and error of dir creation
	 * 
	 * Returns:
	 * 		nothing 
	 * */
	const createDirectoryIfNotExists = function(rootDirPath, dirName, onSuccess, onError) {
		const fullPath = createFullPath(rootDirPath, dirName);
		hasSuchFile(rootDirPath, 
			function(rootDir) {
				hasSuchFile(fullPath,onSuccess,
					function(error) {
						try {
							onSuccess(rootDir.createDirectory(dirName));
						} catch(err) {
							onError(err);
						};
					});
			},
			onError
		);
	};

	/**
	 * remove file
	 * Params:
	 * 		filePath - full path to a file which should be removed
	 * 		onSuccess() - is triggered when file was deleted successfully
	 * 		onError(error) - is called when deletion was fail
	 * Returns:
	 * 		nothing
	 * */
	const removeFile = function(filePath, onSuccess, onError) {
		//we have to resolve directory path first
		hasSuchFile(getDirectoryNameFromPath(filePath),
			function(dir) {
				//because tizen allows only to delete file (by file full path) from current firectory
				//we have to resolve full file path as well
				hasSuchFile(filePath,
					function(file) {
						dir.deleteFile(file.fullPath, onSuccess, onError);
					},
					onError
				);
			},
			onError
		);
	};

	/**
	 * move file from one to another directory
	 * 
	 * Params:
	 * 		srcFilePath - full src file path
	 * 		dstFilePath - full dst file path
	 * 		onSuccess(fileURI) - if move operation was successfull callback will get file URI
	 * 		onError(error) - if move operation was unsuccessfull 
	 * */
	const moveFile = function(srcFilePath, dstFilePath, onSuccess, onError) {
		const onMoveSuccess = function() {
			tizen.filesystem.resolve(dstFilePath, 
				function(file) {
					onSuccess(file.toURI());
				},
				onError
			);
		};
		
		//resolve src directory
		hasSuchFile(getDirectoryNameFromPath(srcFilePath),
			function(srcDir) {
				hasSuchFile(getDirectoryNameFromPath(dstFilePath),
					function(dstDir) {
						srcDir.moveTo(srcFilePath, dstFilePath, true, onMoveSuccess, onError);
					},
					onError
				);
			}, onError
		);
	};
	
	/**
	 * returns just file name without extension
	 * Params:
	 * 		fileName file name with extension
	 * Returns:
	 * 		pure (without extension) file name
	 * */
	const getPureFileName = function(fileName) {
		var result = fileName;
		const pos = result.lastIndexOf('.');
		if(pos > -1) {
			result = result.substring(0, pos);
		}
		return result;
	};
	
	/**
	 * extract filename with extension from full path
	 * Params:
	 * 		filePath - full file path
	 * Returns:
	 * 		filename with extension;
	 * */
	const getFileNameFromPath = function(filePath) {
		var result = filePath;
		//trim directories
		const posOfSlash = result.lastIndexOf(separator);
		if(posOfSlash > -1) {
			result = result.substring(posOfSlash + 1);
		}
		return result;
	};
	
	/**
	 * extract directory name from file full path
	 * Params:
	 * 		filePath - full path to a file
	 * Returns:
	 * 		name of directory[ies] if it was detected or empty string
	 * */
	const getDirectoryNameFromPath = function(filePath) {
		
		var result = ''; 
		
		const posOfSlash = filePath.lastIndexOf(separator);
		if(posOfSlash > -1) {
			result = filePath.substring(0, posOfSlash);
		}
		return result;
	};
	
	/**
	 * join all folders to one full path. doesnt check if this path is real
	 * Params: 
	 * 		...arguments - variable count of folders + file
	 * Returns:
	 * 		full file path. 
	 * */
	const createFullPath = function() {
		var array = [];
		for(var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		
		return array.join(separator);
	};
	
	return {
		hasSuchFile: hasSuchFile,
		createDirectoryIfNotExists: createDirectoryIfNotExists,
		moveFile: moveFile,
		removeFile: removeFile,
		createFullPath: createFullPath,
		getFileNameFromPath: getFileNameFromPath,
		getDirectoryNameFromPath: getDirectoryNameFromPath,
	};
});