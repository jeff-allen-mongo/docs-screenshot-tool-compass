const { launchCompass, quitCompass} = require('./support/spectron-support');
const {BrowserWindow} = require('electron')
var electron = require('electron');
var fs = require('fs');

describe('#compass-screenshot', function() {
  this.slow(30000);
  this.timeout(60000);
  let app = null;
  let client = null;

  before(function() {
    return launchCompass().then(function(application) {
      app = application;
      client = application.client;
    });
  });

  after(screenshotAndQuit("screenshot-compass-home.png"));

  function screenshotAndQuit(filename) {
    return function(done) {
      app.app.browserWindow.capturePage().then(function(imageBuffer) {
        fs.writeFile('page.png', imageBuffer, function(err) {
          if (err) return done(err);
          console.log("Took screenshot!", filename);
          quitCompass(app, done);
        });
      });
    };
  }

  context('when launching the application', function() {
    it('displays the feature tour modal', function() {
      return client
        .waitForFeatureTourModal()
        .getText('h2[data-hook=title]')
        .should.eventually.equal('Welcome to MongoDB Compass');
    });

    context('when closing the feature tour modal', function() {
      it('displays the privacy settings', function() {
        return client
          .clickCloseFeatureTourButton()
          .waitForPrivacySettingsModal()
          .clickEnableProductFeedbackCheckbox()
          .clickEnableCrashReportsCheckbox()
          .clickEnableUsageStatsCheckbox()
          .clickEnableAutoUpdatesCheckbox()
          .getModalTitle()
          .should.eventually.equal('Privacy Settings');
      });

      context('when closing the privacy settings modal', function() {
        it('renders the connect screen', function() {
          return client
            .clickClosePrivacySettingsButton()
            .waitForConnectView()
            .getConnectHeaderText()
            .should.eventually.be.equal('Connect to Host');
        });

        it('allows favorites to be saved');
        it('allows favorites to be edited');
      });
    });
  });
});
