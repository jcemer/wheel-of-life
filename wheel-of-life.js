;(function ($) {
    'use strict';

    // thanks to http://www.mobify.com/
    $.CSS = {
        cache: {},
        prefixes: ['Webkit', 'Moz', 'O', 'ms', '']
    };

    $.CSS.getProperty = function (name) {
        var div, property;
        if (typeof $.CSS.cache[name] !== 'undefined') {
            return $.CSS.cache[name];
        }

        div = document.createElement('div').style;
        for (var i = 0; i < $.CSS.prefixes.length; ++i) {
            if (div[$.CSS.prefixes[i] + name] != undefined) {
                return $.CSS.cache[name] = $.CSS.prefixes[i] + name;
            }
        }
    }

    $.supports = {
        transform:   !!($.CSS.getProperty('Transform')),
        transform3d: !!(window.WebKitCSSMatrix && 'm11' in new WebKitCSSMatrix())
    };

    $.translate = function(element, deltaX, deltaY) {
        var property = $.CSS.getProperty('Transform');
        if (typeof deltaX === 'number') deltaX = deltaX + 'px';
        if (typeof deltaY === 'number') deltaY = deltaY + 'px';
 
        if ($.supports.transform3d) {
            element.style[property] = 'translate3d(' + deltaX + ', ' + deltaY + ', 0)';
        } else if ($.supports.transform) {
            element.style[property] = 'translate(' + deltaX + ', ' + deltaY + ')';
        } else {
            element.style.left      = deltaX;
            element.style.top       = deltaY;
        }
    };
})(jQuery);


;(function ($) {
    'use strict';

    var isTouch  = document.ontouchstart === null;
    var defaults = {
        rangeAttr:     'wheel-of-life-range',
        rangeBtnAttr:  'wheel-of-life-range-btn',
        tapGesture:    isTouch ? 'tap' : 'click',
        startGesture:  isTouch ? 'touchstart' : 'mousedown',
        moveGesture:   isTouch ? 'touchmove' : 'mousemove',
        stopGesture:   isTouch ? 'touchend touchcancel' : 'mouseup'
    };

    function Range(input, angle) {
        this.input     = $(input);
        this.angle     = angle;
        this.container = this.input.wrap('<div data-' + defaults.rangeAttr + '>').parent();
        this.container.addClass(defaults.rangeAttr)

        // number
        this.min       = parseInt(this.input.attr('min'), 10);
        this.max       = parseInt(this.input.attr('max'), 10);
        this.amount    = (this.max - this.min) + 1;
        this.current   = parseInt(this.input.val(), 10) - this.min;

        // html
        this.btn       = $('<div data-' + defaults.rangeBtnAttr + '>');
        this.btn.addClass(defaults.rangeBtnAttr);
        this.container.append(this.btn);

        this.size      = this.input.width();
        this.gap       = this.size / (this.amount - 1);

        // init
        this.change(this.current);
        this.input.trigger('init', [this.current, this]);
    }

    Range.events = function () {
        this.events = $.noop;
        // singleton pattern

        var root      = $(document);

        root.on(defaults.startGesture, '[data-' + defaults.rangeBtnAttr + ']', function (event) {
            var range   = getRange(this);
            var initPos = Math.sin(range.angle) * (event.pageX || (event.touches[0] && event.touches[0].pageX) || 0)
                        + Math.cos(range.angle) * (event.pageY || (event.touches[0] && event.touches[0].pageY) || 0);
            var pos;

            function animate(event) {
                event.preventDefault();
                pos  = range.pos() - initPos;
                pos += Math.sin(range.angle) * (event.pageX || (event.touches[0] && event.touches[0].pageX) || 0)
                     + Math.cos(range.angle) * (event.pageY || (event.touches[0] && event.touches[0].pageY) || 0);

                pos  = Math.max(0, Math.min(pos, range.size));
                range.move(pos / range.gap);
            }

            function stop(event) {
                root.off(defaults.moveGesture, animate);
                root.off(defaults.stopGesture, stop);
                range.moving(false);
                range.change(pos / range.gap);
            }

            if (range) {
                range.moving(true);
                root.bind(defaults.moveGesture, animate);
                root.bind(defaults.stopGesture, stop);
            }
        });
    }

    $.extend(Range.prototype, {
        pos: function () {
            return this.current * this.gap;
        },
        moving: function (status) {
            return this.container.toggleClass('moving', status);
        },
        move: function(to) {
            var pos = to * this.gap;
            $.translate(this.btn[0], Math.sin(this.angle) * pos, Math.cos(this.angle) * pos);
            this.input.trigger('move', [to, this]);
        },
        change: function(to) {
            to = Math.round(to);
            this.move(to);

            this.current = to;
            this.input.val(this.current + this.min);
            this.input.trigger('change', [to, this]);
        }
    });

    function createRange(input, angle) {
        var range = new Range(input, angle);
        return range.container.data(defaults.rangeAttr, range);
    }

    function getRange(item) {
        return $(item).closest('[data-' + defaults.rangeAttr + ']')
            .data(defaults.rangeAttr);
    }

    window.WheelOfLife = function(container, edges) {
        Range.events();
        for (var i = 0; i < edges; i++) {
            var input        = $('<input type=range min=1 max=4 value=1>').appendTo(container);
            var angle        = Math.PI * i / (edges / 2);
            var rangeWrapper = createRange(input, angle);
            $.translate(rangeWrapper[0], 100 * Math.sin(angle) + 250, 100 * Math.cos(angle) + 250)
        }
    };

})(jQuery);