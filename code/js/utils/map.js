/* jshint esversion: 6 */

define([], function() {
	
//	distance: 1=miles, 2=kilometers, 3=megameters
//	mapzoom: 1=100, 2=75, 3=50, 4=25
//
//	25 km		= 25 km			[lod=14]
//	25 miles	= 40,225 km		[lod=13]
//	50 km		= 50 km			[lod=12]
//	75 km		= 75 km			[lod=11]
//	50 miles	= 80,45 km		[lod=10]
//	100 km		= 100 km		[lod=9]
//	75 miles	= 120,675 km	[lod=8]
//	100 miles	= 160,9 km		[lod=7]
//	25 Mm		= 25000 km		[lod=6]
//	50 Mm		= 50000 km		[lod=5]
//	75 Mm		= 75000 km		[lod=4]
//	100 Mm		= 100000 km		[lod=3]
	
	const getMapLod = function(mapZoom, distance) {		
		switch(mapZoom) {
			case 1:	//100
				switch (distance) {
					case 1:	return 7; //miles
					case 2: return 9; //kilometers
					case 3: return 3; //megameters
				}
				break;

			case 2:	//75
				switch (distance) {
					case 1:	return 8; //miles
					case 2: return 11; //kilometers
					case 3: return 4; //megameters
				}
				break;

			case 3: //50
				switch (distance) {
					case 1:	return 10; //miles
					case 2: return 12; //kilometers
					case 3: return 5; //megameters
				}
				break;

			case 4:	//25
				switch (distance) {
					case 1:	return 13; //miles
					case 2: return 14; //kilometers
					case 3: return 6; //megameters
				}
				break;

			default:
				return undefined;
		}
	};
	
	const getPrecisionForLod = function(lod) {
		switch(lod) {
			case 1: case 2: case 3: case 4:		return 0;
			case 5: case 6: case 7:				return 1;
			case 8: case 9: case 10: case 11:	return 2;
			case 12: case 13: case 14:			return 3;
		}
	};

	const transform = function(value, translationBeforeScale, scale, translationAfterScale) {
		return Math.round(((value + translationBeforeScale) * scale) + translationAfterScale) / scale;
	};

	const calculatePrecision = function(value) {
		return transform(value, -0.25, 2.0, 0.5);
	};

	const getAllowedPrecisionAccordingToLod = function(value, lod) {
		const precision = getPrecisionForLod(lod);
		
		if (precision === undefined) {
			return;
		}

		if (precision === 0) {
			return Math.round(value).toFixed(precision);
		} else {
			const scale = Math.pow(10, precision - 1);
			return (calculatePrecision(value * scale) / scale).toFixed(precision);
		}
	};

	return {
		//Converts given floating point number into precision required by given LOD (level of detail)
		getAllowedPrecisionAccordingToLod: getAllowedPrecisionAccordingToLod,
		
		//Return map level of detail (LOD) based on mapZoom and distance setting
		//Requires integers as parameters
		getMapLod: getMapLod,
	};
});