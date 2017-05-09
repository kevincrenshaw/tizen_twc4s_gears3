define(['utils/map'], function(map) {
    const MINUTE_IN_SECONDS = 60;
    const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60;
    const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24;

    describe('map utils', function() {

        describe('getAllowedPrecisionAccordingToLod method', function() {

            // another approach to test data series
            var testData = [
                { args: [0.1, 1], expected: '0' },
                { args: [0.24, 1], expected: '0' },
                { args: [0.49, 1], expected: '0' },
                { args: [0.5, 1], expected: '1' },
                { args: [0.51, 1], expected: '1' },
                { args: [0.99, 1], expected: '1' },
                { args: [1.4, 1], expected: '1' },
                { args: [1.5, 1], expected: '2' },

                { args: [51.1030, 1], expected: '51' },
                { args: [13.5, 2], expected: '14' },
                { args: [3.65, 3], expected: '4' },
                { args: [-7.93, 1], expected: '-8' }
            ];

            it('LOD 1-4 (precision 0)', function() {
                testData.forEach(function(test) {
                    var result = map.getAllowedPrecisionAccordingToLod.apply(null, test.args).toString();
                    expect(result).to.be(test.expected);
                });
            });
            // eof another approach

            it('LOD 1-4 (precision 0)', function() {
                expect(map.getAllowedPrecisionAccordingToLod(0.1, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.24, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.49, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.5, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(0.51, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(0.99, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(1.4, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(1.5, 1).toString()).to.be('2');

                expect(map.getAllowedPrecisionAccordingToLod(51.1030, 1).toString()).to.be('51');
                expect(map.getAllowedPrecisionAccordingToLod(13.5, 2).toString()).to.be('14');
                expect(map.getAllowedPrecisionAccordingToLod(3.65, 3).toString()).to.be('4');
                expect(map.getAllowedPrecisionAccordingToLod(-7.93, 3).toString()).to.be('-8');
            });

            it('LOD 1-4 (precision 0)', function() {
                expect(map.getAllowedPrecisionAccordingToLod(0.1, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.24, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.49, 1).toString()).to.be('0');
                expect(map.getAllowedPrecisionAccordingToLod(0.5, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(0.51, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(0.99, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(1.4, 1).toString()).to.be('1');
                expect(map.getAllowedPrecisionAccordingToLod(1.5, 1).toString()).to.be('2');

                expect(map.getAllowedPrecisionAccordingToLod(51.1030, 1).toString()).to.be('51');
                expect(map.getAllowedPrecisionAccordingToLod(13.5, 2).toString()).to.be('14');
                expect(map.getAllowedPrecisionAccordingToLod(3.65, 3).toString()).to.be('4');
                expect(map.getAllowedPrecisionAccordingToLod(-7.93, 3).toString()).to.be('-8');
            });

            
            it('LOD 5-7 (precision 1)', function() {
                expect(map.getAllowedPrecisionAccordingToLod(0.1, 5).toString()).to.be('0.0');
                expect(map.getAllowedPrecisionAccordingToLod(0.24, 5).toString()).to.be('0.0');
                expect(map.getAllowedPrecisionAccordingToLod(0.25, 5).toString()).to.be('0.5');
                expect(map.getAllowedPrecisionAccordingToLod(0.49, 5).toString()).to.be('0.5');
                expect(map.getAllowedPrecisionAccordingToLod(0.5, 5).toString()).to.be('0.5');
                expect(map.getAllowedPrecisionAccordingToLod(0.51, 5).toString()).to.be('0.5');
                expect(map.getAllowedPrecisionAccordingToLod(0.749, 5).toString()).to.be('0.5');
                expect(map.getAllowedPrecisionAccordingToLod(0.75, 5).toString()).to.be('1.0');
                expect(map.getAllowedPrecisionAccordingToLod(0.9999, 5).toString()).to.be('1.0');
                expect(map.getAllowedPrecisionAccordingToLod(1.2499, 5).toString()).to.be('1.0');
                expect(map.getAllowedPrecisionAccordingToLod(1.4, 5).toString()).to.be('1.5');
                expect(map.getAllowedPrecisionAccordingToLod(1.5, 5).toString()).to.be('1.5');

                expect(map.getAllowedPrecisionAccordingToLod(51.1030, 5).toString()).to.be('51.0');
                expect(map.getAllowedPrecisionAccordingToLod(13.491, 6).toString()).to.be('13.5');
                expect(map.getAllowedPrecisionAccordingToLod(13.591, 7).toString()).to.be('13.5');
                expect(map.getAllowedPrecisionAccordingToLod(13.85, 7).toString()).to.be('14.0');
            });


            it('LOD 8-11 (precision 2)', function() {
                expect(map.getAllowedPrecisionAccordingToLod(0.01, 8).toString()).to.be('0.00');
                expect(map.getAllowedPrecisionAccordingToLod(0.024, 8).toString()).to.be('0.00');
                expect(map.getAllowedPrecisionAccordingToLod(0.025, 8).toString()).to.be('0.05');
                expect(map.getAllowedPrecisionAccordingToLod(0.05, 8).toString()).to.be('0.05');
                expect(map.getAllowedPrecisionAccordingToLod(0.074, 8).toString()).to.be('0.05');
                expect(map.getAllowedPrecisionAccordingToLod(0.075, 8).toString()).to.be('0.10');
                expect(map.getAllowedPrecisionAccordingToLod(0.124, 8).toString()).to.be('0.10');
                expect(map.getAllowedPrecisionAccordingToLod(0.125, 8).toString()).to.be('0.15');
                expect(map.getAllowedPrecisionAccordingToLod(0.1512, 8).toString()).to.be('0.15');
                expect(map.getAllowedPrecisionAccordingToLod(0.1749, 8).toString()).to.be('0.15');
                expect(map.getAllowedPrecisionAccordingToLod(0.175, 8).toString()).to.be('0.20');

                expect(map.getAllowedPrecisionAccordingToLod(51.1030, 8).toString()).to.be('51.10');
                expect(map.getAllowedPrecisionAccordingToLod(51.1055, 9).toString()).to.be('51.10');
                expect(map.getAllowedPrecisionAccordingToLod(42, 10).toString()).to.be('42.00');
                expect(map.getAllowedPrecisionAccordingToLod(-3.0099, 11).toString()).to.be('-3.00');
                expect(map.getAllowedPrecisionAccordingToLod(-3.76, 11).toString()).to.be('-3.75');
            });


            it('LOD 12-14 (precision 3)', function() {
                expect(map.getAllowedPrecisionAccordingToLod(0.001, 12).toString()).to.be('0.000');
                expect(map.getAllowedPrecisionAccordingToLod(0.00249, 12).toString()).to.be('0.000');
                expect(map.getAllowedPrecisionAccordingToLod(0.0025, 12).toString()).to.be('0.005');
                expect(map.getAllowedPrecisionAccordingToLod(0.005, 12).toString()).to.be('0.005');
                expect(map.getAllowedPrecisionAccordingToLod(0.00749, 12).toString()).to.be('0.005');
                expect(map.getAllowedPrecisionAccordingToLod(0.0075, 12).toString()).to.be('0.010');
                expect(map.getAllowedPrecisionAccordingToLod(0.012499, 12).toString()).to.be('0.010');
                expect(map.getAllowedPrecisionAccordingToLod(0.0125, 12).toString()).to.be('0.015');
                expect(map.getAllowedPrecisionAccordingToLod(0.017, 12).toString()).to.be('0.015');
                expect(map.getAllowedPrecisionAccordingToLod(0.018, 12).toString()).to.be('0.020');
                expect(map.getAllowedPrecisionAccordingToLod(0.0222, 12).toString()).to.be('0.020');
                expect(map.getAllowedPrecisionAccordingToLod(0.0247, 12).toString()).to.be('0.025');
                expect(map.getAllowedPrecisionAccordingToLod(0.0256, 12).toString()).to.be('0.025');

                expect(map.getAllowedPrecisionAccordingToLod(51.10349, 12).toString()).to.be('51.105');
                expect(map.getAllowedPrecisionAccordingToLod(51.10350, 13).toString()).to.be('51.105');
                expect(map.getAllowedPrecisionAccordingToLod(-4, 14).toString()).to.be('-4.000');
                expect(map.getAllowedPrecisionAccordingToLod(-4.137, 14).toString()).to.be('-4.135');
            });

        });

        describe('getMapLod method', function() {

            it('25 kilometers', function() {
                const mapZoom100 = 1;
                const mapZoom75 = 2;
                const mapZoom50 = 3;
                const mapZoom25 = 4;

                const distanceMiles = 1;
                const distanceKilometers = 2;
                const distanceMegameters = 3;

                expect(map.getMapLod(mapZoom25, distanceKilometers)).to.be(14);
                expect(map.getMapLod(mapZoom25, distanceMiles)).to.be(13);
                expect(map.getMapLod(mapZoom50, distanceKilometers)).to.be(12);
                expect(map.getMapLod(mapZoom75, distanceKilometers)).to.be(11);
                expect(map.getMapLod(mapZoom50, distanceMiles)).to.be(10);
                expect(map.getMapLod(mapZoom100, distanceKilometers)).to.be(9);
                expect(map.getMapLod(mapZoom75, distanceMiles)).to.be(8);
                expect(map.getMapLod(mapZoom100, distanceMiles)).to.be(7);
                expect(map.getMapLod(mapZoom25, distanceMegameters)).to.be(6);
                expect(map.getMapLod(mapZoom50, distanceMegameters)).to.be(5);
                expect(map.getMapLod(mapZoom75, distanceMegameters)).to.be(4);
                expect(map.getMapLod(mapZoom100, distanceMegameters)).to.be(3);
            });

        });

    });

});