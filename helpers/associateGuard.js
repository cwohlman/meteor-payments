Payments._guards = [];

Payments.associateGuard = function (guard) {
  check(guard, Function);
  Payments._guards.push(guard);
};