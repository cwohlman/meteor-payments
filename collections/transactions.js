Transactions = new Mongo.Collection('payments-transactions');

Payments.prototype.transactions = {
  find: function () {
    return Transactions.find.apply(Transactions, arguments);
  }
  , findOne: function () {
    return Transactions.findOne.apply(Transactions, arguments);
  }
};