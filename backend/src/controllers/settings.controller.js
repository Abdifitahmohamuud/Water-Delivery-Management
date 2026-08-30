import prisma from "../lib/prisma.js";

// GET /api/settings (Public / Authenticated - fetch system settings)
export const getSystemSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: "HydroFlow Water Delivery",
          companyPhone: "+252 61 5000000",
          companyEmail: "info@hydroflowwater.com",
          companyAddress: "Mogadishu, Somalia",
          currency: "USD",
          defaultDeliveryFee: 1.5,
          otpExpiration: 600,
          maxOtpAttempts: 3,
          businessHoursEnabled: false,
          allowCustomerCancellation: true,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("getSystemSettings error:", error);
    res.status(500).json({ message: "Failed to fetch settings: " + error.message });
  }
};

// PUT /api/settings (Admin only - update system settings)
export const updateSystemSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    const {
      companyName,
      companyPhone,
      companyEmail,
      companyAddress,
      currency,
      defaultDeliveryFee,
      otpExpiration,
      maxOtpAttempts,
      businessHoursEnabled,
      businessHoursStart,
      businessHoursEnd,
      allowCustomerCancellation,
    } = req.body;

    const updateData = {
      ...(companyName !== undefined && { companyName }),
      ...(companyPhone !== undefined && { companyPhone }),
      ...(companyEmail !== undefined && { companyEmail }),
      ...(companyAddress !== undefined && { companyAddress }),
      ...(currency !== undefined && { currency }),
      ...(defaultDeliveryFee !== undefined && { defaultDeliveryFee: parseFloat(defaultDeliveryFee) }),
      ...(otpExpiration !== undefined && { otpExpiration: parseInt(otpExpiration, 10) }),
      ...(maxOtpAttempts !== undefined && { maxOtpAttempts: parseInt(maxOtpAttempts, 10) }),
      ...(businessHoursEnabled !== undefined && { businessHoursEnabled: Boolean(businessHoursEnabled) }),
      ...(businessHoursStart !== undefined && { businessHoursStart }),
      ...(businessHoursEnd !== undefined && { businessHoursEnd }),
      ...(allowCustomerCancellation !== undefined && { allowCustomerCancellation: Boolean(allowCustomerCancellation) }),
    };

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: updateData,
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actor: req.user.id,
        action: "PRODUCT_UPDATED", // administrative update
        targetType: "SystemSettings",
        targetId: settings.id,
        newValue: settings,
      },
    });

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("updateSystemSettings error:", error);
    res.status(500).json({ message: "Failed to update settings: " + error.message });
  }
};
