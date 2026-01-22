// loyalty/settings/update.ipc.js
//@ts-check

const { LoyaltyProgram } = require("../../../../entities/LoyaltyProgram");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ settings: any; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateLoyaltySettings(params, queryRunner) {
  const { settings, _userId } = params;
  
  try {
    const loyaltyRepo = queryRunner.manager.getRepository(LoyaltyProgram);
    
    // Get current active program
    let program = await loyaltyRepo.findOne({
      where: { is_active: true },
    });

    if (!program) {
      // Create new program if none exists
      program = loyaltyRepo.create({
        ...settings,
        is_active: true,
        created_by: _userId,
      });
    } else {
      // Update existing program
      Object.assign(program, settings, {
        updated_by: _userId,
        updated_at: new Date(),
      });
    }

    await loyaltyRepo.save(program);

    // Log activity
    await log_audit("update", "LoyaltyProgram", program.id, _userId, {
      program_name: program.program_name,
      points_per_currency: program.points_per_currency,
      minimum_redemption_points: program.minimum_redemption_points,
    });

    return {
      status: true,
      message: "Loyalty settings updated successfully",
      data: program,
    };
  } catch (error) {
    console.error("updateLoyaltySettings error:", error);
    
    await log_audit("error", "LoyaltyProgram", 0, _userId, {
      settings: JSON.stringify(settings),
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update loyalty settings: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateLoyaltySettings;