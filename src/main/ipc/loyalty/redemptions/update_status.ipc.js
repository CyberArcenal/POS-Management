// loyalty/redemptions/update_status.ipc.js
//@ts-check

const { RedemptionHistory } = require("../../../../entities/RedemptionHistory");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {{ redemption_id: any; status: any; notes: any; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateRedemptionStatus(params, queryRunner) {
  const { redemption_id, status, notes, _userId } = params;
  
  try {
    const redemptionRepo = queryRunner.manager.getRepository(RedemptionHistory);
    
    // Get redemption record
    const redemption = await redemptionRepo.findOne({
      where: { id: redemption_id },
    });

    if (!redemption) {
      return {
        status: false,
        message: "Redemption record not found",
        data: null,
      };
    }

    // Save old status
    const oldStatus = redemption.status;
    
    // Update status
    redemption.status = status;
    
    // Set dates based on status
    if (status === 'approved' && oldStatus === 'pending') {
      redemption.approval_date = new Date();
      redemption.approved_by = _userId;
    } else if (status === 'completed' && oldStatus !== 'completed') {
      redemption.fulfillment_date = new Date();
      redemption.fulfilled_by = _userId;
    } else if (status === 'cancelled') {
      redemption.fulfillment_date = null;
    }
    
    if (notes) {
      redemption.notes = notes;
    }

    await redemptionRepo.save(redemption);

    // Log activity
    await log_audit("update_status", "RedemptionHistory", redemption.id, _userId, {
      redemption_code: redemption.redemption_code,
      customer_id: redemption.customer_id,
      old_status: oldStatus,
      new_status: status,
      notes: notes || '',
    });

    return {
      status: true,
      message: `Redemption status updated to ${status}`,
      data: redemption,
    };
  } catch (error) {
    console.error("updateRedemptionStatus error:", error);
    
    await log_audit("error", "RedemptionHistory", 0, _userId, {
      redemption_id,
      status,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update redemption status: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateRedemptionStatus;