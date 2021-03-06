const HomeComponent = require('./lib/component');
const HomeStore = require('./lib/store');

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Home.Home', HomeComponent);
  appRegistry.registerStore('Home.HomeStore', HomeStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Home.Home');
  appRegistry.deregisterStore('Home.HomeStore');
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
