Package.describe({
  summary: "Mandrill (official): Send templated email and more via Mandrill",
  name: 'wylio:mandrill',
  version: '1.1.0',
  git: "https://github.com/Wylio/meteor-mandrill",
  documentation: 'README.md'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.0');
  api.use(['email', 'http'], ['server']);
  api.addFiles('mandrill.js', 'server');
  api.export('Mandrill');
});

Package.onTest(function (api) {
  api.use('tinytest');
  api.use('wylio:mandrill');
  api.addFiles('tests.js', 'server');
});
