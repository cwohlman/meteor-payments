var providerCreateCustomer = Operation.create(function (userId) {
  var self = this
    , trace = self.trace;

  trace.userId = userId;

  var result = Payments.provider.createCustomer(userId);
  
  self.processResponse(result);

  var customerId = result._id;
  Customers.insert({
    _id: customerId
    , userId: userId
  });

  self.log({});
  return customerId;
}, {
  makeError: function (error) {
    return new Meteor.Error(
      'create-customer-failed'
      , 'Could not create customer record with the payment provider'
      , {
        internalError: error instanceof Meteor.Error ? error : null
        , logId: this.trace.logId
    });
  }
});

var providerCreatePaymentMethod = Operation.create(
  function (customerId, token) {
  var self = this
    , trace = self.trace;

    trace.customerId = customerId;
    trace.token = token;

    var customer = Customers.findOne(customerId);
    trace.userId = customer.userId;

    var result = Payments.provider.createPaymentMethod(customerId, token);

    self.processResponse(result);

    var paymentMethodId = result._id;
    PaymentMethods.insert({
      _id: paymentMethodId
      , userId: customer.userId
      , customerId: customerId
      , acceptsDebits: !!result.acceptsDebits
      , acceptsCredits: !!result.acceptsCredits
    });

    self.log({});
    return paymentMethodId;
}, {
  makeError: function (error) {
    return new Meteor.Error(
      'create-paymentMethod-failed'
      , 'Could not create customer record with the payment provider'
      , {
        internalError: error instanceof Meteor.Error ? error : null
        , logId: this.trace.logId
    });
  }
});

Payments.createPaymentMethod = Operation.create(function (userId, token) {
  var self = this
    , trace = self.trace;

  trace.userId = userId;
  trace.token = token;

  var customer = Customers.findOne({
    userId: userId
  });
  if (!customer) {
    customerId = providerCreateCustomer(userId);
  }
  trace.customerId = customerId;

  var paymentMethodId = providerCreatePaymentMethod(customerId, token);
  trace.paymentMethodId = paymentMethodId;

  // We don't need to log anything because we didn't interact with the server.
  // each of the two methods we might have called will log their interaction
  // with the payment processing server.
  // We still record all relevant ids on the trace object for consistency.

  return paymentMethodId;
}, {
  throwError: function (error) {
    var recognizedCode = error && _.contains([
      "create-customer-failed"
      , "create-paymentMethod-failed"
      ], error.error);

    // If we recognize the error code, pass the error on through.
    if (recognizedCode) throw error;
    // otherwise use the default handling code.
    else {
      Operation.prototype.throwError.apply(this, arguments);
    }
  }
});