PaymentMethods = new Mongo.Collection('payments-paymentMethods');

Payments.prototype.paymentMethods = PaymentMethods;