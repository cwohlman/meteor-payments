Package.describe({
  name: 'cwohlman:payments',
  summary: 'Bulletproof payment processing logic.',
  version: '0.1.0',
  git: 'https://github.com/cwohlman/meteor-payments.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use('underscore');
  api.use('mongo');

  // Public api
  api.addFiles('payments.js');
  api.export('Payments');

  // Collections
  api.addFiles('collections/logs.js');

  // Operations
  api.addFiles('operations/operation.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('underscore');
  api.use('cwohlman:payments');

  // These files actually run our tests
  api.addFiles('tests/operation.js');
  api.addFiles('tests/logs.js');
});
