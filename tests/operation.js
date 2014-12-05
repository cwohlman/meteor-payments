Operation = Payments.Operation;

Tinytest.add('Payments - Operation - transparently calls and returns', function (test) {
  var fn = Operation.create(function (name) {
    return name + "suffix";
  });

  test.equal('suffix', fn(''));
});

Tinytest.add('Payments - Operation - accepts unlimited arguments', function (test) {
  var fn = Operation.create(function () {
    return _.toArray(arguments).length;
  });

  test.equal(1, fn(''));
  test.equal(2, fn('', ''));
  test.equal(10, fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9));
});

Tinytest.add('Payments - Operation - wraps thrown errors', function (test) {
  var fn = Operation.create(function () {
    if (_.toArray(arguments).length > 5) throw new Error('Bug');
    else return true;
  });

  test.throws(function () {
    fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  }, Meteor.Error);
});

Tinytest.add('Payments - Operation - wraps thrown meteor errors', function (test) {
  var fn = Operation.create(function () {
    if (_.toArray(arguments).length > 5) throw new Meteor.Error('Bug');
    else return true;
  });

  test.throws(function () {
    fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  }, 'Internal Server Error');
});

Tinytest.add('Payments - Operation - wrapped error contains logId', function (test) {
  var fn = Operation.create(function () {
    if (_.toArray(arguments).length > 5) throw new Meteor.Error('Bug');
    else return true;
  });

  try {
    fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  } catch (e) {
    test.isTrue(_.isObject(e.details));
    test.isTrue(_.isString(e.details.logId));
  }
});

Tinytest.add(
  'Payments - Operation - wrapped error contains internalError'
  , function (test) {
    var fn = Operation.create(function () {
      if (_.toArray(arguments).length > 5) throw new Meteor.Error('Bug');
      else return true;
    });

    try {
      fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
    } catch (e) {
      test.isTrue(_.isObject(e.details));
      test.isTrue(_.isObject(e.details.internalError));
      test.equal(e.details.internalError.error, 'Bug');
    }
});

Tinytest.add(
  'Payments - Operation - wrapped error contains only Meteor.Error internalError'
  , function (test) {
    var fn = Operation.create(function () {
      if (_.toArray(arguments).length > 5) throw new Error('Bug');
      else return true;
    });

    try {
      fn(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
    } catch (e) {
      test.isTrue(_.isObject(e.details));
      test.isFalse(_.isObject(e.details.internalError));
    }
});
