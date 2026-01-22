// loyalty/settings/get.ipc.js
//@ts-check

const { LoyaltyProgram } = require("../../../../entities/LoyaltyProgram");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {{ _userId: any; }} params
 */
async function getLoyaltySettings(params) {
  try {
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyProgram);
    
    let settings = await loyaltyRepo.findOne({
      where: { is_active: true },
      order: { created_at: "DESC" }
    });

    if (!settings) {
      // Create default settings if none exist
      settings = loyaltyRepo.create({
        program_name: "Default Loyalty Program",
        program_description: "Customer loyalty rewards program",
        points_per_currency: 10,
        minimum_redemption_points: 100,
        expiration_months: 12,
        signup_bonus_points: 100,
        is_active: true,
        created_by: params._userId || 1,
      });
      
      await loyaltyRepo.save(settings);
    }

    // Parse JSON fields
    if (settings.tier_requirements && typeof settings.tier_requirements === 'string') {
      settings.tier_requirements = JSON.parse(settings.tier_requirements);
    }
    
    if (settings.tier_benefits && typeof settings.tier_benefits === 'string') {
      settings.tier_benefits = JSON.parse(settings.tier_benefits);
    }

    return {
      status: true,
      message: "Loyalty settings retrieved successfully",
      data: settings,
    };
  } catch (error) {
    console.error("getLoyaltySettings error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get loyalty settings: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getLoyaltySettings;