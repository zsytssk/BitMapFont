const {app, BrowserWindow} = require("electron");

var mainWindow = null;

app.on("window-all-closed", () => {
    console.log(process.platform);
    if(process.platform !== "darwin"){
        app.quit();
    }
});

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width : 350,
        // width : 1000,
        height : 630,
        resizable : false,
        maximizable : false,
        fullscreenable : false
    });

    // mainWindow.openDevTools();
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL("file://" + __dirname + "/app/index.html");

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
});