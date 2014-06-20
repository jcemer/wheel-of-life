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

    $.translate = function(element, x, y) {
        var property = $.CSS.getProperty('Transform');
        if (typeof x === 'number') x = x + 'px';
        if (typeof y === 'number') y = y + 'px';

        if ($.supports.transform3d) {
            element.style[property] = 'translate3d(' + x + ', ' + y + ', 0)';
        } else if ($.supports.transform) {
            element.style[property] = 'translate(' + x + ', ' + y + ')';
        } else {
            element.style.left      = x;
            element.style.top       = y;
        }
    };
})(jQuery);


;(function ($) {
    'use strict';

    var isTouch  = (function () {
      return 'ontouchstart' in window // works on most browsers
          || 'onmsgesturechange' in window; // works on ie10
    })();
    var defaults = {
        canvasAttr:    'wheel-of-life-canvas',
        rangeAttr:     'wheel-of-life-range',
        rangeBtnAttr:  'wheel-of-life-range-btn',
        startGesture:  isTouch ? 'touchstart' : 'mousedown',
        moveGesture:   isTouch ? 'touchmove' : 'mousemove',
        stopGesture:   isTouch ? 'touchend touchcancel' : 'mouseup'
    };

    function Canvas(size, centerRadius) {
        this.size         = size;
        this.halfSize     = size / 2;
        this.centerRadius = centerRadius;
        this.edges        = [];

        this.element      = $('<canvas class=' + defaults.canvasAttr + ' width=' + size + ' height=' + size + ' />');
        this.ctx          = this.element[0].getContext('2d');
    }

    $.extend(Canvas.prototype, {
        init: function () {
            this.allowRender = true;
            this.render();
        },
        clear: function () {
            this.ctx.clearRect(0, 0, this.size, this.size);
        },
        render: function () {
            this.clear();
            this.renderArc();
            this.renderEdges();
            this.renderEdgesLine();
        },
        renderArc: function () {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#A7DBD8';
            this.ctx.lineWidth = this.halfSize - this.centerRadius;
            this.ctx.arc(this.halfSize, this.halfSize, this.centerRadius + this.ctx.lineWidth / 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        },
        renderEdges: function () {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#999999';
            for (var edge = 0; edge < this.edges.length; edge++) {
                this.ctx.beginPath();
                this.ctx.lineTo(
                    this.edges[edge].sin * this.centerRadius + this.halfSize,
                    this.edges[edge].cos * this.centerRadius + this.halfSize);
                this.ctx.lineTo(
                    this.edges[edge].sin * this.halfSize + this.halfSize,
                    this.edges[edge].cos * this.halfSize + this.halfSize);
                this.ctx.stroke();
            }
        },
        renderEdgesLine: function () {
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (var edge = 0; edge < this.edges.length; edge++) {
                this.ctx.lineTo(this.edges[edge].x, this.edges[edge].y);
            }
            this.ctx.closePath();
            this.ctx.fillStyle = "rgba(0,0,0,.2)";
            this.ctx.fill();
        },
        moveEdge: function (edge, angle, pos) {
            var sin = Math.sin(angle);
            var cos = Math.cos(angle);
            this.edges[edge] = {
                sin: sin,
                cos: cos,
                x:   sin * (pos + this.centerRadius) + this.halfSize,
                y:   cos * (pos + this.centerRadius) + this.halfSize
            }
            this.allowRender && this.render();
        }
    });


    function Range(angle, size) {
        this.angle     = angle;
        this.size      = size;

        // html
        this.container = $('<div data-' + defaults.rangeAttr + ' class=' + defaults.rangeAttr + '>');
        this.btn       = $('<div data-' + defaults.rangeBtnAttr + ' class=' + defaults.rangeBtnAttr + '>');
        this.input     = $('<input type=range min=1 max=4 value=1>');
        this.container.append(this.input);
        this.container.append(this.btn);

        // number
        this.min       = parseInt(this.input.attr('min'), 10);
        this.max       = parseInt(this.input.attr('max'), 10);
        this.gap       = size / (this.max - this.min);
        this.current   = parseInt(this.input.val(), 10) - this.min;
    }

    $.extend(Range.prototype, {
        init: function () {
            this.change(this.current);
            this.input.trigger('init', [this.current, this]);
        },
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
            this.moveCanvas && this.moveCanvas(pos);
        },
        change: function(to) {
            to = Math.round(to);
            this.move(to);

            this.current = to;
            this.input.val(this.current + this.min);
            this.input.trigger('change', [to, this]);
        },
        addCanvas: function (canvas, edge) {
            this.moveCanvas = function (pos) {
                canvas.moveEdge(edge, this.angle, pos);
            }
        }
    });

    Range.events = function () {
        this.events = $.noop;
        // singleton pattern

        var root = $(document);

        root.on(defaults.startGesture, '[data-' + defaults.rangeBtnAttr + ']', function (event) {
            var range   = getRange(this);
            var pos     = range.pos();
            var initPos = Math.sin(range.angle) * (event.pageX || (event.originalEvent.touches[0] && event.originalEvent.touches[0].pageX) || 0)
                        + Math.cos(range.angle) * (event.pageY || (event.originalEvent.touches[0] && event.originalEvent.touches[0].pageY) || 0);

            function animate(event) {
                event.preventDefault();
                pos  = range.pos() - initPos;
                pos += Math.sin(range.angle) * (event.pageX || (event.originalEvent.touches[0] && event.originalEvent.touches[0].pageX) || 0)
                     + Math.cos(range.angle) * (event.pageY || (event.originalEvent.touches[0] && event.originalEvent.touches[0].pageY) || 0);

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
                root.on(defaults.moveGesture, animate);
                root.on(defaults.stopGesture, stop);
            }
        });
    }

    function createCanvas(container, size, centerRadius) {
        var canvas = new Canvas(size, centerRadius);
        container.append(canvas.element);
        return canvas;
    }

    function createRange(container, angle, size) {
        var range = new Range(angle, size);
        container.append(range.container.data(defaults.rangeAttr, range));
        return range;
    }

    function getRange(item) {
        return $(item).closest('[data-' + defaults.rangeAttr + ']')
            .data(defaults.rangeAttr);
    }

    window.WheelOfLife = function(container, edges, centerRadius) {
        var size     = container.width();
        var halfSize = size / 2;
        var canvas   = createCanvas(container, size, centerRadius);
        for (var edge = 0; edge < edges; edge++) {
            var angle = Math.PI * edge / (edges / 2);
            var range = createRange(container, angle, halfSize - centerRadius);
            range.addCanvas(canvas, edge);
            range.init();
            $.translate(range.container[0], centerRadius * Math.sin(angle) + halfSize,
                                            centerRadius * Math.cos(angle) + halfSize);
        }
        canvas.init();
        Range.events();
    };

})(jQuery);
