//-----------------------------------------//
// Program: [Program Name]				   //
// Filename: main.js					   //
// Developer: Hunter A. McCabe			   //
// Date last modified: [YYYY.MM.DD]		   //
//-----------------------------------------//


/*! @preserve
 * numeral.js
 * version : 2.0.6
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */
 
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        global.numeral = factory();
    }
}(this, function () {
    /************************************
        Variables
    ************************************/
 
    var numeral,
        _,
        VERSION = '2.0.6',
        formats = {},
        locales = {},
        defaults = {
            currentLocale: 'en',
            zeroFormat: null,
            nullFormat: null,
            defaultFormat: '0,0',
            scalePercentBy100: true
        },
        options = {
            currentLocale: defaults.currentLocale,
            zeroFormat: defaults.zeroFormat,
            nullFormat: defaults.nullFormat,
            defaultFormat: defaults.defaultFormat,
            scalePercentBy100: defaults.scalePercentBy100
        };
 
 
    /************************************
        Constructors
    ************************************/
 
    // Numeral prototype object
    function Numeral(input, number) {
        this._input = input;
 
        this._value = number;
    }
 
    numeral = function(input) {
        var value,
            kind,
            unformatFunction,
            regexp;
 
        if (numeral.isNumeral(input)) {
            value = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            value = 0;
        } else if (input === null || _.isNaN(input)) {
            value = null;
        } else if (typeof input === 'string') {
            if (options.zeroFormat && input === options.zeroFormat) {
                value = 0;
            } else if (options.nullFormat && input === options.nullFormat || !input.replace(/[^0-9]+/g, '').length) {
                value = null;
            } else {
                for (kind in formats) {
                    regexp = typeof formats[kind].regexps.unformat === 'function' ? formats[kind].regexps.unformat() : formats[kind].regexps.unformat;
 
                    if (regexp && input.match(regexp)) {
                        unformatFunction = formats[kind].unformat;
 
                        break;
                    }
                }
 
                unformatFunction = unformatFunction || numeral._.stringToNumber;
 
                value = unformatFunction(input);
            }
        } else {
            value = Number(input)|| null;
        }
 
        return new Numeral(input, value);
    };
 
    // version number
    numeral.version = VERSION;
 
    // compare numeral object
    numeral.isNumeral = function(obj) {
        return obj instanceof Numeral;
    };
 
    // helper functions
    numeral._ = _ = {
        // formats numbers separators, decimals places, signs, abbreviations
        numberToFormat: function(value, format, roundingFunction) {
            var locale = locales[numeral.options.currentLocale],
                negP = false,
                optDec = false,
                leadingCount = 0,
                abbr = '',
                trillion = 1000000000000,
                billion = 1000000000,
                million = 1000000,
                thousand = 1000,
                decimal = '',
                neg = false,
                abbrForce, // force abbreviation
                abs,
                min,
                max,
                power,
                int,
                precision,
                signed,
                thousands,
                output;
 
            // make sure we never format a null value
            value = value || 0;
 
            abs = Math.abs(value);
 
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (numeral._.includes(format, '(')) {
                negP = true;
                format = format.replace(/[\(|\)]/g, '');
            } else if (numeral._.includes(format, '+') || numeral._.includes(format, '-')) {
                signed = numeral._.includes(format, '+') ? format.indexOf('+') : value < 0 ? format.indexOf('-') : -1;
                format = format.replace(/[\+|\-]/g, '');
            }
 
            // see if abbreviation is wanted
            if (numeral._.includes(format, 'a')) {
                abbrForce = format.match(/a(k|m|b|t)?/);
 
                abbrForce = abbrForce ? abbrForce[1] : false;
 
                // check for space before abbreviation
                if (numeral._.includes(format, ' a')) {
                    abbr = ' ';
                }
 
                format = format.replace(new RegExp(abbr + 'a[kmbt]?'), '');
 
                if (abs >= trillion && !abbrForce || abbrForce === 't') {
                    // trillion
                    abbr += locale.abbreviations.trillion;
                    value = value / trillion;
                } else if (abs < trillion && abs >= billion && !abbrForce || abbrForce === 'b') {
                    // billion
                    abbr += locale.abbreviations.billion;
                    value = value / billion;
                } else if (abs < billion && abs >= million && !abbrForce || abbrForce === 'm') {
                    // million
                    abbr += locale.abbreviations.million;
                    value = value / million;
                } else if (abs < million && abs >= thousand && !abbrForce || abbrForce === 'k') {
                    // thousand
                    abbr += locale.abbreviations.thousand;
                    value = value / thousand;
                }
            }
 
            // check for optional decimals
            if (numeral._.includes(format, '[.]')) {
                optDec = true;
                format = format.replace('[.]', '.');
            }
 
            // break number and format
            int = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');
            leadingCount = (format.split('.')[0].split(',')[0].match(/0/g) || []).length;
 
            if (precision) {
                if (numeral._.includes(precision, '[')) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    decimal = numeral._.toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    decimal = numeral._.toFixed(value, precision.length, roundingFunction);
                }
 
                int = decimal.split('.')[0];
 
                if (numeral._.includes(decimal, '.')) {
                    decimal = locale.delimiters.decimal + decimal.split('.')[1];
                } else {
                    decimal = '';
                }
 
                if (optDec && Number(decimal.slice(1)) === 0) {
                    decimal = '';
                }
            } else {
                int = numeral._.toFixed(value, 0, roundingFunction);
            }
 
            // check abbreviation again after rounding
            if (abbr && !abbrForce && Number(int) >= 1000 && abbr !== locale.abbreviations.trillion) {
                int = String(Number(int) / 1000);
 
                switch (abbr) {
                    case locale.abbreviations.thousand:
                        abbr = locale.abbreviations.million;
                        break;
                    case locale.abbreviations.million:
                        abbr = locale.abbreviations.billion;
                        break;
                    case locale.abbreviations.billion:
                        abbr = locale.abbreviations.trillion;
                        break;
                }
            }
 
 
            // format number
            if (numeral._.includes(int, '-')) {
                int = int.slice(1);
                neg = true;
            }
 
            if (int.length < leadingCount) {
                for (var i = leadingCount - int.length; i > 0; i--) {
                    int = '0' + int;
                }
            }
 
            if (thousands > -1) {
                int = int.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + locale.delimiters.thousands);
            }
 
            if (format.indexOf('.') === 0) {
                int = '';
            }
 
            output = int + decimal + (abbr ? abbr : '');
 
            if (negP) {
                output = (negP && neg ? '(' : '') + output + (negP && neg ? ')' : '');
            } else {
                if (signed >= 0) {
                    output = signed === 0 ? (neg ? '-' : '+') + output : output + (neg ? '-' : '+');
                } else if (neg) {
                    output = '-' + output;
                }
            }
 
            return output;
        },
        // unformats numbers separators, decimals places, signs, abbreviations
        stringToNumber: function(string) {
            var locale = locales[options.currentLocale],
                stringOriginal = string,
                abbreviations = {
                    thousand: 3,
                    million: 6,
                    billion: 9,
                    trillion: 12
                },
                abbreviation,
                value,
                i,
                regexp;
 
            if (options.zeroFormat && string === options.zeroFormat) {
                value = 0;
            } else if (options.nullFormat && string === options.nullFormat || !string.replace(/[^0-9]+/g, '').length) {
                value = null;
            } else {
                value = 1;
 
                if (locale.delimiters.decimal !== '.') {
                    string = string.replace(/\./g, '').replace(locale.delimiters.decimal, '.');
                }
 
                for (abbreviation in abbreviations) {
                    regexp = new RegExp('[^a-zA-Z]' + locale.abbreviations[abbreviation] + '(?:\\)|(\\' + locale.currency.symbol + ')?(?:\\))?)?$');
 
                    if (stringOriginal.match(regexp)) {
                        value *= Math.pow(10, abbreviations[abbreviation]);
                        break;
                    }
                }
 
                // check for negative number
                value *= (string.split('-').length + Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2 ? 1 : -1;
 
                // remove non numbers
                string = string.replace(/[^0-9\.]+/g, '');
 
                value *= Number(string);
            }
 
            return value;
        },
        isNaN: function(value) {
            return typeof value === 'number' && isNaN(value);
        },
        includes: function(string, search) {
            return string.indexOf(search) !== -1;
        },
        insert: function(string, subString, start) {
            return string.slice(0, start) + subString + string.slice(start);
        },
        reduce: function(array, callback /*, initialValue*/) {
            if (this === null) {
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
 
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
 
            var t = Object(array),
                len = t.length >>> 0,
                k = 0,
                value;
 
            if (arguments.length === 3) {
                value = arguments[2];
            } else {
                while (k < len && !(k in t)) {
                    k++;
                }
 
                if (k >= len) {
                    throw new TypeError('Reduce of empty array with no initial value');
                }
 
                value = t[k++];
            }
            for (; k < len; k++) {
                if (k in t) {
                    value = callback(value, t[k], k, t);
                }
            }
            return value;
        },
        /**
         * Computes the multiplier necessary to make x >= 1,
         * effectively eliminating miscalculations caused by
         * finite precision.
         */
        multiplier: function (x) {
            var parts = x.toString().split('.');
 
            return parts.length < 2 ? 1 : Math.pow(10, parts[1].length);
        },
        /**
         * Given a variable number of arguments, returns the maximum
         * multiplier that must be used to normalize an operation involving
         * all of them.
         */
        correctionFactor: function () {
            var args = Array.prototype.slice.call(arguments);
 
            return args.reduce(function(accum, next) {
                var mn = _.multiplier(next);
                return accum > mn ? accum : mn;
            }, 1);
        },
        /**
         * Implementation of toFixed() that treats floats more like decimals
         *
         * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
         * problems for accounting- and finance-related software.
         */
        toFixed: function(value, maxDecimals, roundingFunction, optionals) {
            var splitValue = value.toString().split('.'),
                minDecimals = maxDecimals - (optionals || 0),
                boundedPrecision,
                optionalsRegExp,
                power,
                output;
 
            // Use the smallest precision value possible to avoid errors from floating point representation
            if (splitValue.length === 2) {
              boundedPrecision = Math.min(Math.max(splitValue[1].length, minDecimals), maxDecimals);
            } else {
              boundedPrecision = minDecimals;
            }
 
            power = Math.pow(10, boundedPrecision);
 
            // Multiply up by precision, round accurately, then divide and use native toFixed():
            output = (roundingFunction(value + 'e+' + boundedPrecision) / power).toFixed(boundedPrecision);
 
            if (optionals > maxDecimals - boundedPrecision) {
                optionalsRegExp = new RegExp('\\.?0{1,' + (optionals - (maxDecimals - boundedPrecision)) + '}$');
                output = output.replace(optionalsRegExp, '');
            }
 
            return output;
        }
    };
 
    // avaliable options
    numeral.options = options;
 
    // avaliable formats
    numeral.formats = formats;
 
    // avaliable formats
    numeral.locales = locales;
 
    // This function sets the current locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    numeral.locale = function(key) {
        if (key) {
            options.currentLocale = key.toLowerCase();
        }
 
        return options.currentLocale;
    };
 
    // This function provides access to the loaded locale data.  If
    // no arguments are passed in, it will simply return the current
    // global locale object.
    numeral.localeData = function(key) {
        if (!key) {
            return locales[options.currentLocale];
        }
 
        key = key.toLowerCase();
 
        if (!locales[key]) {
            throw new Error('Unknown locale : ' + key);
        }
 
        return locales[key];
    };
 
    numeral.reset = function() {
        for (var property in defaults) {
            options[property] = defaults[property];
        }
    };
 
    numeral.zeroFormat = function(format) {
        options.zeroFormat = typeof(format) === 'string' ? format : null;
    };
 
    numeral.nullFormat = function (format) {
        options.nullFormat = typeof(format) === 'string' ? format : null;
    };
 
    numeral.defaultFormat = function(format) {
        options.defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };
 
    numeral.register = function(type, name, format) {
        name = name.toLowerCase();
 
        if (this[type + 's'][name]) {
            throw new TypeError(name + ' ' + type + ' already registered.');
        }
 
        this[type + 's'][name] = format;
 
        return format;
    };
 
 
    numeral.validate = function(val, culture) {
        var _decimalSep,
            _thousandSep,
            _currSymbol,
            _valArray,
            _abbrObj,
            _thousandRegEx,
            localeData,
            temp;
 
        //coerce val to string
        if (typeof val !== 'string') {
            val += '';
 
            if (console.warn) {
                console.warn('Numeral.js: Value is not string. It has been co-erced to: ', val);
            }
        }
 
        //trim whitespaces from either sides
        val = val.trim();
 
        //if val is just digits return true
        if (!!val.match(/^\d+$/)) {
            return true;
        }
 
        //if val is empty return false
        if (val === '') {
            return false;
        }
 
        //get the decimal and thousands separator from numeral.localeData
        try {
            //check if the culture is understood by numeral. if not, default it to current locale
            localeData = numeral.localeData(culture);
        } catch (e) {
            localeData = numeral.localeData(numeral.locale());
        }
 
        //setup the delimiters and currency symbol based on culture/locale
        _currSymbol = localeData.currency.symbol;
        _abbrObj = localeData.abbreviations;
        _decimalSep = localeData.delimiters.decimal;
        if (localeData.delimiters.thousands === '.') {
            _thousandSep = '\\.';
        } else {
            _thousandSep = localeData.delimiters.thousands;
        }
 
        // validating currency symbol
        temp = val.match(/^[^\d]+/);
        if (temp !== null) {
            val = val.substr(1);
            if (temp[0] !== _currSymbol) {
                return false;
            }
        }
 
        //validating abbreviation symbol
        temp = val.match(/[^\d]+$/);
        if (temp !== null) {
            val = val.slice(0, -1);
            if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million && temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
                return false;
            }
        }
 
        _thousandRegEx = new RegExp(_thousandSep + '{2}');
 
        if (!val.match(/[^\d.,]/g)) {
            _valArray = val.split(_decimalSep);
            if (_valArray.length > 2) {
                return false;
            } else {
                if (_valArray.length < 2) {
                    return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
                } else {
                    if (_valArray[0].length === 1) {
                        return ( !! _valArray[0].match(/^\d+$/) && !_valArray[0].match(_thousandRegEx) && !! _valArray[1].match(/^\d+$/));
                    } else {
                        return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx) && !! _valArray[1].match(/^\d+$/));
                    }
                }
            }
        }
 
        return false;
    };
 
 
    /************************************
        Numeral Prototype
    ************************************/
 
    numeral.fn = Numeral.prototype = {
        clone: function() {
            return numeral(this);
        },
        format: function(inputString, roundingFunction) {
            var value = this._value,
                format = inputString || options.defaultFormat,
                kind,
                output,
                formatFunction;
 
            // make sure we have a roundingFunction
            roundingFunction = roundingFunction || Math.round;
 
            // format based on value
            if (value === 0 && options.zeroFormat !== null) {
                output = options.zeroFormat;
            } else if (value === null && options.nullFormat !== null) {
                output = options.nullFormat;
            } else {
                for (kind in formats) {
                    if (format.match(formats[kind].regexps.format)) {
                        formatFunction = formats[kind].format;
 
                        break;
                    }
                }
 
                formatFunction = formatFunction || numeral._.numberToFormat;
 
                output = formatFunction(value, format, roundingFunction);
            }
 
            return output;
        },
        value: function() {
            return this._value;
        },
        input: function() {
            return this._input;
        },
        set: function(value) {
            this._value = Number(value);
 
            return this;
        },
        add: function(value) {
            var corrFactor = _.correctionFactor.call(null, this._value, value);
 
            function cback(accum, curr, currI, O) {
                return accum + Math.round(corrFactor * curr);
            }
 
            this._value = _.reduce([this._value, value], cback, 0) / corrFactor;
 
            return this;
        },
        subtract: function(value) {
            var corrFactor = _.correctionFactor.call(null, this._value, value);
 
            function cback(accum, curr, currI, O) {
                return accum - Math.round(corrFactor * curr);
            }
 
            this._value = _.reduce([value], cback, Math.round(this._value * corrFactor)) / corrFactor;
 
            return this;
        },
        multiply: function(value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = _.correctionFactor(accum, curr);
                return Math.round(accum * corrFactor) * Math.round(curr * corrFactor) / Math.round(corrFactor * corrFactor);
            }
 
            this._value = _.reduce([this._value, value], cback, 1);
 
            return this;
        },
        divide: function(value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = _.correctionFactor(accum, curr);
                return Math.round(accum * corrFactor) / Math.round(curr * corrFactor);
            }
 
            this._value = _.reduce([this._value, value], cback);
 
            return this;
        },
        difference: function(value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }
    };
 
    /************************************
        Default Locale && Format
    ************************************/
 
    numeral.register('locale', 'en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function(number) {
            var b = number % 10;
            return (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });
 
     
 
(function() {
        numeral.register('format', 'bps', {
            regexps: {
                format: /(BPS)/,
                unformat: /(BPS)/
            },
            format: function(value, format, roundingFunction) {
                var space = numeral._.includes(format, ' BPS') ? ' ' : '',
                    output;
 
                value = value * 10000;
 
                // check for space before BPS
                format = format.replace(/\s?BPS/, '');
 
                output = numeral._.numberToFormat(value, format, roundingFunction);
 
                if (numeral._.includes(output, ')')) {
                    output = output.split('');
 
                    output.splice(-1, 0, space + 'BPS');
 
                    output = output.join('');
                } else {
                    output = output + space + 'BPS';
                }
 
                return output;
            },
            unformat: function(string) {
                return +(numeral._.stringToNumber(string) * 0.0001).toFixed(15);
            }
        });
})();
 
 
(function() {
        var decimal = {
            base: 1000,
            suffixes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        },
        binary = {
            base: 1024,
            suffixes: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
        };
 
    var allSuffixes =  decimal.suffixes.concat(binary.suffixes.filter(function (item) {
            return decimal.suffixes.indexOf(item) < 0;
        }));
        var unformatRegex = allSuffixes.join('|');
        // Allow support for BPS (http://www.investopedia.com/terms/b/basispoint.asp)
        unformatRegex = '(' + unformatRegex.replace('B', 'B(?!PS)') + ')';
 
    numeral.register('format', 'bytes', {
        regexps: {
            format: /([0\s]i?b)/,
            unformat: new RegExp(unformatRegex)
        },
        format: function(value, format, roundingFunction) {
            var output,
                bytes = numeral._.includes(format, 'ib') ? binary : decimal,
                suffix = numeral._.includes(format, ' b') || numeral._.includes(format, ' ib') ? ' ' : '',
                power,
                min,
                max;
 
            // check for space before
            format = format.replace(/\s?i?b/, '');
 
            for (power = 0; power <= bytes.suffixes.length; power++) {
                min = Math.pow(bytes.base, power);
                max = Math.pow(bytes.base, power + 1);
 
                if (value === null || value === 0 || value >= min && value < max) {
                    suffix += bytes.suffixes[power];
 
                    if (min > 0) {
                        value = value / min;
                    }
 
                    break;
                }
            }
 
            output = numeral._.numberToFormat(value, format, roundingFunction);
 
            return output + suffix;
        },
        unformat: function(string) {
            var value = numeral._.stringToNumber(string),
                power,
                bytesMultiplier;
 
            if (value) {
                for (power = decimal.suffixes.length - 1; power >= 0; power--) {
                    if (numeral._.includes(string, decimal.suffixes[power])) {
                        bytesMultiplier = Math.pow(decimal.base, power);
 
                        break;
                    }
 
                    if (numeral._.includes(string, binary.suffixes[power])) {
                        bytesMultiplier = Math.pow(binary.base, power);
 
                        break;
                    }
                }
 
                value *= (bytesMultiplier || 1);
            }
 
            return value;
        }
    });
})();
 
 
(function() {
        numeral.register('format', 'currency', {
        regexps: {
            format: /(\$)/
        },
        format: function(value, format, roundingFunction) {
            var locale = numeral.locales[numeral.options.currentLocale],
                symbols = {
                    before: format.match(/^([\+|\-|\(|\s|\$]*)/)[0],
                    after: format.match(/([\+|\-|\)|\s|\$]*)$/)[0]
                },
                output,
                symbol,
                i;
 
            // strip format of spaces and $
            format = format.replace(/\s?\$\s?/, '');
 
            // format the number
            output = numeral._.numberToFormat(value, format, roundingFunction);
 
            // update the before and after based on value
            if (value >= 0) {
                symbols.before = symbols.before.replace(/[\-\(]/, '');
                symbols.after = symbols.after.replace(/[\-\)]/, '');
            } else if (value < 0 && (!numeral._.includes(symbols.before, '-') && !numeral._.includes(symbols.before, '('))) {
                symbols.before = '-' + symbols.before;
            }
 
            // loop through each before symbol
            for (i = 0; i < symbols.before.length; i++) {
                symbol = symbols.before[i];
 
                switch (symbol) {
                    case '$':
                        output = numeral._.insert(output, locale.currency.symbol, i);
                        break;
                    case ' ':
                        output = numeral._.insert(output, ' ', i + locale.currency.symbol.length - 1);
                        break;
                }
            }
 
            // loop through each after symbol
            for (i = symbols.after.length - 1; i >= 0; i--) {
                symbol = symbols.after[i];
 
                switch (symbol) {
                    case '$':
                        output = i === symbols.after.length - 1 ? output + locale.currency.symbol : numeral._.insert(output, locale.currency.symbol, -(symbols.after.length - (1 + i)));
                        break;
                    case ' ':
                        output = i === symbols.after.length - 1 ? output + ' ' : numeral._.insert(output, ' ', -(symbols.after.length - (1 + i) + locale.currency.symbol.length - 1));
                        break;
                }
            }
 
 
            return output;
        }
    });
})();
 
 
(function() {
        numeral.register('format', 'exponential', {
        regexps: {
            format: /(e\+|e-)/,
            unformat: /(e\+|e-)/
        },
        format: function(value, format, roundingFunction) {
            var output,
                exponential = typeof value === 'number' && !numeral._.isNaN(value) ? value.toExponential() : '0e+0',
                parts = exponential.split('e');
 
            format = format.replace(/e[\+|\-]{1}0/, '');
 
            output = numeral._.numberToFormat(Number(parts[0]), format, roundingFunction);
 
            return output + 'e' + parts[1];
        },
        unformat: function(string) {
            var parts = numeral._.includes(string, 'e+') ? string.split('e+') : string.split('e-'),
                value = Number(parts[0]),
                power = Number(parts[1]);
 
            power = numeral._.includes(string, 'e-') ? power *= -1 : power;
 
            function cback(accum, curr, currI, O) {
                var corrFactor = numeral._.correctionFactor(accum, curr),
                    num = (accum * corrFactor) * (curr * corrFactor) / (corrFactor * corrFactor);
                return num;
            }
 
            return numeral._.reduce([value, Math.pow(10, power)], cback, 1);
        }
    });
})();
 
 
(function() {
        numeral.register('format', 'ordinal', {
        regexps: {
            format: /(o)/
        },
        format: function(value, format, roundingFunction) {
            var locale = numeral.locales[numeral.options.currentLocale],
                output,
                ordinal = numeral._.includes(format, ' o') ? ' ' : '';
 
            // check for space before
            format = format.replace(/\s?o/, '');
 
            ordinal += locale.ordinal(value);
 
            output = numeral._.numberToFormat(value, format, roundingFunction);
 
            return output + ordinal;
        }
    });
})();
 
 
(function() {
        numeral.register('format', 'percentage', {
        regexps: {
            format: /(%)/,
            unformat: /(%)/
        },
        format: function(value, format, roundingFunction) {
            var space = numeral._.includes(format, ' %') ? ' ' : '',
                output;
 
            if (numeral.options.scalePercentBy100) {
                value = value * 100;
            }
 
            // check for space before %
            format = format.replace(/\s?\%/, '');
 
            output = numeral._.numberToFormat(value, format, roundingFunction);
 
            if (numeral._.includes(output, ')')) {
                output = output.split('');
 
                output.splice(-1, 0, space + '%');
 
                output = output.join('');
            } else {
                output = output + space + '%';
            }
 
            return output;
        },
        unformat: function(string) {
            var number = numeral._.stringToNumber(string);
            if (numeral.options.scalePercentBy100) {
                return number * 0.01;
            }
            return number;
        }
    });
})();
 
 
(function() {
        numeral.register('format', 'time', {
        regexps: {
            format: /(:)/,
            unformat: /(:)/
        },
        format: function(value, format, roundingFunction) {
            var hours = Math.floor(value / 60 / 60),
                minutes = Math.floor((value - (hours * 60 * 60)) / 60),
                seconds = Math.round(value - (hours * 60 * 60) - (minutes * 60));
 
            return hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
        },
        unformat: function(string) {
            var timeArray = string.split(':'),
                seconds = 0;
 
            // turn hours and minutes into seconds and add them all up
            if (timeArray.length === 3) {
                // hours
                seconds = seconds + (Number(timeArray[0]) * 60 * 60);
                // minutes
                seconds = seconds + (Number(timeArray[1]) * 60);
                // seconds
                seconds = seconds + Number(timeArray[2]);
            } else if (timeArray.length === 2) {
                // minutes
                seconds = seconds + (Number(timeArray[0]) * 60);
                // seconds
                seconds = seconds + Number(timeArray[1]);
            }
            return Number(seconds);
        }
    });
})();
 
return numeral;
}));

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

//Constants
const ES = ""; //Empty String
const BR = "<br />"; //line break tag
const PA = "<p />"; //paragraph break tag
const SP = " "; //space
const PR = "."; //period

//Variables
var money = 0;
var money_per_click = 1;
var money_per_second = 1;
var costc = 50;
var costs = 50;
var companylvl = 0;
var companyprice = 1000000;
var companyupgradeprice = 500000;
var companyincome = 1000;
//var dToday = new Date();
//var dLast = new Date();

//var playedbefore = prompt("Load Save? (if you are new to the game say 'n') [Y/N]")

//if(playedbefore.toUpperCase() == "Y")
if(isNaN(localStorage.getItem("dlr")) == false)
{
	money = parseInt(localStorage.getItem("dlr"));
money_per_click = parseInt(localStorage.getItem("mpc"));
money_per_second = parseInt(localStorage.getItem("mps"));
costc = parseInt(localStorage.getItem("costc"));
costs = parseInt(localStorage.getItem("costs"));
//dLast = new Date(localStorage.getItem("dLast"));
//dToday = new Date(dToday)
//secondsLast = dLast.getTime()/1000;
//secondsToday = dToday.getTime()/1000;
//seconds = secondsToday-secondsLast;
//seconds = Math.round(seconds);
//console.log(seconds);
//money += money_per_second*seconds;
}
else
{
var money = 0;
var money_per_click = 1;
var money_per_second = 1;
var costc = 50;
var costs = 50;
var companylvl = 0;
var companyprice = 1000000;
var companyupgradeprice = 500000;
var companyincome = 1000;
//var dToday = new Date();
//var dLast = new Date();
}



//localStorage.setItem("dLast", dToday);
localStorage.setItem("dlr", money);
localStorage.setItem("mpc", money_per_click);
localStorage.setItem("mps", money_per_second);
localStorage.setItem("costc", costc);
localStorage.setItem("costs", costs);


//Use Keyboard to Click Buttons
window.onkeydown = function(event){
    if(event.keyCode === 32 || event.keyCode === 13) {//Space key or Enter key clicks clicker
        getMoney();
    }
	if(event.keyCode === 49) {//'1' key upgrades money per click
        upgradeClicker();
    }
	if(event.keyCode === 50) {//'2' key upgrades money per second
        upgradeMps();
    }
	if(event.keyCode === 51) {//'3' key upgrades both
		upgradeClicker();
        upgradeMps();
    }
    if(event.keyCode === 52) {//'4' key buy business
		buyCompany();
    }
    if(event.keyCode === 53) {//'5' key upgrade business
		upgradeCompany();
    }
    if(event.keyCode === 67) {//'c' key opens credits menu
		alert("***CREDITS***\nDeveloper: Hunter McCabe <hmc@programmer.net>\nIcons from www.flaticon.com");
    }
    if(event.keyCode === 72) {//'h' key opens help menu
		alert("***HELP MENU***\nh - opens help\nc - credits menu\n1 - upgrades money per click\n2 - upgrades money per second\n3 - upgrade both 1 & 2\n4 - buy company\n5 - upgrade company");
    }
};
function init()
{
	timer = setInterval(mps, 100);
	document.title = formatNumber(money) + " - Money Clicker";
}
function getMoney()
{
	money += money_per_click;
	updateDisplay();
}
function upgradeClicker()
{
	money -= costc;
	costc = costc * 1.45;
	costc = costc.toFixed(0);
	if (money < 0)
	{
		alert("You are in debt.");
	}
	if (costc < 1000)
		money_per_click += 4;
	else if (costc >= 1000 && costc < 5000)
		money_per_click += 6;
	else if (costc >= 5000 && costc < 10000)
		money_per_click += 8;
	else if (costc >= 10000 && costc < 15000)
		money_per_click += 10;
	else if (costc >= 15000 && costc < 30000)
		money_per_click += 20;
	else if (costc >= 30000 && costc < 50000)
		money_per_click += 40;
	else if (costc >= 50000 && costc < 100000)
		money_per_click += 60;
	else if (costc >= 100000 && costc < 500000)
		money_per_click += 80;
	else if (costc >= 500000 && costc < 1000000)
		money_per_click += 100;
	else if (costc >= 1000000)
		money_per_click += 200;
	updateDisplay();
}
function upgradeMps()
{
	money -= costs;
	costs = costs * 1.5;
	costs = costs.toFixed(0);
	if (money < 0)
	{
		alert("You are in debt.");
	}
	if (costs < 1000)
		money_per_second += 4;
	else if (costs >= 1000 && costs < 5000)
		money_per_second += 6;
	else if (costs >= 5000 && costs < 10000)
		money_per_second += 8;
	else if (costs >= 10000 && costs < 15000)
		money_per_second += 10;
	else if (costs >= 15000 && costs < 30000)
		money_per_second += 20;
	else if (costs >= 30000 && costs < 50000)
		money_per_second += 40;
	else if (costs >= 50000 && costs < 100000)
		money_per_second += 60;
	else if (costs >= 100000 && costs < 500000)
		money_per_second += 80;
	else if (costs >= 500000 && costs < 1000000)
		money_per_second += 100;
	else if (costs >= 1000000)
		money_per_second += 200;
	updateDisplay();
}
function mps()
{
	
	money += money_per_second/10;
	updateDisplay();
}
function compincome()
{
	money += companyincome;
	updateDisplay();
}
function strtincome()
{
	incomepersec = setInterval(compincome, 1000);
	updateDisplay();
}
function buyCompany()
{
	money -= companyprice;
	if (money < 0)
	{
		alert("You are in debt.");
	}
	companylvl = 1;
	companyname = prompt("What is the name of your company?");
	document.getElementById('companyname').innerHTML = companyname;
	document.getElementById('companylvl').innerHTML = companylvl;		
	document.getElementById('upgradecomp').style.visibility = "visible";	
	document.getElementById('upgradecompprice').style.visibility = "visible";
	document.getElementById('companyprice').style.visibility = "hidden";
	document.getElementById('buycomp').style.visibility = "hidden";
	strtincome();
	updateDisplay();
}
function upgradeCompany()
{
	money -= companyupgradeprice;
	if (money < 0)
	{
		alert("You are in debt.");
	}
	companylvl += 1;
	companyupgradeprice *= 1.5;
	companyincome += 1000;
	companyupgradeprice = companyupgradeprice.toFixed(0);
	updateDisplay();
}
function buyComp(x)
{
	if (x == "xom")
	{
		price = 300000000;
		action = confirm("Buy Exxon Mobil Corporation?");
		if (action == true)
		{
			alert("Bought Exxon Mobil Corporation");
			money -= price;
			income = price / 40;
			income = income.toFixed(0);
			income = parseInt(income);
			companyincome += income;
			disp[0] = "Exxon Mobil Corporation\n***OWNED***";
		}
		else
		{
			alert("Sale Canceled");
		}
		
		
	}
	else if (x == "ge")
	{
		price = 250000000;
		action = confirm("Buy General Electric Company?");
		if (action == true)
		{
			alert("Bought General Electric Company");
			money -= price;
			income = price / 40;
			income = income.toFixed(0);
			income = parseInt(income);
			companyincome += income;
			disp[1] = "General Electric Company\n***OWNED***";
		}
		else
		{
			alert("Sale Canceled");
		}
	}
	else if (x == "msft")
	{
		price = 1000000000;
		action = confirm("Buy Microsoft?");
		if (action == true)
		{
			alert("Bought Microsoft");
			money -= price;
			income = price / 40;
			income = income.toFixed(0);
			income = parseInt(income);
			companyincome += income;
			disp[2] = "Microsoft\n***OWNED***";
		}
		else
		{
			alert("Sale Canceled");
		}
	}
}
function enableCheats()
{
    var sw = document.getElementById('sw');
    if (sw.checked == true)
    {
        action = confirm("Are you sure you want to enter cheat mode?");
        if (action == true)
        {
            alert("Press ESC to bring up a prompt for cheat codes.");
            window.onkeydown = function(event){
                if(event.keyCode === 27) {//'esc' key brings up cheat prompts
		          var code = prompt("Enter cheat code:");
		              if (code == "smallloan")
                          money += 1000000;
                      else if (code == "bankrupt")
                          money = 0;
                      else if (code == "billgates")
                          money += 1000000000;
                      else if (code == "paintmoney")
                      {
                          var clr = prompt("What color lol");
                          document.getElementById("clicker").style.fill = clr;
                      }
                      else if (code == "paintbg")
                      {
                          var clr = prompt("What color lol");
                          document.body.style.backgroundColor = clr;
                      }
                      else if (code == "reset")
                      {
                          resetstorage();
                      }
                      else
                          alert("Invalid Code.");
    }
};
        }
        else
            return false;
    }
    else
    {
        alert("Cheat mode is turned off.");
        window.onkeydown = function(event){
                if(event.keyCode === 27) {//'esc' key brings up cheat prompts
		          alert("Cheat mode is turned off.");
                }
    };
}
}
function updateDisplay()
{
	document.getElementById("money").innerHTML = formatNumber(Math.round(money));
	document.getElementById("mpc").innerHTML = numeral(money_per_click).format("$0.00a");
	document.getElementById("mpc_upgrade_cost").innerHTML = numeral(costc).format("$0.00a");
	document.getElementById("mps").innerHTML = numeral(money_per_second).format("$0.00a");
	document.getElementById("mps_upgrade_cost").innerHTML = numeral(costs).format("$0.00a");
	document.getElementById("amnt").innerHTML = numeral(money).format("$0.00a");;
	document.getElementById("companyprice").innerHTML = numeral(companyprice).format("$0.0a");
	document.getElementById('companylvl').innerHTML = companylvl;
	document.getElementById('upgradecompprice').innerHTML = numeral(companyupgradeprice).format("$0.0a");
	document.getElementById('companyincome').innerHTML = numeral(companyincome).format("$0.00a");
	document.title = numeral(money).format("$0.00a") + " - Money Clicker";
//localStorage.setItem("dLast", dToday);
localStorage.setItem("dlr", money);
localStorage.setItem("mpc", money_per_click);
localStorage.setItem("mps", money_per_second);
localStorage.setItem("costc", costc);
localStorage.setItem("costs", costs);
}
/*window.onbeforeunload = function(){
   localStorage.setItem("dLast", dToday);
}*/
