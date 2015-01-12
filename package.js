Package.describe({
  name: 'cwohlman:payments',
  summary: 'Bulletproof payment processing logic.',
  version: "0.4.4",
  git: 'https://github.com/cwohlman/meteor-payments.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use('underscore');
  api.use('mongo');
  api.use('check');
  api.use('accounts-base');

  // Public api
  api.addFiles('payments.js');
  api.export('Payments');

  // Collections
  api.addFiles('collections/logs.js');
  api.addFiles('collections/customers.js');
  api.addFiles('collections/paymentMethods.js');
  api.addFiles('collections/transactions.js');

  // Helpers
  // api.addFiles('helpers/associateCredits.js');
  // api.addFiles('helpers/associateDebits.js');
  // api.addFiles('helpers/associateOrders.js');
  // api.addFiles('helpers/associateGuard.js');

  // Guards
  api.addFiles('guards/errors.js');
  api.addFiles('guards/preventOverCharge.js');
  api.addFiles('guards/preventWrongCard.js');
  api.addFiles('guards/preventNonIntegerAmounts.js');
  api.addFiles('guards/preventNonExistantUser.js');

  // Operations
  api.addFiles('operations/operation.js');
  api.addFiles('operations/createPaymentMethod.js');
  api.addFiles('operations/createTransaction.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('underscore');
  api.use('mongo');
  api.use('autopublish');

  api.use('cwohlman:payments');

  // The mock payment provider
  api.addFiles('tests/mock-provider.js');
  api.addFiles('tests/mock-app.js');

  // These files actually run our tests
  api.addFiles('tests/operation.js');
  api.addFiles('tests/logs.js');
  api.addFiles('tests/transactions.js');
  api.addFiles('tests/guards.js');
  api.addFiles('tests/builtin-guards.js');
});
