define(['jquery'], function(jquery) {
    var defaultConfig = {
        delay: 1000,
        duration: 150,
        autplay: false,
        root: '',
        info: '',
        infoClass: ''
    };
    var defaultState = {
        isPlaying: false,
        isDataLoaded: false,
        animTimeout: null,
        activeIndex: 0
    };
    var config, state;
    var $frames, $root, $noData, $info;

    function create(options) {
        config = $.extend({}, defaultConfig, options);
        state = $.extend({}, defaultState);
        config.infoClass = config.info.substring(1);

        $root = $(config.root);
        $info = $(config.info);
        $noData = $root.find('img');

        bindEvents();

        if(config.frames) {
            setFrames(config.frames);
        }
    }

    function destroy() {
        stop();
        unbindEvents();
        destroyMarkup();

        $root = null;
        $info = null;
        $noData = null;
    }

    function bindEvents() {
        $root.on('click', toggle);
    }

    function unbindEvents() {
        $root.off('click', toggle);
    }

    function toggle() {
        state.isPlaying ? stop() : play();

        $info.stop(true, true)
            .toggleClass(config.infoClass + '--play', state.isPlaying)
            .toggleClass(config.infoClass + '--pause', !state.isPlaying)
            .fadeIn(config.duration)
            .fadeOut(config.duration * 4);
    }

    function play() {
        state.isPlaying = true;

        loop();
    }

    function loop() {
        state.animTimeout = setTimeout(function() {
            if(!state.isPlaying) { return; }

            showFrame(state.activeIndex + 1);
            loop();
        }, config.delay);
    }

    function stop() {
        state.isPlaying = false;

        if(state.animTimeout) {
            clearTimeout(state.animTimeout);
        }
        state.animTimeout = null;
    }

    function reset() {
        if(config.autoplay) { stop(); }

        showFrame(0);

        if(config.autoplay) { play(); }
    }

    function showFrame(index) {
        index = index % $frames.length;

        var hideFn = $.noop;
        if(index !== state.activeIndex) {
            $frames[state.activeIndex].removeClass('is-active');
            hideFn = function(index) {
                $frames[index].hide();
            }.bind(null, state.activeIndex);
        }
        $frames[index].addClass('is-active').fadeIn(config.duration, hideFn);

        state.activeIndex = index;
    }

    function setFrames(frames) {
        if(config.autoplay) { stop(); }

        $frames = createFrameImages(frames);
        createMarkup();

        state.isDataLoaded = true;

        showFrame(state.activeIndex);

        if(config.autoplay) { play(); }
    }

    function createFrameImages(images) {
        return images.map(function(img) {
            return $('<img />').attr('src', img).hide();
        });
    }

    function createMarkup() {
        $noData.hide();
        $root.html($frames);
    }

    function destroyMarkup() {
        $noData.show();
        $root.html('');
    }

    return {
        create: create,
        destroy: destroy,
        play: play,
        stop: stop,
        reset: reset,
        setFrames: setFrames
    }
});
