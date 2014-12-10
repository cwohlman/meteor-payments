Payments.createTransaction = Operation.create(function (
  transaction, overrideWarnings
) {
  var self = this
    , trace = self.trace;

  _.extend(trace, transaction);

  // Pre insert transaction.
  // We insert the transaction here in case two transactions run simultaneously
  // this allows the transaction amount checks to take into account any other
  // pending transactions.
  // Note that guards which calculate transaction amounts will need to filter
  // out the current transaction
  var transactionId = self.insert(Transactions, transaction);
  transaction._id = transactionId;
  trace.transactionId = transactionId;

  // Process payment guards
  var warnings = _.map(Payments._guards, function (guard) {
    try {
      return guard(transaction);
    } catch (e) {
      Transactions.remove(transactionId);
      delete trace.transactionId;
      throw e;
    }
  });

  warnings = _.flatten(warnings);

  warnings = _.filter(warnings, _.isObject);
  trace.warnings = warnings;
  trace.errors = _.filter(warnings, function (a) {
    var code = a.error;
    var overrideAll = overrideWarnings && overrideWarnings["*"] === true;
    var overrideThis = overrideWarnings && overrideWarnings[code] === true;
    return !overrideAll && !overrideThis;
  });

  if (trace.errors.length) {
    Transactions.remove(transactionId);
    delete trace.transactionId;
    throw trace.errors[0];
  }

  trace.sentRequest = true;

  var result;
  if (transaction.kind === 'credit') {
    result = Payments.provider.createCredit(transaction);
  } else if (transaction.kind === 'debit') {
    result = Payments.provider.createDebit(transaction);
  } else {
    throw new Error('transaction kind is invalid');
  }

  trace.gotResponse = true;

  self.processResponse(result, 'providerId');

  if (result) {
    self.update(Transactions, transactionId, {
      $set: {
        providerId: result._id
        , status: result.status
      }
    });
  } else {
    throw new Error("no response was recieved from the server");
  }

  if (result.error || result.status === 'error') {
    throw result.error || new Error('the server returned an error');
  }

  return transactionId;
}, {
  makeError: function (error) {
    var self = this;
    var trace = self.trace;

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

    return new Meteor.Error(
      code
      , message
      , {
        logId: this.trace.logId
        , internalError: error instanceof Meteor.Error ? error : null
      });  }
});