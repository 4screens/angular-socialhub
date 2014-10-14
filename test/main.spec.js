/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 14.10.2014.
 */

describe('4screens.socialhub', function() {

  beforeEach(module('4screens.socialhub'));

  beforeEach(inject(function(_socialhub_) {
    socialhub = _socialhub_;
  }));

  describe('socialhub service', function() {

    it('should be defined', function() {
      expect(socialhub).toBeDefined();
    });

    it('should respond to hello method', function() {
      expect(socialhub.hello()).toEqual('hello');
    });

  });


});
