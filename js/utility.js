var noop = function noop() {};
var Log = (function() {
  var console = window.console || { log: noop },
    exports = {};

  var log = function (minLevel, prefix, color, argsObj) {
    if (exports.level > minLevel) {
      var args = Array.prototype.slice.call(argsObj, 0);
      var message = '';
      if (typeof args[0] === 'string') {
        message = args[0];
        args.splice(0,1);
      }
      var output = ['%c[' + prefix + '] ' + message, 'color:' + color];
      if (args.length) {
        output.push.apply(output, args);
      }
      console.log.apply(console, output);
    }
  };

  // 0 None
  // 1 Errors
  // 2 Debug, Errors
  // 3 Debug, Errors, Info
  // 4 Debug, Errors, Info, Trace
  exports.level = 4;
  exports.trace = function() {
    log(3, 'TRACE', '#FF8040', arguments);
  };
  exports.info = function() {
    log(2, 'INFO', '#008000', arguments);
  };
  exports.debug = function() {
    log(1, 'DEBUG', '#0000FF', arguments);
  };
  exports.error = function() {
    log(0, 'ERROR', '#FF0000', arguments);
  };

  return exports;
})();
