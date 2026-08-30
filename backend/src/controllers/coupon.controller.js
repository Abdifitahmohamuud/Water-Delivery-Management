import prisma from "../lib/prisma.js";

const normalizeCode = (code) => (code || "").trim().toUpperCase();

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  const {
    code,
    discountType,
    value,
    minOrderAmount,
    validFrom,
    validTo,
    usageLimit,
    bulkPurchaseThreshold,
    isActive,
  } = req.body;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: normalizeCode(code),
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(value) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        usageLimit: usageLimit ? Number.parseInt(usageLimit, 10) : null,
        bulkPurchaseThreshold: bulkPurchaseThreshold ? Number.parseInt(bulkPurchaseThreshold, 10) : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
        createdById: req.user?.id,
      },
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        code: req.body.code ? normalizeCode(req.body.code) : undefined,
        value: req.body.value !== undefined ? Number(req.body.value) : undefined,
        minOrderAmount: req.body.minOrderAmount !== undefined ? Number(req.body.minOrderAmount) : undefined,
        usageLimit: req.body.usageLimit !== undefined ? Number.parseInt(req.body.usageLimit, 10) : undefined,
        bulkPurchaseThreshold: req.body.bulkPurchaseThreshold !== undefined ? Number.parseInt(req.body.bulkPurchaseThreshold, 10) : undefined,
      },
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  const code = normalizeCode(req.query.code || req.body.code);
  const amount = Number(req.query.amount || req.body.amount || 0);

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ valid: false, message: "Coupon not found" });
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return res.status(400).json({ valid: false, message: "Coupon is not active yet" });
    }
    if (coupon.validTo && coupon.validTo < now) {
      return res.status(400).json({ valid: false, message: "Coupon has expired" });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: "Coupon usage limit reached" });
    }
    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      return res.status(400).json({ valid: false, message: `Minimum order amount is ${coupon.minOrderAmount}` });
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
