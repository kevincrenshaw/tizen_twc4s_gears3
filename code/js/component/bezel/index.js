define(['jquery'], function(jquery) {
    var valueIndex;
    var values;

    var onChangeCb = function() {};

    var $root;
    var $indicator;

    var rotateStep;

    function create(config) {
        values = config.values || [0, 1, 2, 3, 4, 5, 6, 7];
        rotateStep = 360 / values.length;

        $root = $(config.root);
        $indicator = createMarkup();
        setIndicatorSize();
        setValue(config.value || 0);

        if(config.onChange) {
            onChangeCb = config.onChange;
        }
        bindEvents();
    }

    function destroy() {
        unbindEvents();
    }

    function createMarkup() {
        $root.addClass('bezel');
        var $indicator = $('<div class="bezel__indicator"></div>');
        $root.append($indicator).append([
            '<div class="bezel__marker bezel__marker--top"></div>',
            '<div class="bezel__marker bezel__marker--bottom"></div>'
        ].join('\n'));

        return $indicator;
    }

    function bindEvents() {
        document.addEventListener('rotarydetent', onRotate);
    }

    function unbindEvents() {
        document.removeEventListener('rotarydetent', onRotate);
    }

    function onRotate(event) {
        var tmpIndex = valueIndex;
        if(event.detail.direction === 'CW') {
            tmpIndex++;
            if(tmpIndex >= values.length) {
                tmpIndex = 0;
            }
        } else {
            tmpIndex--;
            if(tmpIndex < 0) {
                tmpIndex = values.length - 1;
            }
        }

        valueIndex = tmpIndex;

        onChangeCb(values[valueIndex], valueIndex, event.detail.direction);

        setIndicatorPosition(valueIndex);
    }

    function setValue(value) {
        valueIndex = values.indexOf(value);

        if(valueIndex < 0) {
            throw new Error('values array must contain default value');
        }

        setIndicatorPosition(valueIndex);
    }

    function getValue() {
        return values[valueIndex];
    }

    function setIndicatorSize() {
        $indicator.css(
            'background-image',
            $indicator.css('background-image').replace('90', 90 + rotateStep)
        );
    }

    function setIndicatorPosition(index) {
        $indicator.css('transform', 'rotate(' + (index * rotateStep) + 'deg)');
    }

    function show() {
        if ($root) {
            $root.show();
        } else {
            console.warn('show: bezel component not created yet');
        }
    }

    function hide() {
        if ($root) {
            $root.hide();
        } else {
            console.warn('hide: bezel component not created yet');
        }
    }

    return {
        create: create,
        destroy: destroy,
        setValue: setValue,
        getValue: getValue,
        show: show,
        hide: hide,
    }
});
