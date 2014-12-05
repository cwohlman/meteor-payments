Payments._creditGetters = [];

Payments.associateCredits = function (getRecords, getAmounts) {
  check(getRecords, Function);
  check(getAmounts, Function);

  Payments._creditGetters.push({
    records: getRecords
    , amounts: getAmounts
  });
};