import prisma from "../lib/prisma.js";

export const createReview = async (req, res) => {
  const { productId, supplierId, rating, comment, targetType } = req.body;
  try {
    const isSupplierReview = Boolean(supplierId) || targetType === "SUPPLIER";
    
    const review = await prisma.review.create({
      data: {
        productId: isSupplierReview ? null : productId,
        supplierId: isSupplierReview ? supplierId : null,
        targetType: isSupplierReview ? "SUPPLIER" : "PRODUCT",
        userId: req.user.id,
        rating: parseInt(rating, 10),
        comment,
        isApproved: false, // Default is pending approval by Admin
      },
      include: {
        user: { select: { name: true, profilePhotoUrl: true } },
        product: { select: { name: true } },
        supplier: { select: { name: true, businessName: true, supplierBusinessName: true } },
      },
    });

    res.status(201).json({
      message: "Review submitted! It will appear publicly after admin approval.",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId: req.params.productId,
        isApproved: true, // Only show approved reviews publicly
      },
      include: { user: { select: { name: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        supplierId: req.params.supplierId,
        isApproved: true, // Only show approved reviews publicly
      },
      include: { user: { select: { name: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, businessName: true, supplierBusinessName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        isApproved: true,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
      },
    });
    res.json({ message: "Review approved successfully", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
