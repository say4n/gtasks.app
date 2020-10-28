const { app, session, Menu, Tray } = require('electron');
const { menubar } = require('menubar');
const path = require('path');

app.on('ready', () => {
    'use strict';

    app.dock.hide();

    const iconPath = path.join(__dirname, 'assets', 'tasksTemplate.png');
    const tray = new Tray(iconPath);

	const contextMenu = Menu.buildFromTemplate([
        { role: 'about' },
        {
            label: 'Check for Updates',
            click: () => {
                console.log("Checking for updates");
            }
        },
        { type: 'separator' },
        { role: 'quit' }
    ]);

    const mb = menubar({
        tray,
        "index": "https://tasks.google.com/embed/?origin=https://calendar.google.com&fullWidth=1",
        "preloadWindow": true,
        "browserWindow": {
            "width": 320,
            "height": 480
        },
        "tooltip": app.name,
    });

    mb.on('after-hide', () => {
        session.defaultSession.cookies.flushStore();

        session.defaultSession.cookies.get({})
            .then((cookies) => {
                console.log("Wrote cookies to disk (mb.after-hide)")
            });
    });

    mb.on('ready', () => {
        tray.on('right-click',() => {
            mb.tray.popUpContextMenu(contextMenu);
        })
    });
});

app.on('before-quit', () => {
    session.defaultSession.cookies.flushStore()
    .then(() => {
        console.log("Wrote cookies to disk (app.before-quit)")
    }).catch((error) => {
        console.error("Error writing cookies to disk")
    });
})
