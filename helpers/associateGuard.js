Payments.associateGuard = Payments.prototype.associateGuard = function (guard) {
  check(guard, Function);
  var self = this;

  // Lazily instantiate self._guards
  if (!_.isArray(self._guards))
    self._guards = [];

  self._guards.push(guard);
};