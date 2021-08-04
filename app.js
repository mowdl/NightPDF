const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path')
const { menuTemplate } = require("./app/menutemplate");
let wins = [];
let menuIsConfigured = false;

function createWindow(filename = null) {
	// Create the browser window.
	let win = new BrowserWindow({
		width: 550,
		height: 420,
		minWidth: 565,
		minHeight: 200,
		webPreferences: {
			preload: path.resolve(path.join(__dirname, 'app/preload.js'))
		},
		resizable: true,
		titleBarStyle: 'default',
		show: false
	});
	wins.push(win);

	// and load the index.html of the app.

	win.loadFile('app/index.html');
	if (process.env.DEBUG) {
		win.openDevTools();
	}
	let wc = win.webContents
	wc.on('will-navigate', function (e, url) {
		if (url != wc.getURL()) {
			e.preventDefault()
			shell.openExternal(url)
		}
	})

	win.once('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		wins = [];
	});

	win.webContents.removeAllListeners('did-finish-load');
	win.webContents.once('did-finish-load', () => {
		if (filename) {
			win.webContents.send('file-open', filename);
			win.show();
		} else {
			win.show();
		}
	});


	if (!menuIsConfigured) {
		const menu = Menu.buildFromTemplate(menuTemplate);

		menu.getMenuItemById('file-open').click = () => {
			openNewPDF();
		};

		menu.getMenuItemById('file-print').click = () => {
			const focusedWin = BrowserWindow.getFocusedWindow();
			focusedWin.webContents.send('file-print');
		};

		Menu.setApplicationMenu(menu);
		menuIsConfigured = true;
	}

	const openNewPDF = () => {
		dialog
			.showOpenDialog(null, {
				properties: ['openFile'],
				filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
			})
			.then((dialogReturn) => {
				const filename = dialogReturn['filePaths'][0];
				if (filename) {
					if (wins.length === 0) {
						createWindow(filename.toString());
					} else {
						const focusedWin = BrowserWindow.getFocusedWindow();
						if (focusedWin) {
							focusedWin.webContents.send('file-open', filename.toString());
						}
					}
				}
			});
	}

	ipcMain.removeAllListeners('togglePrinting');
	ipcMain.once('togglePrinting', (e, msg) => {
		const menu = Menu.getApplicationMenu();
		menu.getMenuItemById('file-print').enabled = Boolean(msg);
	});

	ipcMain.removeAllListeners('newWindow');
	ipcMain.once('newWindow', (e, msg) => {
		console.log('opening ', msg, ' in new window');
		createWindow(msg);
	});

	ipcMain.removeAllListeners('resizeWindow');
	ipcMain.once('resizeWindow', (e, msg) => {
		const { width, height } = win.getBounds();
		if (width < 1000 || height < 650) {
			win.setResizable(true);
			win.setSize(1000, 650);
			win.center();
		}
	});

	ipcMain.removeAllListeners('openNewPDF');
	ipcMain.once('openNewPDF', (e, msg) => {
		openNewPDF();
	});
}

let fileToOpen = '';

const args = process.argv;
const argsLength = args.length;
if (argsLength > 1 && args[argsLength - 1].endsWith('.pdf')) {
	fileToOpen = args[argsLength - 1];
}

app.on('open-file', (event, path) => {
	event.preventDefault();
	if (app.isReady()) {
		if (wins.length === 0) {
			createWindow(path.toString());
		} else {
			const focusedWin = BrowserWindow.getFocusedWindow();
			focusedWin.webContents.send('file-open', path.toString());
		}
	}
	fileToOpen = path.toString();
});

app.whenReady().then(() => {
	if (fileToOpen) {
		createWindow(fileToOpen);
	} else {
		createWindow();
	}
});


app.on('window-all-closed', () => {
	app.quit()
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
