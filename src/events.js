angular
  .module('4screen.engagehub.events', [])
  .factory('EngagehubEventsService', function() {
      'use strict';

      var callbacks = {};

      var setCallback = function(name, callback) {
        if (!_.has(callbacks, name)) {
          callbacks[name] = [];
        }

        callbacks[name].push(callback);
      };

      var triggerEvent = function(name) {
        if (!_.has(callbacks, name)) {
          return;
        }

        _.forEach(callbacks[name], function(callback) {
          callback();
        });
      };

      return {
        setCallbackFor: setCallback,
        triggerEvent: triggerEvent
      };
    }
  );
