define(['jquery'], function(jquery) {
    var isPlaying, isDataLoaded;

    var $root, $button;
    var $snaps, $noDataImage;

    var activeIndex, autoplay;
    var delay, duration, animTimeout;

    function create(config) {
        delay = config.delay || 1000;
        duration = config.duration || 150;
        autoplay = config.autoplay || false;

        $root = $(config.root);
        $button = $(config.button);
        $noDataImage = $root.find('img');

        bindEvents();

        if(config.snapshoots) {
            setSnapshoots(config.snapshoots);
        }
    }

    function destroy() {
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

    function run(index) {
        if(index >= $snaps.length) {
            index = 0;
        }

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

        if(animTimeout) {
            clearTimeout(animTimeout);
        }

        $snaps[activeIndex].hide();

        activeIndex = 0;
        run(activeIndex);
    }

    function toggle() {
        isPlaying ? stop() : play();

        $button.stop()
            .toggleClass('radar__button--play', isPlaying)
            .toggleClass('radar__button--pause', !isPlaying)
            .fadeIn(150)
            .fadeOut(600);
    }

    function play() {
        isPlaying = true;

        if(animTimeout) {
            clearTimeout(animTimeout);
        }

        run(activeIndex);
    }

    function stop() {
        isPlaying = false;

        if(animTimeout) {
            clearTimeout(animTimeout);
        }
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
