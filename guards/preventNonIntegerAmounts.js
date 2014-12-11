Payments.prototype.registerGuard(function (transaction) {
  if (Math.round(transaction.amount) !== transaction.amount) {
    throw new Payments.Error("transaction-bad-amount", "Transaction amount is not an integer");
  }
});