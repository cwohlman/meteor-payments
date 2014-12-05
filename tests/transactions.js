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
      
      // Insert a dummy credit to the users account
      var creditId = MockCredits.insert({
        userId: userId
        , amount: 100
      });

      // Generate a mock payment token
      var token;
      MockTokenGenerator({number: true, cvv: true}, function (err, val) {
        token = val;
      });

      // Attach the mock token to the user's account
      var paymentMethodId = Payments.createPaymentMethod(userId, token);

      var paymentMethod = Payments.paymentMethods.findOne(paymentMethodId);

      test.equal(paymentMethod.userId, userId);
  });
}
