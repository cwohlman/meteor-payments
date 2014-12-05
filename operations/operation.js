// Wraps a function in our standard logging and guards
Operation = Payments.Operation = function () {
  this.trace = {
    dateStarted: new Date()
  };
};

// Generates a wrapper function which will call the inner function with a new
// Operation as it's context.

Operation.create = function (fn, extensions) {
  return function () {
    // create a variable self to which we attach helper methods and which stores
    // the state of the current request.
    var self = new Operation();
    _.extend(self, extensions);
    
    var result;

    try {
      result = fn.apply(self, arguments);
    } catch (e) {
      result = self.throwError(e);
    }
    return result;
  };
};

Operation.prototype.throwError = function (error) {
  console.log(error);

  this.log({
    error: error
  });

  throw this.makeError(error);
};

Operation.prototype.makeError = function (error) {
  return new Meteor.Error(500, 'Internal Server Error', {
    internalError: error instanceof Meteor.Error ? error : null
    , logId: this.trace.logId
  });
};

Operation.prototype.log = function (trace) {
  trace.dateEnded = new Date();

  var log = _.extend(this.trace, trace);
  var logId = this.insert(Logs, log);

  this.trace.logId = logId;

  return logId;
};

Operation.prototype.insert = function (collection, doc) {
  doc.dateCreated = new Date();

  return collection.insert(doc);
};

Operation.prototype.update = function (collection, selector, modifier) {
  modifier.$set = modifier.$set || {};
  modifier.$set.dateModified = new Date();

  return collection.update(selector, modifier);
};