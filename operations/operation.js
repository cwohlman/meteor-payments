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
      // throw e;
      console.log('error', e.message);
      result = self.throwError(e);
    }
    return result;
  };
};

Operation.prototype.jsonableError = function (error) {
  // Most errors don't easily convert to json (i.e. can't be stored in mongodb)
  if (_.isObject(error)) {
    return {
      error: error.error || error.toString()
      , message: error.message
      , stack: error.stack
      , details: error.details
    };
  } else {
    return error;
  }
};

Operation.prototype.throwError = function (error) {
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
  log.error = this.jsonableError(log.error);
  if (_.isArray(log.errors)) {
    log.errors = _.map(log.errors, this.jsonableError);
  }
  if (_.isArray(log.warnings)) {
    log.warnings = _.map(log.warnings, this.jsonableError);
  }
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

Operation.prototype.processResponse = function (response, idField) {
  var self = this;

  if (response) {
    _.each([
      "status"
      , "request"
      , "response"
      , "amount"
      , "error"
      , "requestId"
      ], function (val) {
        self.trace[val] = response[val];
      });
    self.trace[idField] = response._id;
  }
};