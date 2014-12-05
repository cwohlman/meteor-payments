Payments._orderFields = [];

Payments.associateOrders = function () {
  var orderFields = _.flatten(_.toArray(arguments));
  Payments._orderFields = Payments._orderFields.concat(orderFields);
};