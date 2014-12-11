Tinytest.add(
  'Payments - Logs - Payments.logs.find'
  , function (test) {
    test.isTrue(_.isFunction(MockProvider.logs.find));
    test.isTrue(_.isArray(MockProvider.logs.find().fetch()));
});

Tinytest.add(
  'Payments - Logs - Payments.logs.findOne'
  , function (test) {
    test.isTrue(_.isFunction(MockProvider.logs.findOne));
});

if (Meteor.isServer) {
  Tinytest.add(
    'Payments - Logs - Logs errors'
    , function (test) {

      var fn = Operation.create(function () {
        if (_.toArray(arguments).length > 5) throw new Error('Bug');
        else return true;
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        test.isTrue(_.isObject(MockProvider.logs.findOne(
          e.sanitizedError.details.logId)));
      }
  });
  Tinytest.add(
    'Payments - Logs - Logs trace details'
    , function (test) {
      var start = new Date();
      var fn = Operation.create(function () {
        this.trace.testId = "12345";

        if (_.toArray(arguments).length > 5) throw new Error('Bug');
        else return true;
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        var log = MockProvider.logs.findOne(e.sanitizedError.details.logId);
        test.equal(log.testId, "12345");
        test.isTrue(_.isDate(log.dateStarted));
        test.isTrue(_.isDate(log.dateEnded));

        // XXX implement a timeout for bette testing
        test.isTrue(log.dateStarted >= start);
        test.isTrue(log.dateEnded >= log.dateStarted);
        test.isTrue(new Date() >= log.dateEnded);
      }
  });
  Tinytest.add(
    'Payments - Logs - Logs error with stack trace'
    , function (test) {
      var start = new Date();
      var fn = Operation.create(function () {
        this.trace.testId = "12345";

        if (_.toArray(arguments).length > 5) throw new Error('Bug');
        else return true;
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        var log = MockProvider.logs.findOne(e.sanitizedError.details.logId);
        test.equal(log.testId, "12345");
        test.isTrue(_.isObject(log.error));
        test.equal(log.error.message, "Bug");
        test.isTrue(log.error.stack.match("Bug"));
      }
  });
  Tinytest.add(
    'Payments - Logs - Logs meteor error with stack trace'
    , function (test) {
      var start = new Date();
      var fn = Operation.create(function () {
        this.trace.testId = "12345";

        if (_.toArray(arguments).length > 5) throw new Meteor.Error('Bug');
        else return true;
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        var log = MockProvider.logs.findOne(e.details.logId);
        test.equal(log.testId, "12345");
        test.isTrue(_.isObject(log.error));
        test.equal(log.error.error, "Bug");
        test.equal(log.error.message, "[Bug]");
        test.isTrue(log.error.stack.match("Bug"));
      }
  });
  Tinytest.add(
    'Payments - Logs - Logs errors property'
    , function (test) {
      var start = new Date();
      var fn = Operation.create(function () {

        this.log({
          errors: [
            new Error('Bug')
          ]
        });

        throw new Error();
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        var log = MockProvider.logs.findOne(e.sanitizedError.details.logId);
        test.isTrue(_.isObject(log.errors[0]));
        test.equal(log.errors[0].message, "Bug");
        test.isTrue(log.errors[0].stack.match("Bug"));
      }
  });
  Tinytest.add(
    'Payments - Logs - Logs warnings property'
    , function (test) {
      var start = new Date();
      var fn = Operation.create(function () {

        this.log({
          warnings: [
            new Error('Bug')
          ]
        });

        throw new Error();
      });

      try {
        fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      } catch (e) {
        var log = MockProvider.logs.findOne(e.sanitizedError.details.logId);
        test.isTrue(_.isObject(log.warnings[0]));
        test.equal(log.warnings[0].message, "Bug");
        test.isTrue(log.warnings[0].stack.match("Bug"));
      }
  });
}
