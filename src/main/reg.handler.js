//@ts-check

const { ipcMain } = require("electron");
const { log } = require("../utils/logger");

function registerIpcHandlers(){
  require("./ipc/activation.ipc.");
  require("./ipc/system_config.ipc");
  require("./ipc/product/index.ipc");
  require("./ipc/audit_trail/index.ipc");
  require("./ipc/inventory_transactions/index.ipc");
  require("./ipc/sales/index.ipc");
  require("./ipc/sales_item/index.ipc");
  require("./ipc/user/index");
  require("./ipc/sync.ipc");
  require("./ipc/user_activity.ipc");
  require("./ipc/price_history.ipc");
  require("./ipc/dashboard/index");
  require("./ipc/customers/index.ipc");
  require("./ipc/loyalty/index.ipc");
  require("./ipc/brand/index.ipc");
  require("./ipc/category/index.ipc");
  require("./ipc/productVariant/index.ipc");
  require("./ipc/supplier/index.ipc");
}




module.exports = {registerIpcHandlers};