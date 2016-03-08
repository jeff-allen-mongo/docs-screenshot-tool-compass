// based off of https://github.com/atom/atom/blob/master/src/browser/application-menu.coffee
// use js2.coffee to convert it to JS

var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;

var State = require('ampersand-state');
var _ = require('lodash');
var debug = require('debug')('electron:menu');

// submenu related
function separator() {
  return {
    type: 'separator'
  };
}

function quitItem(label) {
  return {
    label: label,
    accelerator: 'CmdOrCtrl+Q',
    click: function() {
      app.quit();
    }
  };
}

function compassOverviewItem() {
  return {
    label: 'Compass &Overview',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-compass-tour');
    }
  };
}

function networkOptInDialogItem() {
  return {
    label: 'Help &Improve Compass',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-network-optin');
    }
  };
}

function darwinCompassSubMenu() {
  return {
    label: 'MongoDB Compass',
    submenu: [
      {
        label: 'About Compass',
        selector: 'orderFrontStandardAboutPanel:'
      },
      separator(),
      {
        label: 'Hide',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      separator(),
      quitItem('Quit')
    ]
  };
}

function connectItem() {
  return {
    label: '&Connect to...',
    accelerator: 'CmdOrCtrl+N',
    click: function() {
      app.emit('show connect dialog');
    }
  };
}

function connectSubMenu(nonDarwin) {
  var subMenu = [connectItem()];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem('E&xit'));
  }

  return {
    label: '&Connect',
    submenu: subMenu
  };
}

function editSubMenu() {
  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        role: 'redo'
      },
      separator(),
      {
        label: 'Cut',
        accelerator: 'Command+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        role: 'selectall'
      }
    ]
  };
}

function nonDarwinAboutItem() {
  return {
    label: '&About Compass',
    click: function() {
      app.emit('show about dialog');
    }
  };
}

function helpWindowItem() {
  return {
    label: '&Show Compass Help',
    accelerator: 'F1',
    click: function() {
      app.emit('show help window');
    }
  };
}

function intercomItem() {
  return {
    label: '&Provide Feedback',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-intercom-panel');
    }
  };
}

function helpSubMenu(showCompassOverview) {
  var subMenu = [];
  subMenu.push(helpWindowItem());

  if (showCompassOverview) {
    subMenu.push(compassOverviewItem());
    subMenu.push(networkOptInDialogItem());
  }

  subMenu.push(separator());
  subMenu.push(intercomItem());

  if (process.platform !== 'darwin') {
    subMenu.push(separator());
    subMenu.push(nonDarwinAboutItem());
  }

  return {
    label: '&Help',
    submenu: subMenu
  };
}

function shareSubMenu() {
  return {
    label: '&Share',
    submenu: [
      {
        label: '&Share Schema as JSON',
        accelerator: 'Alt+CmdOrCtrl+S',
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send('message', 'menu-share-schema-json');
        }
      }
    ]
  };
}

function viewSubMenu() {
  return {
    label: '&View',
    submenu: [
      {
        label: '&Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          BrowserWindow.getFocusedWindow().reload();
        }
      },
      {
        label: '&Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function() {
          BrowserWindow.getFocusedWindow().toggleDevTools();
        }
      }
    ]
  };
}

function windowSubMenu() {
  return {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        role: 'close'
      },
      separator(),
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }
    ]
  };
}

// menus
function darwinMenu(menuState) {
  var menu = [
    darwinCompassSubMenu()
  ];

  menu.push(connectSubMenu(false));
  menu.push(editSubMenu());
  menu.push(viewSubMenu());

  if (menuState.showShare) {
    menu.push(shareSubMenu());
  }

  menu.push(windowSubMenu());
  menu.push(helpSubMenu(menuState.showCompassOverview));

  return menu;
}

function nonDarwinMenu(menuState) {
  var menu = [
    connectSubMenu(true),
    viewSubMenu()
  ];

  if (menuState.showShare) {
    menu.push(shareSubMenu());
  }

  menu.push(helpSubMenu(menuState.showCompassOverview));

  return menu;
}

var MenuState = State.extend({
  props: {
    showCompassOverview: {
      type: 'boolean',
      default: false
    },
    showShare: {
      type: 'boolean',
      default: false
    }
  }
});

// menu singleton
var AppMenu = (function() {
  return {
    addWindow: function(_window) {
      debug('lastFocusedWindow set to WINDOW ' + _window.id);
      this.lastFocusedWindow = _window;

      var focusHandler = (function(_this) {
        return function() {
          debug('WINDOW ' + _window.id + ' focused');
          debug('lastFocusedWindow set to WINDOW ' + _window.id);

          _this.lastFocusedWindow = _window;
          _this.load(this);
        };
      })(this);
      _window.on('focus', focusHandler);

      _window.once('close', (function(_this) {
        return function() {
          debug('WINDOW ' + _window.id + ' closing');

          _this.windowTemplates.delete(_window.id);
          _window.removeListener('focus', focusHandler);
        };
      })(this));

      _window.once('closed', (function() {
        return function() {
          debug('WINDOW closed');
          _window = null;
        };
      })(this));
    },

    getTemplate: function(winID) {
      var menuState = this.windowTemplates.get(winID);

      if (process.platform === 'darwin') {
        return darwinMenu(menuState);
      }

      return nonDarwinMenu(menuState);
    },

    init: function() {
      debug('init()');
      this.windowTemplates = new Map();
    },

    load: function(_window) {
      debug('WINDOW ' + _window.id + ' load()');

      if (_window.id !== this.currentWindowMenuLoaded) {
        if (_.isUndefined(this.windowTemplates.get(_window.id))) {
          this.addWindow(_window);

          debug('create menu state for new WINDOW ' + _window.id);
          this.windowTemplates.set(_window.id, new MenuState());
        }

        this.setTemplate(_window.id);
        debug('WINDOW ' + _window.id + '\'s menu loaded');
      } else {
        debug('WINDOW ' + _window.id + '\'s menu already loaded');
      }
    },

    setTemplate: function(winID) {
      debug('WINDOW ' + winID + ' setTemplate()');
      this.currentWindowMenuLoaded = winID;
      var template = this.getTemplate(winID);
      var menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    },

    hideShare: function() {
      this.updateMenu('showShare', false);
    },

    showCompassOverview: function() {
      this.updateMenu('showCompassOverview', true);
    },

    showShare: function() {
      this.updateMenu('showShare', true);
    },

    updateMenu: function(property, val, _window) {
      debug('updateMenu() set ' + property + ' to ' + val);

      if (_.isUndefined(_window)) {
        _window = this.lastFocusedWindow;
      }

      var menuState = this.windowTemplates.get(_window.id);
      menuState[property] = val;
      this.windowTemplates.set(_window.id, menuState);
      this.setTemplate(_window.id);
    }
  };
}());

module.exports = AppMenu;