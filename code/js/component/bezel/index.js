define(['jquery'], function(jquery) {
    var valueIndex;
    var values;

    var onChangeCb = function() {};

    var $root;
    var $indicator;

    function create(config) {
        values = config.values || [0, 1, 2, 3, 4, 5, 6, 7];
        setValue(config.value || 0);

        $root = $(config.root);
        $indicator = createMarkup();

        if(config.onChange) {
            onChangeCb = config.onChange;
        }
        bindEvents();
    }

    function destroy() {
        unbindEvents();
        console.log('destroyed');
    }

    function createMarkup() {
        $root.addClass('bezel');
        var $indicator = $('<div class="bezel__indicator"></div>');
        $root.append($indicator).append([
            '<div class="bezel__frame"></div>',
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
        console.log(event);

        onChangeCb('dupa ' + event.detail.direction);
    }

    function setValue(value) {
        valueIndex = values.indexOf(value);

        if(valueIndex < 0) {
            throw new Error('values array must contain default value');
        }
    }

    function getValue() {
        return values[valueIndex];
    }

    function setIndicatorPosition() {

    }

    return {
        create: create,
        destroy: destroy,
        setValue: setValue,
        getValue: getValue
    }
});
