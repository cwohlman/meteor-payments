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
    var operation = new Operation();
    _.extend(operation, extensions);
    operation.self = this;

    var result;

    try {
      result = fn.apply(operation, arguments);
    } catch (e) {
      result = operation.throwError(e);
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
  if (!error) error = new Error('Unknown Error');

  if (!(error instanceof Meteor.Error || error.sanitizedError)) {
    console.log('makeError', error, error.sanitizedError);
    this.makeError(error);
  }
  this.attachTraceId(error);
  throw error;
};

Operation.prototype.attachTraceId = function (error) {
  if (error.sanitizedError) {
    error = error.sanitizedError;
  }
  if (!error.details) {
    error.details = {};
  }
  if (!error.details.logId) {
    error.details.logId = this.trace.logId;
  }
};

Operation.prototype.makeError = function (error) {
  var self = this.self;
  error.sanitizedError = new Meteor.Error(500, 'Internal Server Error', {
    logId: this.trace.logId
  });
  return error;
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
  doc.providerInstance = this.self._id;
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