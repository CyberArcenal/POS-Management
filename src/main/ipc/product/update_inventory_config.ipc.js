//@ts-check

import inventoryConfig from "../../../services/inventory_sync/inventoryConfig";

/**
 * Update inventory sync configuration
 * @param {{ userId: any; updates: any; }} params
 */
async function updateInventoryConfig(params) {
  try {
    // @ts-ignore
    const { userId, updates } = params;

    if (!updates || typeof updates !== "object") {
      return {
        status: false,
        message: "Invalid configuration updates provided",
        data: null,
      };
    }

    console.log(
      `Updating inventory config (requested by user: ${userId})`,
      updates,
    );

    const results = {
      updated: 0,
      failed: 0,
      details: [],
    };

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      try {
        // Validate key is allowed
        const allowedKeys = [
          "inventory_sync_enabled",
          "inventory_auto_update_on_sale",
          "inventory_sync_interval",
          "inventory_last_sync",
        ];

        if (!allowedKeys.includes(key)) {
          results.failed++;
          // @ts-ignore
          results.details.push({
            key,
            success: false,
            error: "Setting key not allowed",
          });
          continue;
        }

        // Validate value based on key
        let validatedValue = value;

        if (
          key === "inventory_sync_enabled" ||
          key === "inventory_auto_update_on_sale"
        ) {
          validatedValue =
            value === true || value === "true" ? "true" : "false";
        } else if (key === "inventory_sync_interval") {
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 60000) {
            // Minimum 1 minute
            throw new Error(
              "Sync interval must be at least 60000ms (1 minute)",
            );
          }
          validatedValue = numValue.toString();
        }

        // Update setting
        await inventoryConfig.updateSetting(key, validatedValue);

        results.updated++;
        // @ts-ignore
        results.details.push({
          key,
          success: true,
          oldValue: value,
          newValue: validatedValue,
        });
      } catch (error) {
        results.failed++;
        // @ts-ignore
        results.details.push({
          key,
          success: false,
          // @ts-ignore
          error: error.message,
        });
        console.error(`Failed to update setting ${key}:`, error);
      }
    }

    // Get updated configuration
    const updatedConfig = await inventoryConfig.getSyncConfig();

    return {
      status: true,
      message: `Configuration updated: ${results.updated} successful, ${results.failed} failed`,
      data: {
        results,
        config: updatedConfig,
      },
    };
  } catch (error) {
    console.error("updateInventoryConfig error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update configuration: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateInventoryConfig;
