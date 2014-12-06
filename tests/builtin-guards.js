if (Meteor.isServer) {
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow over-charges'
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
      var paymentMethodId = Payments.createPaymentMethod(userId, token);

      test.throws(function () {
        Payments.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: -100
          , kind: 'debit'
        });
      }, function (err) {
        return err.error === 'transaction-invalid';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t allow over-credits'
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
      var paymentMethodId = Payments.createPaymentMethod(userId, token);

      test.throws(function () {
        Payments.createTransaction({
          userId: userId
          , paymentMethodId: paymentMethodId
          , amount: 100
          , kind: 'credit'
        });
      }, function (err) {
        return err.error === 'transaction-invalid';
      });
  });
  Tinytest.add(
    'Payments - Built In Guards - Doesn\'t block partial debits'
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
      var paymentMethodId = Payments.createPaymentMethod(userId, token);

      Payments.createTransaction({
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
    'Payments - Built In Guards - Doesn\'t block partial credits'
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
      var paymentMethodId = Payments.createPaymentMethod(userId, token);

      Payments.createTransaction({
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
}