
// This is basically a clone of Meteor.Error
Payments.Error = Meteor.makeErrorType('Payments.Error'
  , function (error, reason, details) {
    var self = this;

    // a string code representing the error type
    self.error = error;

    // Optional: A short human-readable summary of the error. 
    self.reason = reason;

    // Optional: Additional information about the error, say for
    // debugging. 
    self.details = details;

    // This is what gets displayed at the top of a stack trace. Current
    // format is "[404]" (if no reason is set) or "File not found [404]"
    if (self.reason)
      self.message = self.reason + ' [' + self.error + ']';
    else
      self.message = '[' + self.error + ']';
});

Payments.Error.prototype.clone = function () {
  var self = this;
  return new Meteor.Error(self.error, self.reason, self.details);
};