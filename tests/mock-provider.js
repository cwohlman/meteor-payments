MockPayments = new Mongo.Collection('mock-payments');
MockCustomers = new Mongo.Collection('mock-customers');
MockPaymentMethods = new Mongo.Collection('mock-payment-methods');

MockProvider = new Payments();

MockProvider._id = '_mock_provider_';

if (Meteor.isServer) {
  MockProvider.provider = {
    createCustomer: function (userId) {
      var customerId = MockCustomers.insert({
        userId: userId
      });
      var requestId = Random.id();
      return {
        _id: customerId
        , status: 'success'
        , request: {
          userId: userId
        }
        , response: {
          customerId: customerId
          , requestId: requestId
        }
        , requestId: requestId
      };
    }
    , createPaymentMethod: function (customerId, clientToken) {
      var request = {
        customerId: customerId
        , token: clientToken
      };
      var requestId = Random.id();
      var customer = MockCustomers.findOne(customerId);
      var isCard = clientToken[0] === 'c';
      var isBank = clientToken[0] === 'b';

      request.isCard = isCard;
      request.isBank = isBank;

      if (customer && (isCard || isBank)) {
        var paymentMethodId = MockPaymentMethods.insert(request);
        return {
          _id: paymentMethodId
          , status: 'success'
          , request: request
          , response: {
            paymentMethodId: paymentMethodId
            , requestId: requestId
          }
          , requestId: requestId
          , acceptsDebits: isCard
          , acceptsCredits: isBank
          , name: clientToken.slice(-4)
          , description: 'visa ' + clientToken.slice(-4)
        };
      } else {
        return {
          status: 'error'
          , request: request
          , response: {
            error: 'customer not found'
            , statusCode: 404
          }
          , requestId: requestId
        };
      }
    }
    , createCredit: function (transaction) {
      var paymentMethodId = transaction.paymentMethodId;
      var request = {
        paymentMethodId: paymentMethodId
        , kind: 'credit'
        , amount: transaction.amount

      };
      var requestId = Random.id();
      var paymentMethod = MockPaymentMethods.findOne(paymentMethodId);
      var paymentId;
      if (paymentMethod && paymentMethod.isBank) {
        request.status = 'success';
        paymentId = MockPayments.insert(request);
        return {
          _id: paymentId
          , status: 'success'
          , request: request
          , response: {
            paymentId: paymentId
            , requestId: requestId
            , status: 'success'
          }
          , amount: transaction.amount
          , requestId: requestId
        };
      } else {
        paymentId = MockPayments.insert(_.extend({
          status: 'error'
        }, request));
        return {
          _id: paymentId
          , status: 'error'
          , error: new Error('Payment method not found')
          , request: request
          , response: {
            error: 'payment method not found'
            , statusCode: 404
          }
          , requestId: requestId
        };
      }
    }
    , createDebit: function (transaction) {
      var paymentMethodId = transaction.paymentMethodId;
      var request = {
        paymentMethodId: paymentMethodId
        , kind: 'debit'
        , amount: -transaction.amount
      };
      var requestId = Random.id();
      var paymentMethod = MockPaymentMethods.findOne(paymentMethodId);
      var paymentId;
      if (paymentMethod && paymentMethod.isCard) {
        request.status = 'success';
        paymentId = MockPayments.insert(request);
        return {
          _id: paymentId
          , status: 'success'
          , request: request
          , response: {
            paymentId: paymentId
            , requestId: requestId
            , status: 'success'
          }
          , amount: transaction.amount
          , net: transaction.amount
          , requestId: requestId
        };
      } else {
        paymentId = MockPayments.insert(_.extend({
          status: 'error'
        }, request));
        return {
          _id: paymentId
          , status: 'error'
          , error: new Error('Payment method not found')
          , request: request
          , response: {
            error: 'payment method not found'
            , statusCode: 404
          }
          , requestId: requestId
        };
      }
    }
  };
}

MockTokenGenerator = function (card, callback) {
  if (card.number && card.cvv) {
    callback(null, "c" + Random.id());
  } else if (card.account && card.routing) {
    callback(null, "b" + Random.id());
  } else {
    callback(new Error('card not valid'));
  }
};

if (Meteor.isClient) {
  MockProvider.provider = {
    createCardToken: MockTokenGenerator
    , createBankToken: MockTokenGenerator
  };
}