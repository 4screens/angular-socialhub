/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 14.10.2014.
 */

'use strict';

angular.module('4screens.socialhub', []).factory('socialhub',
  function() {
    return {
      hello: function() {
        return 'hello';
      }
    };
  }
);
