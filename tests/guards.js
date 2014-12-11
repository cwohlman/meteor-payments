if (Meteor.isServer) {
  Tinytest.add(
    'Payments - Guards - Enforces custom guards'
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
        , amount: 200
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: -100
          , kind: 'debit'
          , isInvalid: true
        });
      }, function (err) {
        return err.sanitizedError.error === 'transaction-invalid' &&
          err.error === 'transaction-is-invalid';
      });

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: -100
          , kind: 'debit'
          , isRisky: true
        });
      }, function (err) {
        return err.sanitizedError.error === 'transaction-invalid' &&
          err.error === 'transaction-is-risky';
      });
  });
  Tinytest.add(
    'Payments - Guards - Respects overrideWarnings flag'
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

      MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
        , isRisky: true
      }, {
        'transaction-is-risky': true
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
    'Payments - Guards - Respects overrideWarnings * flag'
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
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
        , isRisky: true
      }, {
        '*': true
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
    'Payments - Guards - Doesn\'t allow errors to be overriden'
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
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: -100
          , kind: 'debit'
          , isInvalid: true
        }, {
          "*": true
        });
      }, function (err) {
        return err.sanitizedError.error === 'transaction-invalid' &&
          err.error === 'transaction-is-invalid';
      });
  });
}