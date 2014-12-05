Logs = new Mongo.Collection('payments-logs');

Payments.logs = {
  find: function () {
    return Logs.find.apply(Logs, arguments);
  }
  , findOne: function () {
    return Logs.findOne.apply(Logs, arguments);
  }
};