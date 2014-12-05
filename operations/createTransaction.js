Payments.createTransaction = Operation.create(function (transaction) {
  var self = this
    , trace = self.trace;

  _.extend(trace, transaction);

  var transactionId = Transactions.insert(transaction);
  trace.transactionId = transactionId;

  var result;
  if (transaction.kind === 'credit') {
    result = Payments.provider.createCredit(transaction);
  } else if (transaction.kind === 'debit') {
    result = Payments.provider.createDebit(transaction);
  } else {
    throw new Error('transaction kind is invalid');
  }

  self.processResponse(result, 'providerId');

  if (result) {
    Transactions.update(transactionId, {
      $set: {
        providerId: result._id
        , status: result.status
      }
    });
  } else {
    throw new Meteor.Error("no response was recieved from the server");
  }

  if (result.error || result.status === 'error') {
    throw new Meteor.Error(
      'transaction-rejected'
      , "The transaction was rejected by the payment provider"
      , {
        internalError: result.error
      }
    );
  }

  return transactionId;
}, {
  makeError: function (error) {
    var recognizedCode = error && _.contains([
      "transaction-failed"
      , "transaction-rejected"
      , "transaction-invalid"
      ], error.error);

    // If we recognize the error code, pass the error on through.
    if (recognizedCode) {
      error.details.logId = this.logId;
      return error;
    }
    // otherwise use the default handling code.
    else {
      return new Meteor.Error(
        'transaction-failed'
        , "The transaction failed unexpectedly.");
    }
  }
});