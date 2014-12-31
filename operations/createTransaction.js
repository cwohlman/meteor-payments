Payments.prototype.createTransaction = Operation.create(function (
  transaction, overrideWarnings
) {
  check(transaction, Object);
  check(overrideWarnings, Match.Optional(Object));
  var operation = this
    , self = operation.self
    , trace = operation.trace;

  _.extend(trace, transaction);

  // Pre insert transaction.
  // We insert the transaction here in case two transactions run simultaneously
  // this allows the transaction amount checks to take into account any other
  // pending transactions.
  // Note that guards which calculate transaction amounts will need to filter
  // out the current transaction
  var transactionId = operation.insert(Transactions, transaction);
  transaction._id = transactionId;
  trace.transactionId = transactionId;

  // Process payment guards
  var warnings;

  try {
    warnings = self.checkGuards(transaction);
  } catch (e) {
    // We remove the transaction because it really was never created.
    // we've thrown an error, which will log this request, and also inform
    // the caller that this transaction failed.
    Transactions.remove(transactionId);
    delete trace.transactionId;
    throw e;
  }

  warnings = _.flatten(warnings);

  trace.warnings = warnings;
  trace.errors = _.filter(warnings, function (a) {
    var code = a.error;
    var overrideAll = overrideWarnings && overrideWarnings["*"] === true;
    var overrideThis = overrideWarnings && overrideWarnings[code] === true;
    return !overrideAll && !overrideThis;
  });

  if (trace.errors.length) {
    // We remove the transaction because it really was never created.
    // we've thrown an error, which will log this request, and also inform
    // the caller that this transaction failed.
    Transactions.remove(transactionId);
    delete trace.transactionId;
    throw trace.errors[0];
  }

  trace.sentRequest = true;

  var result;
  if (transaction.kind === 'credit') {
    result = self.provider.createCredit(transaction);
  } else if (transaction.kind === 'debit') {
    result = self.provider.createDebit(transaction);
  } else {
    throw new Error('transaction kind is invalid');
  }

  trace.gotResponse = true;

  operation.processResponse(result, 'providerId');

  if (result) {
    operation.update(Transactions, transactionId, {
      $set: {
        providerId: result._id
        , status: result.status
        , net: result.net
      }
    });
  } else {
    throw new Error("no response was recieved from the server");
  }

  if (result.error || result.status === 'error') {
    throw result.error || new Error('the server returned an error');
  }

  this.log({});

  return transactionId;
}, {
  makeError: function (error) {
    var operation = this;
    var trace = operation.trace;

    var code;
    var message;

    if (!trace.sentRequest) {
      // Error was thrown before the request was made
      code = "transaction-invalid";
      message = "The transaction is invalid";
    } else if (trace.gotResponse) {
      code = "transaction-rejected";
      message = "The transaction was rejected by the payment provider";
    } else {
      code = "transaction-failed";
      message = "The transaction failed unexpectedly";
    }

    error.sanitizedError = new Meteor.Error(
      code
      , message
      , {
        internalError: error instanceof Meteor.Error ? error : null
      });  }
});