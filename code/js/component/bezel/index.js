define(['jquery'], function(jquery) {

    var onChangeCb, config;
    var $root, $indicator;
    var rotateStep, value, isDisabled;

    function create(_config) {
        config = _config;
        rotateStep = 360 / (config.max + 1);

        $root = $(config.root);
        createMarkup();
        setIndicatorSize();
        setValue(config.value || 0);

        onChangeCb = config.onChange || $.noop;
        
        config.disabled ? disable() : enable();

        bindEvents();
    }

    function destroy() {
        destroyMarkup();
        unbindEvents();
        $root = null;
        $indicator = null;
    }

    function createMarkup() {
        $root.addClass('bezel');
        $indicator = $('<div class="bezel__indicator"></div>');
        $root.append($indicator).append([
            '<div class="bezel__marker bezel__marker--top"></div>',
            '<div class="bezel__marker bezel__marker--bottom"></div>'
        ].join('\n'));
    }

    function destroyMarkup() {
        $root.removeClass('bezel').html('');
    }

    function bindEvents() {
        document.addEventListener('rotarydetent', onRotate);
    }

    function unbindEvents() {
        document.removeEventListener('rotarydetent', onRotate);
    }

    function disable() {
        isDisabled = true;
        $root.hide();
    }
    function enable() {
        isDisabled = false;
        $root.show();
    }

    function onRotate(event) {
        if(isDisabled) { return; }

        var tmpValue = value;
        if(event.detail.direction === 'CW') {
            tmpValue++;
            if(tmpValue > config.max) {
                tmpValue = 0;
            }
        } else {
            tmpValue--;
            if(tmpValue < 0) {
                tmpValue = config.max;
            }
        }

        value = tmpValue;

        onChangeCb(value, event.detail.direction);

        setIndicatorPosition(value);
    }

    function setValue(_value) {
        value = _value;

        setIndicatorPosition(value);
    }

    function getValue() {
        return value;
    }

    function setIndicatorSize() {
        $indicator.css(
            'background-image',
            $indicator.css('background-image').replace('90', 90 + rotateStep)
        );
    }

    function setIndicatorPosition(value) {
        $indicator.css('transform', 'rotate(' + (value * rotateStep) + 'deg)');
    }

    return {
        create: create,
        destroy: destroy,
        setValue: setValue,
        getValue: getValue,
        disable: disable,
        enable: enable
    }
});
