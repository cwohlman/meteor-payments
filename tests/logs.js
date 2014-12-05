Tinytest.add(
  'Payments - Logs - Payments.logs.find'
  , function (test) {
    test.isTrue(_.isFunction(Payments.logs.find));
    test.isTrue(_.isArray(Payments.logs.find().fetch()));
});

Tinytest.add(
  'Payments - Logs - Payments.logs.findOne'
  , function (test) {
    test.isTrue(_.isFunction(Payments.logs.findOne));
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
        test.isTrue(_.isObject(Payments.logs.findOne(e.details.logId)));
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
        var log = Payments.logs.findOne(e.details.logId);
        test.equal(log.testId, "12345");
        test.isTrue(_.isDate(log.dateStarted));
        test.isTrue(_.isDate(log.dateEnded));

        // XXX implement a timeout for bette testing
        test.isTrue(log.dateStarted >= start);
        test.isTrue(log.dateEnded >= log.dateStarted);
        test.isTrue(new Date() >= log.dateEnded);
      }
  });
}
