Payments.prototype.registerGuard(function (transaction) {
  if (Math.round(transaction.amount) !== transaction.amount) {
    throw new Error("Transaction amount is not an integer");
  }
});