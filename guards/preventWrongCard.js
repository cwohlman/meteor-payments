Payments.prototype.registerGuard(function (transaction) {
  var paymentMethod = PaymentMethods.findOne(transaction.paymentMethodId);
  if (!paymentMethod) {
    throw new Payments.Error('payment-missing', 'Payment method not found');
  }
  if (paymentMethod.userId !== transaction.userId) {
    throw new Payments.Error('payment-wrong-user', 'Payment method does not belong to user\'s account');
  }
});