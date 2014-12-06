MockCredits = new Mongo.Collection('mock-credits');
MockDebits = new Mongo.Collection('mock-debits');

if (Meteor.isServer) {

  // A complex way to initialize the payment processing system, this is
  _.each({
    'associateCredits': [function (userId) {
      return MockCredits.find({
        userId: userId
      }).fetch();
    }, function (doc) {
      return doc;
    }]
    , 'associateDebits': [function (userId) {
      return MockDebits.find({
        userId: userId
      }).fetch();
    }, function (doc) {
      return doc;
    }]
    , 'associateOrders': ['orderId']
    , 'associateGuard': [function (transaction) {
      if (transaction.isInvalid) {
        throw new Meteor.Error(
          'transaction-is-invalid'
          , "The transaction is invalid."
        );
      }
      if (transaction.isRisky) {
        return new Meteor.Error(
          'transaction-is-risky'
          , "The transaction is risky"
        );
      }
    }]
  }, function (args, key) {
      Tinytest.add(
        'Payments - Config - Payments.' + key + ' exists'
        , function (test) {
          test.isTrue(_.isFunction(Payments[key]));
        });
      try {
        Payments[key].apply(Payments, args);
        Tinytest.add(
          'Payments - Config - Payments.' + key
          , function (test) {
            test.isTrue(true);
          });
      } catch (e) {
        Tinytest.add(
          'Payments - Config - Payments.' + key
          , function (test) {
            throw e;
          });
      }
  });
}