Payments.prototype.registerGuard(function (transaction) {
  if (!transaction.userId) {
    return new Payments.Error('missing-user', 'Transaction does not have a userId');
  }
  if (!Meteor.users.findOne(transaction.userId)) {
    return new Payments.Error('missing-user', 'Transaction user does not exist');
  }
});