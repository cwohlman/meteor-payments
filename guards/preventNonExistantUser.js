Payments.associateGuard(function (transaction) {
  if (!transaction.userId) {
    return new Error('Transaction does not have a userId');
  }
  if (!Meteor.users.findOne(transaction.userId)) {
    return new Error('Transaction user does not exist');
  }
});