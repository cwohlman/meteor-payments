if (Meteor.isServer) {
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow customer over-charges'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Don't insert a dummy debit
      // var debitId = MockDebits.insert({
      //   userId: userId
      //   , amount: 100
      // });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
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
        });
      }, function (err) {
        return err.error === 'transaction-overcharge';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow customer over-credits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Don't insert a dummy debit
      // var debitId = MockDebits.insert({
      //   userId: userId
      //   , amount: 100
      // });

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
          , amount: 100
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'transaction-overcredit';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Allows customer partial debits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      var debitId = MockDebits.insert({
        userId: userId
        , amount: 200
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
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
    'Payments - Built In Guards - Allows customer partial credits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      var debitId = MockCredits.insert({
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

      MockProvider.createTransaction({
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
    'Payments - Built In Guards - Doesn\'t allow order over-charges'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a debt, but don't set the orderId
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

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: -100
          , kind: 'debit'
          , orderId: Random.id()
        });
      }, function (err) {
        return err.error === 'transaction-overcharge';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow order over-credits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      
      // Insert a credit, but don't set the orderId
      var creditId = MockCredits.insert({
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
          , orderId: Random.id()
          , paymentMethodId: paymentMethodId
          , amount: 100
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'transaction-overcredit';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Allows order partial debits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var orderId = Random.id();
      var debitId = MockDebits.insert({
        userId: userId
        , orderId: orderId
        , amount: 200
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , orderId: orderId
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
    'Payments - Built In Guards - Allows order partial credits'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var orderId = Random.id();
      var debitId = MockCredits.insert({
        userId: userId
        , orderId: orderId
        , amount: 200
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
        , orderId: orderId
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
    'Payments - Built In Guards - Doesn\'t allow payment method to be used by other customer'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var otherUserId = Meteor.users.insert({
        profile: {
          name: 'other'
        }
      });
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(otherUserId, token);

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: 100
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'payment-wrong-user';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow non-integer payment amounts'
    , function (test) {
      // Create a dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100.12
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: 100.12
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'transaction-bad-amount';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow non-existant user'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Random.id();
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      test.throws(function () {
        MockProvider.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: 100
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'missing-user';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Over charge customer warning is overridable'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({cvv: true, number: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);
      MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: -100
        , kind: 'debit'
      }, {
        'transaction-overcharge': true
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
    'Payments - Built In Guards - Over credit customer warning is overridable'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
      }, {
        'transaction-overcredit': true
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
    'Payments - Built In Guards - Over credit order warning is overridable'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var orderId = Random.id();
      var debitId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({account: true, routing: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , orderId: orderId
        , paymentMethodId: paymentMethodId
        , amount: 100
        , kind: 'credit'
      }, {
        'transaction-overcredit': true
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
    'Payments - Built In Guards - Over charge order warning is overridable'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Meteor.users.insert({
        profile: {
          name: 'joe'
        }
      });
      var orderId = Random.id();
      var debitId = MockDebits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({cvv: true, number: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , orderId: orderId
        , paymentMethodId: paymentMethodId
        , amount: -100
        , kind: 'debit'
      }, {
        'transaction-overcharge': true
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
    'Payments - Built In Guards - Non existant user warning is overridable'
    , function (test) {
      // Create a non-existant dummy user for this transaction
      var userId = Random.id();
      var debitId = MockDebits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({cvv: true, number: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the other user's account
      var paymentMethodId = MockProvider.createPaymentMethod(userId, token);

      MockProvider.createTransaction({
        userId: userId
        , paymentMethodId: paymentMethodId
        , amount: -100
        , kind: 'debit'
      }, {
        'missing-user': true
      });

      // Check to see the payment was actually created
      var payment = MockPayments.findOne({
        paymentMethodId: paymentMethodId
      });

      test.equal(payment.amount, 100);
      test.equal(payment.status, 'success');
      test.equal(payment.kind, 'debit');
  });
}