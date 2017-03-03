define([], function() {
	/**
	 * Search file in a directory
	 * 
	 * Params:
	 * rootDirectory - name of directory where we have to find a file
	 * fileToSearch - name of file which need to find
	 * Returns:
	 * null if file wasn't found, otherwise File object
	 * */
	const hasSuchFile = function(rootDirectory, fileToSearch, checkFileExtension, callback) {
		
		function onSucess(files) {
			console.log('searching file: ' + fileToSearch);
			for (var i = 0; i < files.length; i++) {
				if(!checkFileExtension) {
					var fname = getFileNameWithoutExtension(files[i].name);
					var fnameToSearch = getFileNameWithoutExtension(fileToSearch);

					if(fname === fnameToSearch) {
						console.log('found entry: ' + files[i].toURI());
						callback(files[i]);
						return;
					}
				} else {
					if(files[i].name === fileToSearch) {
						callback(files[i]);
						return;
					}
				}
			}
			callback(null);
		};
		
		function onError(error) {
			console.error('cant list files');
			callback(null);
		};
		
		tizen.filesystem.resolve(rootDirectory, 
			function(dir) {
				dir.listFiles(onSucess, onError);
			},
			function(err) {
				console.error('cant resolve path: ' + rootDirectory);
				callback(null);
			}
		);
	};

	/**
	 * create file in specified directory
	 * 
	 * Params: 
	 * rootDir - root directory where new file will be placed
	 * filename - name on a new file
	 * isDirectory - if true new directory will be created otherwise file 
	 * 
	 * Returns:
	 * created file (if it wasn't exist) or old one 
	 * */
	const createFileIfNotExists = function(rootDir, fileName, isDirectory, callback) {
		hasSuchFile(rootDir, fileName, true, function(result) {
			if(!result) {
				console.log('no such file, creating a new one');
				tizen.filesystem.resolve(rootDir, function(dir) {
					try {
						if(isDirectory == true) {
							callback(dir.createDirectory(fileName));
							return;
						} else {
							callback(dir.createFile(fileName));
							return;
						}
					} catch(ex) {
						console.error('cant create file: ' + fileName + ' in dir: ' + rootDir + ' message: ' + ex.message);
						callback(null);
					}
				});
			} else {
				console.log('this file already exists, return it');
				callback(result);
			}
		});
	};

	/**
	 * remove file
	 * Params:
	 * imageFileName - name of file to remove, without extension
	 * */
	const removeFile = function(rootDirectoryName, imageFileName) {
		tizen.filesystem.resolve(rootDirectoryName, function(dir) {
			function onSuccess(files) {
				for (var i = 0; i < files.length; i++) {
					console.log('removeFile:: filename: ' + files[i].name);
					var fname = files[i].name;
					const pos = fname.lastIndexOf('.');
					if(pos > -1) {
						fname = fname.substring(0, pos);
					}
					
					if(fname === imageFileName) {
						dir.deleteFile(files[i].fullPath,
							function() {
								console.log('file: ' + imageFileName + ' deleted');
								return;
							},
							function(error) {
								console.error('cant delete file: ' + imageFileName);
							});
					}
				}
			};
			
			function onError(error) {
				console.log('cant list files in directory: ' + dir.toURI());
			}
			
			dir.listFiles(onSuccess, onError);
		});
	};

	/**
	 * move file
	 * 
	 * Params:
	 * srcDirectoryName - directory name which contains source file
	 * dstDirectoryName - directory where file should be
	 * srcFileName - source file name (original)
	 * dstFileName - new file name
	 * callback - if move operation was successfull callback will get file URI, otherwise null 
	 * */
	const moveFile = function(srcDirectoryName, dstDirectoryName, srcFileName, dstFileName, callback) {
		onMoveSuccess = function() {
			tizen.filesystem.resolve(dstDirectoryName + '/' + dstFileName, 
				function(file) {
					console.log('file has been moved, uri: ' + file.toURI());
					callback(file.toURI());			
				},
				function(error) {
					console.error('error on resolving path: ' + dstDirectoryName + '/' + fileName);
					callback(null);
				}
			);
		};
		
		onMoveError = function(error) {
			console.error('on error: ' + error.message);
			callback(null);
		};
		
		//resolving error handler
		onResolvingPathError = function(error) {
			console.error('on resolving path error: ' + error.message);
			callback(null);
		};
		
		//resolve src directory
		tizen.filesystem.resolve(srcDirectoryName, 
			function(srcDir) {
				//resolve dst directory
				tizen.filesystem.resolve(dstDirectoryName,
					function(dstDir) {
						srcDir.moveTo(
							srcDir.fullPath + '/' + srcFileName, 
							dstDir.fullPath + '/' + dstFileName,
							true, //override files
							onMoveSuccess,
							onMoveError
							);
					},
					onResolvingPathError
					);
			},
			onResolvingPathError
		);
	};

	/**
	 * get file extension from filename or url
	 * 
	 * Params:
	 * fileName - file path or url
	 * 
	 * Returns:
	 * string - extension or empty one 
	 * */
	const getFileExtension = function(filePath) {
		return filePath.substr(filePath.lastIndexOf('.') + 1);
	};

	/**
	 * returns just filename without full path and extension
	 * 
	 * */
	const getFileNameWithoutExtension = function(filePath) {

		var result = filePath;
		//trim extension
		const pos = filePath.lastIndexOf('.');
		if(pos > -1) {
			result = filePath.substring(0, pos);
		}

		//trim directories
		const posOfSlash = filePath.lastIndexOf('/');
		if(posOfSlash > -1) {
			result = result.substring(posOfSlash + 1);
		}
		return result;
	};
	
	return {
		hasSuchFile: hasSuchFile,
		getFileExtension: getFileExtension,
		createFileIfNotExists: createFileIfNotExists,
		moveFile: moveFile,
		removeFile: removeFile,
		//for QUnit
		getFileNameWithoutExtension: getFileNameWithoutExtension,
	};
});