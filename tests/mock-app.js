MockCredits = new Mongo.Collection('mock-credits');
MockDebits = new Mongo.Collection('mock-debits');

if (Meteor.isServer) {

  // A complex way to initialize the payment processing system, this is
  _.each({
    'registerCredits': [function (transaction) {
      return _.map(MockCredits.find({
        userId: transaction.userId
      }).fetch(), function (doc) {
        return _.pick(doc, '_id', 'amount', 'userId');
      });
    }]
    , 'registerDebits': [function (transaction) {
      return _.map(MockDebits.find({
        userId: transaction.userId
      }).fetch(), function (doc) {
        return _.pick(doc, '_id', 'amount', 'userId');
      });
    }]
    , 'registerTransactions': [function (transaction) {
      var query = _.pick(transaction, 'orderId');
      var credits = _.map(MockCredits.find(query).fetch(), function (doc) {
        var result = _.pick(doc, '_id', 'amount', 'orderId');
        result.amount = -result.amount;
        return result;
      });
      var debits = _.map(MockDebits.find(query).fetch(), function (doc) {
        return _.pick(doc, '_id', 'amount', 'orderId');
      });
      return credits.concat(debits);
    }]
    , 'registerOrderType': ['invoice', 'orderId']
    , 'registerGuard': [function (transaction) {
      if (transaction.isInvalid) {
        throw new Payments.Error(
          'transaction-is-invalid'
          , "The transaction is invalid."
        );
      }
      if (transaction.isRisky) {
        return new Payments.Error(
          'transaction-is-risky'
          , "The transaction is risky"
        );
      }
    }]
  }, function (args, key) {
      Tinytest.add(
        'Payments - Config - Payments.' + key + ' exists'
        , function (test) {
          test.isTrue(_.isFunction(MockProvider[key]));
        });
      try {
        MockProvider[key].apply(MockProvider, args);
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
  try {
    MockProvider.registerOrderType('userCharge', 'userId');
  } catch (e) {
    Tinytest.add(
      'Payments - Config - Payments.registerOrderType'
      , function (test) {
        throw e;
      });
  }
}