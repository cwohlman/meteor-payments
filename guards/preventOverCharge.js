
// Ensures that any transactions which contain a userId will not exceed a zero
// balance
Payments.prototype.registerAccountField('userId');

// Ensures that entries in the transactions collection will be counted when
// calculating an account balance
Payments.prototype.registerTransactions(function (transaction) {
  check(transaction, Object);
  var self = this;

  return _.flatten(_.map(self._accountFields, function (fieldName) {
    check(fieldName, String);

    var filter = _.pick(transaction, fieldName);
    filter.status = {
      $ne: "error"
    };
    if (self._id) filter.providerInstance = self._id;
    var fields = {
      amount: 1
    };
    fields[fieldName] = 1;
    // We assume that nulls were set on purpose and download transactions
    // which have null set for the field.
    if (_.isUndefined(filter[fieldName])) 
      return [];
    else
      // Returns objects in the form:
      // {_id: 'xxx', 'amount': 1200, [fieldName]: 'xxx'}
      return Transactions.find(filter, {fields: fields}).fetch();
  }));
});

// Payments.associateGuard(function (transaction) {
//   var errors = [];
//   var userId = transaction.userId;
//   var credits = _.chain(Payments._creditGetters)
//     .map(function (options) {
//       return _.map(options.records(userId), function (doc) {
//         return options.amounts(doc);
//       });
//     })
//     .flatten()
//     .filter(function (doc) {
//       return doc.userId === userId;
//     })
//     ;
//   var debits = _.chain(Payments._debitGetters)
//     .map(function (options) {
//       return _.map(options.records(userId), function (doc) {
//         return options.amounts(doc);
//       });
//     })
//     .flatten()
//     .filter(function (doc) {
//       return doc.userId === userId;
//     })
//     ;
//   var transactions = _.chain(Transactions.find({
//     userId: userId
//     , _id: {
//       $ne: transaction._id
//     }
//   }).fetch());

//   var creditMemo = function (memo, value) {
//     return memo - (value && value.amount || 0);
//   };
//   var debitMemo = function (memo, value) {
//     return memo + (value && value.amount || 0);
//   };

//   // It's important to get the sign of these amounts correctly.
//   // credits and debits are both returned as positive integers,
//   // by negating the credit amounts we ensure that the combined total of
//   // credits and debits is the amount the customer owes us.
//   var totalCredits = credits.reduce(creditMemo, 0).value();
//   var totalDebits = debits.reduce(debitMemo, 0).value();
//   // we want the amounts to reflect what the customer owes us.
//   // we don't need to negate the transactions amount because it already
//   // reflects the amount that customers owe us as (debits are already negative)
//   var totalTransactions = transactions.reduce(debitMemo, 0).value();

//   var customerBalance = totalTransactions + totalCredits + totalDebits;
//   var newBalance = customerBalance + transaction.amount;

//   // If we owe the customer money after the transaction, and this is a charge
//   // that's an error.
//   if (newBalance < 0 && transaction.amount < 0) {
//     errors.push(new Payments.Error(
//       "over-charges-customer"
//       , "Transaction over charges customer"
//       , {
//         totalCredits: totalCredits
//         , totalDebits: totalDebits
//         , totalTransactions: totalTransactions
//         , customerBalance: customerBalance
//         , newBalance: newBalance
//     }));
//   }
//   // If the customer owes us money after the transaction, and this is a credit
//   // that's an error
//   if (newBalance > 0 && transaction.amount > 0) {
//     errors.push(new Payments.Error(
//       "over-credits-customer"
//       , "Transaction over credits customer"
//       , {
//         totalCredits: totalCredits
//         , totalDebits: totalDebits
//         , totalTransactions: totalTransactions
//         , customerBalance: customerBalance
//         , newBalance: newBalance
//     }));
//   }

//   if (Payments._orderFields) {
//     var filter = {};
//     _.each(Payments._orderFields, function (val) {
//       if (transaction[val]) filter[val] = transaction[val];
//     });

//     if (_.any(filter, _.identity)) {
//       var orderCredits = credits.where(filter).reduce(creditMemo, 0).value();
//       var orderDebits = debits.where(filter).reduce(debitMemo, 0).value();
//       var orderTransactions = transactions.where(filter).reduce(debitMemo, 0)
//         .value();

//       var orderBalance = orderCredits + orderDebits + orderTransactions;
//       var adjustedBalance = orderBalance + transaction.amount;

//       if (adjustedBalance < 0 && transaction.amount < 0) {
//         errors.push(new Payments.Error(
//           "over-charges-order"
//           , "Transaction over charges order"
//           , {
//             orderCredits: orderCredits
//             , orderDebits: orderDebits
//             , orderTransactions: orderTransactions
//             , orderBalance: orderBalance
//             , adjustedBalance: adjustedBalance
//         }));
//       }
//       if (adjustedBalance > 0 && transaction.amount > 0) {
//         errors.push(new Payments.Error(
//           "over-credits-order"
//           , "Transaction over credits order"
//           , {
//             orderCredits: orderCredits
//             , orderDebits: orderDebits
//             , orderTransactions: orderTransactions
//             , orderBalance: orderBalance
//             , adjustedBalance: adjustedBalance
//         }));
//       }
//     }
//   }

//   return errors;
// });