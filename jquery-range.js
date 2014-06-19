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
        transform: !!($.CSS.getProperty('Transform')),
        transform3d: !!(window.WebKitCSSMatrix && 'm11' in new WebKitCSSMatrix())
    };

    $.supports.addClass = function () {
        $.each(arguments, function () {
            $('html').addClass(($.supports[this] ? '' : 'no-') + this);
        });
    };

    $.translate = function(element, deltaX, deltaY) {
        var property = property = $.CSS.getProperty('Transform');
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
        name:         'range',
        tapGesture:   isTouch ? 'tap' : 'click',
        startGesture: isTouch ? 'touchstart' : 'mousedown',
        moveGesture:  isTouch ? 'touchmove' : 'mousemove',
        stopGesture:  isTouch ? 'touchend touchcancel' : 'mouseup'
    };

    function Range(input, angle) {
        this.input     = $(input);
        this.angle     = angle;
        this.container = this.input.wrap('<div>').parent();
        this.container.addClass(defaults.name + ' ' + this.input[0].className);

        // number
        this.min       = parseInt(this.input.attr('min'), 10);
        this.max       = parseInt(this.input.attr('max'), 10);
        this.amount    = (this.max - this.min) + 1;
        this.current   = parseInt(this.input.val(), 10) - this.min;

        // html
        this.btn       = $('<div class="btn">');
        this.container.append(this.btn);

        this.btn.size  = this.btn.width();
        this.size      = this.input.width() - this.btn.size;
        this.gap       = this.size / (this.amount - 1);

        // init
        this.change(this.current);
        this.input.trigger('init', [this.current, this]);
    }

    Range.events = function () {
        this.events = $.noop;
        // singleton pattern

        var root      = $(document);
        var className = '.' + defaults.name;

        root.on(defaults.startGesture, className + ' .btn', function (event) {
            var range   = getRange(this);
            var pos     = range && range.pos();
            var initPos = Math.sin(range.angle) * (event.pageX || (event.touches[0] && event.touches[0].pageX) || 0)
                        + Math.cos(range.angle) * (event.pageY || (event.touches[0] && event.touches[0].pageY) || 0);


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
        if (!$(input).closest('.' + defaults.name).length) {
            var range = new Range(input, angle);
            range.container.data('range', range);
        }
    }

    function getRange(item) {
        var element = $(item).closest('.' + defaults.name);
        return element.data('range');
    }

    // plugin
    $.fn.range = function(angle) {
        Range.events();
        return this.each(function() {
            createRange($(this), angle);
        });
    };

})(jQuery);