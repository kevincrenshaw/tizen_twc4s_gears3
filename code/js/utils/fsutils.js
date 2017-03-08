/* jshint esversion: 6 */

define([], function() {
	
	const separator = '/';
	const maxLengthOfExtension = 4;
	
	/**
	 * file names comparator. compare only file names without extension
	 * Params:
	 * 		lFileName - file name to compare
	 * 		rFileName - file name to compare
	 * Returns:
	 * 		true if names are equal, false otherwise
	 * */
	const comparatorFileNamesWithoutExtension = function(lFileName, rFileName) {
		lFileName = getFileNameFromPath(lFileName);
		lFileName = getPureFileName(lFileName);
		
		rFileName = getFileNameFromPath(rFileName);
		rFileName = getPureFileName(rFileName);
		
		return lFileName === rFileName;
	};
	
	/**
	 * file names comparator. compare full file names (with extension)
	 * Params:
	 * 		lFileName - file name to compare
	 * 		rFileName - file name to compare
	 * Returns:
	 * 		true if names are equal, false otherwise
	 * */
	const comparatorFileNames = function(lFileName, rFileName) {
		return lFileName === rFileName;
	};
	
	/**
	 * Search file in a current directory, subdirectories are ignored 
	 * 
	 * Params:
	 * 		rootDirectory - name of directory where we have to find a file
	 * 		fileToSearch - name of file which need to find
	 * 		comparator - function-comparator of file names, returns true if filenames are equal, 
	 * 						possible values are: comparatorFileNames, comparatorFileNamesWithoutExtension
	 * 		callback(file) - used to return found file, otherwise null
	 * Returns:
	 * 		nothing
	 * */
	const hasSuchFile = function(rootDirectory, fileToSearch, comparator, callback) {
		
		function onSucess(files) {
			for (var i = 0; i < files.length; i++) {
				if(comparator(files[i].name, fileToSearch)) {
					callback(files[i]);
					return;
				}
			}
			callback(null);
		}
		
		function onError(error) {
			callback(null);
		}
		
		tizen.filesystem.resolve(rootDirectory, 
			function(dir) {
				dir.listFiles(onSucess, onError);
			},
			function(err) {
				callback(null);
			}
		);
	};

	/**
	 * create file in specified directory
	 * 
	 * Params: 
	 * 		rootDir - root directory where new file will be placed
	 * 		filename - name of a new file
	 * 		isDirectory - if true new directory will be created otherwise file 
	 * 		callback(file) - uses to return newly created file/folder, if error happend during file creation returns null
	 * 
	 * Returns:
	 * 		created file (if it wasn't exist) or old one 
	 * */
	const createFileIfNotExists = function(rootDir, fileName, isDirectory, callback) {
		hasSuchFile(rootDir, fileName, comparatorFileNames, function(result) {
			if(!result) {
				tizen.filesystem.resolve(rootDir, function(dir) {
					try {
						if(isDirectory === true) {
							callback(dir.createDirectory(fileName));
							return;
						} else {
							callback(dir.createFile(fileName));
							return;
						}
					} catch(ex) {
						callback(null);
					}
				});
			} else {
				callback(result);
			}
		});
	};

	/**
	 * remove file
	 * Params:
	 * 		rootDirectoryName - name of directory which contains file to delete
	 * 		imageFileName - name of file to remove, without extension
	 * Returns:
	 * 		nothing
	 * */
	const removeFile = function(rootDirectoryName, imageFileName) {
		tizen.filesystem.resolve(rootDirectoryName, function(dir) {
			function onSuccess(files) {
				
				const onDeleteSuccess = function() {
					console.log('file: ' + imageFileName + ' deleted');
					return;
				};
				
				const onDeleteError = function(error) {
					console.error('cant delete file: ' + imageFileName + 'error: ' + error.message);
				};
				
				for (var i = 0; i < files.length; i++) {
					
					if(comparatorFileNamesWithoutExtension(files[i].name, imageFileName)) {
						dir.deleteFile(files[i].fullPath, onDeleteSuccess, onDeleteError);
					}
				}
			}
			
			function onError(error) {
				console.error('cant list files in directory: ' + dir.toURI() + ' error: ' + error.message);
			}
			
			dir.listFiles(onSuccess, onError);
		});
	};

	/**
	 * move file from one to another directory
	 * 
	 * Params:
	 * 		srcFilePath - full src file path
	 * 		dstFilePath - full dst file path
	 * 		callback(fileURI) - if move operation was successfull callback will get file URI, otherwise null 
	 * */
	const moveFile = function(srcFilePath, dstFilePath, callback) {
		onMoveSuccess = function() {
			tizen.filesystem.resolve(dstFilePath, 
				function(file) {
					callback(file.toURI());			
				},
				function(error) {
					callback(null);
				}
			);
		};
		
		onError = function(error) {
			callback(null);
		};
		
		//resolve src directory
		tizen.filesystem.resolve(getDirectoryNameFromPath(srcFilePath), 
			function(srcDir) {
				//resolve dst directory
				tizen.filesystem.resolve(getDirectoryNameFromPath(dstFilePath),
					function(dstDir) {
						srcDir.moveTo(srcFilePath, dstFilePath,
							true, //override files
							onMoveSuccess,
							onError
							);
					},
					onError
					);
			},
			onError
		);
	};

	/**
	 * get file extension from filename or url
	 * 
	 * Params:
	 * 		fileName - file path or url
	 * 
	 * Returns:
	 * 		string - extension or empty one 
	 * */
	const getFileExtension = function(filePath) {
		const pointPos = filePath.lastIndexOf('.');
		var extension = '';
		if(pointPos > -1 && pointPos < filePath.length - 1 && pointPos + maxLengthOfExtension >= filePath.length - 1) {
			return filePath.substr(pointPos + 1);
		}
		return '';
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
		getFileExtension: getFileExtension,
		createFileIfNotExists: createFileIfNotExists,
		moveFile: moveFile,
		removeFile: removeFile,
		comparatorFileNamesWithoutExtension: comparatorFileNamesWithoutExtension,
		comparatorFileNames: comparatorFileNames,
		createFullPath: createFullPath,
	};
});