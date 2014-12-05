Payments._debitGetters = [];

Payments.associateDebits = function (getRecords, getAmounts) {
  check(getRecords, Function);
  check(getAmounts, Function);

  Payments._debitGetters.push({
    records: getRecords
    , amounts: getAmounts
  });
};