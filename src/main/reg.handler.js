//@ts-check

const { ipcMain } = require("electron");
const { log } = require("../utils/logger");

function registerIpcHandlers(){
  require("./ipc/activation.ipc.");
  require("./ipc/system_config.ipc");
}




module.exports = {registerIpcHandlers};