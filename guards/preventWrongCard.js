Payments.associateGuard(function (transaction) {
  var paymentMethod = PaymentMethods.findOne(transaction.paymentMethodId);
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  if (paymentMethod.userId !== transaction.userId) {
    throw new Error('Payment method does not belong to user\'s account');
  }
});