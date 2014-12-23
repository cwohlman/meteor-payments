// Write your package code here!
Payments = function () {};

// Registers a function to return related debits and credits to a particular
// transaction
// getter is a function which takes a single argument 'transaction' and returns
// an array of documents with id's for any related entity and an amount field
// which represents the amount of the related transaction.
Payments.prototype.registerTransactions = function(getter) {
  check(getter, Function);
  var self = this;

  // Initialize _transactionGetters
  if (!_.isArray(self._transactionGetters))
    self._transactionGetters = [];
  // Ensure we have an own copy of _transactionGetters
  if (!_.has(self, '_transactionGetters'))
    self._transactionGetters = _.clone(self._transactionGetters);

  return self._transactionGetters.push(getter);
};
// Note: Credits are transactions where the customer pays us.
//       Debits are transactions where the customer owes us.
//       Amounts are normalized to show a positive amount when the customer
//       owes us money.
Payments.prototype.registerDebits = Payments.prototype.registerTransactions;
Payments.prototype.registerCredits = function (getter) {
  check(getter, Function);
  var self = this;

  // Invert the amounts.
  return self.registerTransactions(function (transaction) {
    var result = getter(transaction);

    check(result, [Match.Where(_.isObject)]);
    _.each(result, function (a) {
      a.amount = -a.amount;
    });
    return result;
  });
};

// Registers a function which performs arbitrary checks against a transaction
// allows the user to perform custom validations of a transaction
Payments.prototype.registerGuard = function(guard) {
  check(guard, Function);
  var self = this;

  // Initialize _transactionGuards
  if (!_.isArray(self._transactionGuards))
    self._transactionGuards = [];
  // Ensure we have an own copy of _transactionGuards
  if (!_.has(self, '_transactionGuards'))
    self._transactionGuards = _.clone(self._transactionGuards);

  return self._transactionGuards.push(guard);
};

// Runs checks against a transaction and returns any errors found.
// Should not throw an error.
Payments.prototype.checkGuards = function (transaction) {
  check(transaction, Object);
  var self = this;

  var errors = [];
  var transactions = self.getRelatedTransactions(transaction);

  _.each(self._transactionGuards, function (guard) {
    // guard should either throw or return an error, depending on whether
    // the error is overridable.
    var error = guard(transaction, transactions);

    if (!_.isUndefined(error)) {
      errors.push(error);
      if (!_.isObject(error) || !error.stack) {
        errors.push(
          new Error("Payment processing guards should return " +
            "an error or undefined, not: " + typeof error
          )
        );
      }
    }
  });

  return errors;
};

// Registers a set of fields which comprise the minimum fields necessary to
// charge for an order. You can register multiple orderTypes, but if you
// register any order types a guard will be added to ensure that at least
// one order type matches.
// Name is a descriptive name for the orderType and will be saved on the
// transaction, e.g. Invoice, use plural when payments can
// legitemately be processed for multiple items at a time, e.g. use Invoices
// (plural) if you bill a company monthly for the invoices from the previous
// month.
Payments.prototype.registerOrderType = function(name/* fields ...*/) {
  check(arguments, [String]);
  var self = this;

  // Initialize _orderFields
  if (!_.isArray(self._orderTypes))
    self._orderTypes = {};
  // Ensure we have an own copy of _orderTypes
  if (!_.has(self, '_orderTypes'))
    self._orderTypes = _.clone(self._orderTypes);
  if (!_.has(self, '_orderTypeGuard')) {
    self._orderTypeGuard = self.registerGuard(function (transaction) {
      check(transaction, Object);

      var passes = _.any(self._orderTypes, function (fieldNames, name) {
        if (_.all(fieldNames, function (fieldName) {
          return !_.isUndefined(transaction[fieldName]);
        })) {
          transaction.orderType = name;
          return true;
        }
      });

      if (!passes) {
        return new Payments.Error('transaction-missing-orderType'
          , "The transaction is missing required order metadata."
          , self._orderTypes
        );
      }
    });
  }

  var fieldNames = _.toArray(arguments).slice(1);

  _.each(fieldNames, function (fieldName) {
    self.registerAccountField(fieldName);
  });

  self._orderTypes[name] = fieldNames;

  return name;
};

// Registers a single field as an 'accountField' and registers a guard to
// prevent transactions with the accountId specified by fieldName from
// being overcharged or overcredited.
Payments.prototype.registerAccountField = function (fieldName) {
  check(fieldName, String);
  var self = this;

  // Initialize _accountFields
  if (!_.isArray(self._accountFields))
    self._accountFields = [];
  // Ensure we have an own copy of _accountFields
  if (!_.has(self, '_accountFields'))
    self._accountFields = _.clone(self._accountFields);

  // Multiple calls to this function refering to the same fieldName
  // will have no effect
  if (self._accountFields.indexOf(fieldName) === -1) {
    self._accountFields.push(fieldName);
    self.registerGuard(function (transaction, relatedTransactions) {
      check(transaction, Object);
      check(relatedTransactions, [Match.Where(_.isObject)]);

      // We only run this check if the transaction actually contains a value
      // in the related field
      if (_.isUndefined(transaction[fieldName]))
        return;
      var filter = _.pick(transaction, fieldName);
      var accountTotal = self.getAccountTotal(filter, relatedTransactions);

      if (accountTotal > 0 && transaction.amount > 0) {
        return new Payments.Error('transaction-overcredit'
          , "Transaction overcredits account: " + filter[fieldName] + 
            " (" + fieldName + ")"
        );
      }
      if (accountTotal < 0 && transaction.amount < 0) {
        return new Payments.Error('transaction-overcharge'
          , "Transaction overcharges account: " + filter[fieldName] + 
            " (" + fieldName + ")"
        );
      }
    });
  }
};

// Takes a filter (such as a transaction) and returns related transactions
// works by iterating through _transactionGetters
Payments.prototype.getRelatedTransactions = function(filter) {
  check(filter, Object);
  var self = this;

  return _.flatten(_.map(self._transactionGetters, function (getter) {
    var result = getter.call(self, filter);
    check(result, [Match.Where(_.isObject)]);
    return result;
  }));
};

// Takes a filter (such as a transaction) and optionally an array of
// transactions and returns the sum of all amounts.
Payments.prototype.getAccountTotal = function(filter, transactions) {
  check(filter, Object);
  check(transactions, Match.Optional([Match.Where(_.isObject)]));
  var self = this;

  if (!transactions) {
    transactions = self.getRelatedTransactions(filter);
  }
  
  transactions = _.where(transactions, filter);
  return _.reduce(transactions, function (memo, doc) {
    check(doc.amount, Match.Where(_.isFinite));
    return memo + doc.amount;
  }, 0);
};
