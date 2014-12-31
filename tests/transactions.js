if (Meteor.isServer) {
  Tinytest.add(
    'Payments - Transactions - Associate payment method with user account'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var paymentMethod = MockProvider.paymentMethods.findOne(paymentMethodId);

      test.equal(paymentMethod.userId, userId);
      test.isTrue(_.isString(paymentMethod.name));
      test.isTrue(paymentMethod.name.length > 3);
      test.isTrue(_.isString(paymentMethod.description));
      test.isTrue(paymentMethod.description.length > 3);
  });
  Tinytest.add(
    'Payments - Transactions - Handles invalid payment method'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });

      // Generate a mock payment token
      var token = 'xxx';

      test.throws(function () {
        MockProvider.createPaymentMethod(userId, token);
      }, function (err) {
        return err.sanitizedError.error === 'create-paymentMethod-failed';
      });
  });
  Tinytest.add(
    'Payments - Transactions - Simple debit transaction'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a dummy credit to the users account
      var debitId = MockDebits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var transactionId = MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: -100
        , kind: 'debit'
      });

      // Check to see the payment was actually created
      var payment = MockPayments.findOne({
        paymentMethodId: paymentMethodId
      });

      test.equal(payment.amount, 100);
      test.equal(payment.status, 'success');
      test.equal(payment.kind, 'debit');
  });
  Tinytest.add(
    'Payments - Transactions - stores net'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a dummy credit to the users account
      var debitId = MockDebits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var transactionId = MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: -100
        , kind: 'debit'
      });

      // Check to see the payment was actually created
      var payment = MockProvider.transactions.findOne(transactionId);

      test.equal(payment.amount, -100);
      test.equal(payment.net, -100);
      test.equal(payment.status, 'success');
      test.equal(payment.kind, 'debit');
  });
  Tinytest.add(
    'Payments - Transactions - Simple credit transaction'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a dummy credit to the users account
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var transactionId = MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
      });

      // Check to see the payment was actually created
      var payment = MockPayments.findOne({
        paymentMethodId: paymentMethodId
      });

      test.equal(payment.amount, 100);
      test.equal(payment.status, 'success');
      test.equal(payment.kind, 'credit');
  });
  Tinytest.add(
    'Payments - Transactions - providerId'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a dummy credit to the users account
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var transactionId = MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
      });

      // Check to see the payment was actually created
      var payment = MockProvider.transactions.findOne({
        paymentMethodId: paymentMethodId
      });

      var paymentMethod = MockProvider.paymentMethods.findOne(paymentMethodId);

      test.equal(payment.providerInstance, '_mock_provider_');
      test.equal(paymentMethod.providerInstance, '_mock_provider_');
    });
  Tinytest.add(
    'Payments - Transactions - ignores payment methods from other providers'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a dummy credit to the users account
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      var badCustomerId = MockProvider.customers.insert({
        userId: userId
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      var paymentMethod = MockProvider.paymentMethods.findOne(paymentMethodId);

      test.isTrue(paymentMethod.customerId !== badCustomerId);
    });
}
