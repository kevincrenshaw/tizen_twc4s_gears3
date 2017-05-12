define(['jquery'], function(jquery) {
    var isPlaying;

    var $root;
    var $snaps, $noDataImage;

    var activeIndex, delay, duration, animTimeout, autoplay;

    function create(config) {
        delay = config.delay || 1000;
        duration = config.duration || 150;
        autoplay = config.autoplay || false;

        $root = $(config.root);
        $noDataImage = $root.find('img');

        bindEvents();

        if(config.snapshoots) {
            createSnaps(config.snapshoots);
        }
    }

    function destroy() {
        stop();
        unbindEvents();

        $snaps = [];
        $root.html($noDataImage);
    }

    function bindEvents() {

    }

    function unbindEvents() {

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

    function restart() {
        isPlaying = true;

        if(animTimeout) {
            clearTimeout(animTimeout);
        }
        
        $snaps[activeIndex].hide();
        run(0);
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
        restart: restart
    }
});
