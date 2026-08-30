import prisma from "../lib/prisma.js";
import { uploadToR2, deleteFromR2 } from "../lib/r2.js";

// POST /api/products/upload-image (Admin only)
export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an image file to upload" });
    }

    const imageUrl = await uploadToR2(req.file, "water-products");
    res.json({ message: "Image uploaded successfully to R2 Cloudflare", imageUrl });
  } catch (error) {
    console.error("uploadProductImage error:", error);
    res.status(500).json({ message: "Failed to upload image: " + error.message });
  }
};

// GET /api/products (Public / Customer list active water products)
export const getProducts = async (req, res) => {
  try {
    const { search = "", activeOnly = "true" } = req.query;

    const whereClause = {};

    if (activeOnly === "true") {
      whereClause.isActive = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.waterProduct.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Failed to fetch products: " + error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await prisma.waterProduct.findUnique({
      where: { id: req.params.id },
      include: {
        priceHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Water product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ message: "Failed to fetch product: " + error.message });
  }
};

// POST /api/products (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, unit, currentPrice, imageUrl, isActive } = req.body;

    if (!name || currentPrice === undefined) {
      return res.status(400).json({ message: "Name and current price are required" });
    }

    const price = parseFloat(currentPrice);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const product = await prisma.waterProduct.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        unit: unit ? unit.trim() : "Jerrycan",
        currentPrice: price,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: req.user.id,
        action: "PRODUCT_CREATED",
        targetType: "WaterProduct",
        targetId: product.id,
        newValue: product,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ message: "Failed to create product: " + error.message });
  }
};

// PUT /api/products/:id (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, currentPrice, imageUrl, isActive } = req.body;

    const existingProduct = await prisma.waterProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Water product not found" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (unit !== undefined) updateData.unit = unit.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    let priceChanged = false;
    let newPriceValue = existingProduct.currentPrice;

    if (currentPrice !== undefined) {
      const price = parseFloat(currentPrice);
      if (!isNaN(price) && price >= 0 && price !== existingProduct.currentPrice) {
        updateData.currentPrice = price;
        priceChanged = true;
        newPriceValue = price;
      }
    }

    const updatedProduct = await prisma.waterProduct.update({
      where: { id },
      data: updateData,
    });

    // Record price history if price changed
    if (priceChanged) {
      await prisma.productPriceHistory.create({
        data: {
          productId: id,
          previousPrice: existingProduct.currentPrice,
          newPrice: newPriceValue,
          changedBy: req.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: req.user.id,
          action: "PRICE_CHANGED",
          targetType: "WaterProduct",
          targetId: id,
          oldValue: { price: existingProduct.currentPrice },
          newValue: { price: newPriceValue },
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          actor: req.user.id,
          action: "PRODUCT_UPDATED",
          targetType: "WaterProduct",
          targetId: id,
          oldValue: existingProduct,
          newValue: updatedProduct,
        },
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Failed to update product: " + error.message });
  }
};

// DELETE / Deactivate product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.waterProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Water product not found" });
    }

    const deactivated = await prisma.waterProduct.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user.id,
        action: "PRODUCT_DEACTIVATED",
        targetType: "WaterProduct",
        targetId: id,
      },
    });

    res.json({ message: "Product deactivated successfully", product: deactivated });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ message: "Failed to deactivate product: " + error.message });
  }
};
