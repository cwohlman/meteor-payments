var providerCreateCustomer = Operation.create(function (userId) {
  var operation = this
    , self = operation.self
    , trace = operation.trace;

  trace.userId = userId;

  var result = self.provider.createCustomer(userId);
  
  operation.processResponse(result, 'customerId');

  if (result.error || result.status !== 'success') {
    throw result.error || new Error('Operation returned non-success.');
  }

  var customerId = result._id;
  operation.insert(Customers, {
    _id: customerId
    , userId: userId
  });

  operation.log({});
  return customerId;
}, {
  makeError: function (error) {
    error.sanitizedError = new Meteor.Error(
      'create-customer-failed'
      , 'Could not create customer record with the payment provider'
      , {
        logId: this.trace.logId
    });
  }
});

var providerCreatePaymentMethod = Operation.create(
  function (customerId, token) {
  var operation = this
    , self = operation.self
    , trace = operation.trace;

    trace.customerId = customerId;
    trace.token = token;

    var customer = Customers.findOne(customerId);
    trace.userId = customer.userId;

    var result = self.provider.createPaymentMethod(customerId, token);

    operation.processResponse(result, 'paymentMethodId');

    if (result.error || result.status !== 'success') {
      throw result.error || new Error('Operation returned non-success.');
    }

    var paymentMethodId = result._id;
    operation.insert(PaymentMethods, {
      _id: paymentMethodId
      , userId: customer.userId
      , customerId: customerId
      , name: result.name
      , description: result.description
      , acceptsDebits: !!result.acceptsDebits
      , acceptsCredits: !!result.acceptsCredits
    });

    operation.log({});
    return paymentMethodId;
}, {
  makeError: function (error) {
    error.sanitizedError = new Meteor.Error(
      'create-paymentMethod-failed'
      , 'Could not create paymentMethod record with the payment provider'
      , {
        logId: this.trace.logId
    });
  }
});

Payments.prototype.createPaymentMethod = Operation.create(function (userId, token) {
  var operation = this
    , self = operation.self
    , trace = operation.trace
    , customerId;

  trace.userId = userId;
  trace.token = token;

  var customer = Customers.findOne({
    userId: userId
    , providerInstance: self._id
  });
  if (!customer) {
    customerId = providerCreateCustomer.call(self, userId);
  } else {
    customerId = customer._id;
  }
  trace.customerId = customerId;

  var paymentMethodId = providerCreatePaymentMethod.call(self, customerId, token);
  trace.paymentMethodId = paymentMethodId;

  // We don't need to log anything because we didn't interact with the server.
  // each of the two methods we might have called will log their interaction
  // with the payment processing server.
  // We still record all relevant ids on the trace object for consistency.

  return paymentMethodId;
});