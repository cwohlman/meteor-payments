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
  api.use('check');

  // Public api
  api.addFiles('payments.js');
  api.export('Payments');

  // Collections
  api.addFiles('collections/logs.js');

  // Helpers
  api.addFiles('helpers/associateCredits.js');
  api.addFiles('helpers/associateDebits.js');
  api.addFiles('helpers/associateOrders.js');

  // Operations
  api.addFiles('operations/operation.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('underscore');
  api.use('mongo');

  api.use('cwohlman:payments');

  // The mock payment provider
  api.addFiles('tests/mock-provider.js');
  api.addFiles('tests/mock-app.js');

  // These files actually run our tests
  api.addFiles('tests/operation.js');
  api.addFiles('tests/logs.js');
});
