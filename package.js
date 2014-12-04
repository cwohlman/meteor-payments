Package.describe({
  name: 'cwohlman:payments',
  summary: 'Bulletproof payment processing logic.',
  version: '0.1.0',
  git: 'https://github.com/cwohlman/meteor-payments.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('payments.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('cwohlman:payments');
  api.addFiles('payments-tests.js');
});
