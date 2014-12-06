Payments.associateGuard(function (transaction) {
  if (!transaction.userId) {
    return new Error('transaction-missing-user', 'Transaction does not have a userId');
  }
  if (!Meteor.users.findOne(transaction.userId)) {
    return new Error('transaction-missing-user', 'Transaction user does not exist');
  }
});