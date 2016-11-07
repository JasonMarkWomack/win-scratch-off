
Scratcher = (function () {


    function getEventCoords(ev) {
        var first, coords = {};
        var origEv = ev.originalEvent;

        if (origEv.changedTouches != undefined) {
            first = origEv.changedTouches[0];
            coords.pageX = first.pageX;
            coords.pageY = first.pageY;
        } else {
            coords.pageX = ev.pageX;
            coords.pageY = ev.pageY;
        }

        return coords;
    };


    function getLocalCoords(elem, coords) {
        var offset = $(elem).offset();
        return {
            'x': coords.pageX - offset.left,
            'y': coords.pageY - offset.top
        };
    };


    function Scratcher(canvasId, backImage) {
        this.canvas = {
            'main': $('#' + canvasId).get(0)
        };

        this.fresh = true;

        this.mouseDown = true;

        this.canvasId = canvasId;

        this._setupCanvases();

        this.setImages(backImage);

        this._eventListeners = {};
    };


    Scratcher.prototype.setImages = function (backImage) {
        this.image = {
            'back': { 'url': backImage, 'img': null }
        };

        if (backImage) {
            this._loadImages();
        }
    };

    Scratcher.prototype.fullAmount = function (stride) {
        var i, l;
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        var count, total;
        var pixels, pdata;

        if (!stride || stride < 1) {
            stride = 1;
        }

        stride *= 4;

        pixels = ctx.getImageData(0, 0, can.width, can.height);
        pdata = pixels.data;
        l = pdata.length;
        total = (l / stride) | 0;

        for (i = count = 0; i < l; i += stride) {
            if (pdata[i] != 0) {
                count++;
            }
        }

        return count / total;
    };


    Scratcher.prototype.recompositeCanvases = function () {
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(this.image.back.img, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
    };

    Scratcher.prototype.scratchLine = function (x, y) {
        var can = this.canvas.main;
        var ctx = can.getContext('2d');
        ctx.lineWidth = 30;
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        if (this.fresh) {
            ctx.beginPath();
            this.fresh = false;
            ctx.moveTo(x + 0.01, y);
        }
        ctx.lineTo(x, y);
        ctx.stroke();
        this.dispatchEvent(this.createEvent('scratch'));
    };


    Scratcher.prototype._setupCanvases = function () {
        var c = this.canvas.main;


        function mousemove_handler(e) {
            if (!this.mouseDown) {
                return true;
            }
            var local = getLocalCoords(c, getEventCoords(e));

            this.scratchLine(local.x, local.y);

            return false;
        };


        $(document).on('mousemove', mousemove_handler.bind(this));
        $(document).on('touchmove', mousemove_handler.bind(this));
    };

    Scratcher.prototype.reset = function () {

        this.fresh = true;
        this.recompositeCanvases();


        this.dispatchEvent(this.createEvent('reset'));
    };


    Scratcher.prototype.mainCanvas = function () {
        return this.canvas.main;
    };

    Scratcher.prototype._loadImages = function () {
        var loadCount = 0;


        function imageLoaded(e) {
            loadCount++;

            if (loadCount >= 1) {
                this.dispatchEvent(this.createEvent('imagesloaded'));
                this.recompositeCanvases();
            }
        }


        for (k in this.image) if (this.image.hasOwnProperty(k)) {
            this.image[k].img = document.createElement('img');
            $(this.image[k].img).on('load', imageLoaded.bind(this));
            this.image[k].img.src = this.image[k].url;
        }
    };

    Scratcher.prototype.createEvent = function (type) {
        var ev = {
            'type': type,
            'target': this,
            'currentTarget': this
        };

        return ev;
    };
    Scratcher.prototype.addEventListener = function (type, handler) {
        var el = this._eventListeners;

        type = type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            el[type] = [];
        }

        if (el[type].indexOf(handler) == -1) {
            el[type].push(handler);
        }
    };

    Scratcher.prototype.removeEventListener = function (type, handler) {
        var el = this._eventListeners;
        var i;

        type = type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            return;
        }

        if (handler) {
            if ((i = el[type].indexOf(handler)) != -1) {
                el[type].splice(i, 1);
            }
        } else {
            el[type] = [];
        }
    };

    Scratcher.prototype.dispatchEvent = function (ev) {
        var el = this._eventListeners;
        var i, len;
        var type = ev.type.toLowerCase();

        if (!el.hasOwnProperty(type)) {
            return;
        }

        len = el[type].length;

        for (i = 0; i < len; i++) {
            el[type][i].call(this, ev);
        }
    };


    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {

                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {
                },
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP
                        ? this
                        : oThis || window,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    return Scratcher;

})();


(function () {
    function supportsCanvas() {
        return !!document.createElement('canvas').getContext;
    }


    function scratcherProgressHandler(ev) {

        var pct = (this.fullAmount(32) * 100) | 0;
        if (pct < 3) {
            if (!$('.scratcher').hasClass('complete')) {
                $('.scratcher').addClass('complete');
                if (!$('#moment').hasClass('appear')) {
                    $('#moment').addClass('appear')
                }
            }
        }
    }

    function scratcherLoadingHandler(ev) {
        $('.scratcher' ).show();
    }

    function initScratcher() {

        var scratcher = new Scratcher('fx-scratcher');

        scratcher.addEventListener('imagesloaded', scratcherLoadingHandler);
        var scratcherImage = 'img/money.png';


        scratcher.setImages(scratcherImage);

        scratcher.addEventListener('scratch', scratcherProgressHandler);
        $('#reset').click(function() {
            scratcher.reset();
            if ($('.scratcher').hasClass('complete')) {
                $('.scratcher').removeClass('complete');
                if ($('#moment').hasClass('appear')) {
                    $('#moment').removeClass('appear')
                }
            }
        });
    }


    $(function () {
        if (supportsCanvas()) {
            initScratcher();
        } else {
            $('#scratcher-box').hide();
            $('#lamebrowser').show();
        }
    });

})();
