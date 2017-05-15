define([
'jquery',
'../bezel/index'
], function(jquery, bezel) {
    var isPlaying;

    var $root, $button;
    var $snaps, $noDataImage;

    var activeIndex, delay, duration, animTimeout, autoplay;

    function create(config) {
        delay = config.delay || 1000;
        duration = config.duration || 150;
        autoplay = config.autoplay || false;

        $root = $(config.root);
        $button = $(config.button);
        $noDataImage = $root.find('img');

        bezel.create({
            root: '.bezel-placeholder',
            // value: 'now',
            // values: ['now', '+1.5h', '+3h', '+4.5h', '-6h', '-4.5h', '-3h', '-1.5h'],
            onChange: function(value, valueIndex, direction) {
                console.log('onChange', value, valueIndex, direction);
                cancel();
                run(valueIndex);
            }
        });

        bindEvents();

        if(config.snapshoots) {
            setSnapshoots(config.snapshoots);
        }
    }

    function destroy() {
        bezel.destroy();

        stop();
        unbindEvents();

        $snaps = [];
        $root.html($noDataImage);
    }

    function bindEvents() {
        $root.on('click', toggle);
    }

    function unbindEvents() {
        $root.off('click', toggle);
    }

    function createSnaps(snapshoots) {
        if($snaps && $snaps.length) {
            $snaps = [];
            $root.html('');
        }

        $snaps = snapshoots.map(function(img) {
            return $('<img />').attr('src', img).hide();
        });

        $root.append($snaps);
    }

    function cancel() {
        if(animTimeout) {
            clearTimeout(animTimeout);
            animTimeout = null;
        }
    }

    function run(index) {
        if(index >= $snaps.length) {
            index = 0;
        }
        bezel.setValue(index);
        $snaps[activeIndex].removeClass('is-active');
        $snaps[index].addClass('is-active');
        $snaps[index].fadeIn(
            duration,
            index !== activeIndex ? (function(prev) {
                return function() {
                    $snaps[prev].hide();
                }
            })(activeIndex) : $.noop
        );
        activeIndex = index;

        if(isPlaying) {
            animTimeout = setTimeout(run.bind(null, index+1), delay);
        }
    }

    function reset() {
        isPlaying = true;

        cancel();

        $snaps[activeIndex].hide();

        activeIndex = 0;
        run(activeIndex);
    }

    function toggle() {
        isPlaying ? stop() : play();

        $button.stop()
            .toggleClass('radar__button--play', isPlaying)
            .toggleClass('radar__button--pause', !isPlaying)
            .fadeIn(50)
            .fadeOut(500);
    }

    function play() {
        isPlaying = true;

        cancel();

        run(activeIndex);
    }

    function stop() {
        isPlaying = false;

        cancel();
    }

    function setSnapshoots(snapshoots) {
        $noDataImage.remove();
        createSnaps(snapshoots);

        activeIndex = 0;

        if(autoplay) {
            play();
        } else {
            $snaps[activeIndex].show();
        }
    }

    return {
        create: create,
        destroy: destroy,
        setSnapshoots: setSnapshoots,
        play: play,
        stop: stop,
        reset: reset
    }
});
