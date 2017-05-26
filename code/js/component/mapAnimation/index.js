define(['jquery', '../bezel/index'], function(jquery, bezel) {
    var defaultConfig = {
        delay: 1000,
        duration: 150,
        autoplay: false,
        root: '',
        info: '',
        infoClass: '',
        framesCount: 8,
        clickable: true,
        onShowFrame: $.noop,
        bezel: {
            root: '',
            disabled: false,
            value: 0,
            max: 10,
            onChange: function(value, direction) {
                stop();
                showFrame(value);
            }
        }
    };
    var defaultState = {
        isPlaying: false,
        animTimeout: null,
        activeIndex: 0
    };
    var config, state;
    var $frames, $root, $noData, $info;

    function create(options) {
        config = $.extend(true, {}, defaultConfig, options);
        state = $.extend({}, defaultState);
        config.infoClass = config.info.substring(1);

        $root = $(config.root);
        $info = $(config.info);
        $noData = $root.find('img');

        bezel.create(config.bezel);

        bindEvents();

        $frames = createFrameImages(config.framesCount);
        createMarkup();

        if(config.frames) {
            setFrames(config.frames);
        }
    }

    function destroy() {
        bezel.destroy();
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
        if (!config.clickable) {
            return;
        }

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

    function fullReset() {
        config.autoplay = false;
        reset();
        stop();
    }

    function showFrame(index) {
        index = index % $frames.length;

        var hideFn = $.noop;
        if(index !== state.activeIndex) {
            $frames[state.activeIndex].stop(true, true).removeClass('is-active');
            hideFn = function(index) {
                $frames[index].hide();
            }.bind(null, state.activeIndex);
        }
        $frames[index].stop(true, true).addClass('is-active').fadeIn(config.duration, hideFn);

        bezel.setValue(index);

        state.activeIndex = index;

        config.onShowFrame(index);
    }

    function setFrame(image, index) {
        $frames[index].attr('src', image);
    }

    function setFrames(frames) {
        if(config.autoplay) { stop(); }

        frames.forEach(setFrame);

        showFrame(state.activeIndex);

        bezel.enable();

        if(config.autoplay) { play(); }
    }

    function createFrameImages(count) {
        var $snaps = [];
        while(count--) {
            $snaps.push($('<img />').hide());
        }
        return $snaps;
    }

    function createMarkup() {
        $noData.hide();
        $root.html($frames);
    }

    function destroyMarkup() {
        $noData.show();
        $root.html('');
    }

    function setClickable(flag) {
        config.clickable = flag ? true : false;
    }

    return {
        create: create,
        destroy: destroy,
        play: play,
        stop: stop,
        reset: reset,
        fullReset: fullReset,
        setFrames: setFrames,
        setFrame: setFrame,
        setClickable: setClickable,
    }
});
