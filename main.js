const { app, dialog, session, Menu, Tray } = require('electron');
const { autoUpdater } = require("electron-updater")
const { menubar } = require('menubar');
const path = require('path');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info"

autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
        title: 'No Updates',
        message: 'Current version is up-to-date.'
    })
})

autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No']
    }, (buttonIndex) => {
        if (buttonIndex === 0) {
            autoUpdater.downloadUpdate()
        }
    })
})

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will quit for update.'
    }, () => {
        setImmediate(() => autoUpdater.quitAndInstall())
    })
})

var AutoLaunch = require('auto-launch');
var gtasksAutoLauncher = new AutoLaunch({
	name: 'GTasks',
	path: '/Applications/GTasks.app',
});

gtasksAutoLauncher.enable();

gtasksAutoLauncher.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            log.info("Auto launch is enabled.")
            return;
        }
        gtasksAutoLauncher.enable();
    })
    .catch(function(error){
        log.error("Error enabling auto-launch.", error)
    });


app.on('ready', () => {
    'use strict';

    const iconPath = path.join(__dirname, 'assets', 'tasksTemplate.png');
    const tray = new Tray(iconPath);

	const contextMenu = Menu.buildFromTemplate([
        { role: 'about' },
        {
            label: 'Check for Updates',
            click: () => {
                autoUpdater.checkForUpdatesAndNotify();
            }
        },
        { type: 'separator' },
        { role: 'quit' }
    ]);

    const mb = menubar({
        tray,
        index: "https://tasks.google.com/embed/?origin=https://calendar.google.com&fullWidth=1",
        preloadWindow: true,
        browserWindow: {
            width: 320,
            height: 480
        },
        showDockIcon: false
    });

    mb.on('after-hide', () => {
        session.defaultSession.cookies.flushStore();

        session.defaultSession.cookies.get({})
            .then((cookies) => {
                log.info("Wrote cookies to disk (mb.after-hide)")
            });
    });

    mb.on('ready', () => {
        app.dock.hide();

        tray.on('right-click',() => {
            mb.tray.popUpContextMenu(contextMenu);
        })
    });
});

app.on('before-quit', () => {
    session.defaultSession.cookies.flushStore()
    .then(() => {
        log.info("Wrote cookies to disk (app.before-quit)")
    }).catch((error) => {
       log.error("Error writing cookies to disk", error)
    });
})
