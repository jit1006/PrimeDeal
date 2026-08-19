import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { prisma } from "../db/db";
import { AppError, asyncHandler } from "../utils/asyncHandler";
import { Unit } from "@prisma/client";

// ---------- HELPER TO NORMALIZE UNIT ----------
const normalizeUnit = (u: any): Unit => {
  const str = String(u || "").toLowerCase().trim();
  if (str === "gms" || str === "g" || str === "gram" || str === "grams") return Unit.g;
  if (str === "kg" || str === "kilogram" || str === "kilograms") return Unit.kg;
  if (str === "mg" || str === "milligram") return Unit.mg;
  if (str === "ml" || str === "millilitre") return Unit.ml;
  if (str === "l" || str === "ltr" || str === "liter" || str === "litre") return Unit.l;
  if (str === "pcs" || str === "unit" || str === "piece" || str === "pieces") return Unit.pcs;
  if (Object.values(Unit).includes(str as Unit)) return str as Unit;
  return Unit.pcs;
};

// ----------------- Add Product -----------------
export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, categoryId, shopId, netQtyValue, unit } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: "No product image uploaded" });
      return;
    }

    if (!name || !netQtyValue) {
      res.status(400).json({
        success: false,
        message: "Product name and net quantity value are required",
      });
      return;
    }

    const safeUnit = normalizeUnit(unit);

    // ✅ Target Shop resolution
    const targetShopId = Number(shopId || req.query.shopId);
    if (!targetShopId || isNaN(targetShopId)) {
      res.status(400).json({ success: false, message: "Valid Shop ID is required" });
      return;
    }

    const shop = await prisma.shop.findUnique({ where: { id: targetShopId } });
    if (!shop) {
      res.status(404).json({ success: false, message: "Shop not found" });
      return;
    }

    // ✅ Ensure a valid categoryId
    let catId = Number(categoryId);
    if (!catId || isNaN(catId) || catId <= 0) {
      let defaultCat = await prisma.category.findFirst({ where: { name: "General" } });
      if (!defaultCat) {
        defaultCat = await prisma.category.create({
          data: { name: "General", description: "General daily essentials" },
        });
      }
      catId = defaultCat.id;
    } else {
      const existingCat = await prisma.category.findUnique({ where: { id: catId } });
      if (!existingCat) {
        let defaultCat = await prisma.category.findFirst({ where: { name: "General" } });
        if (!defaultCat) {
          defaultCat = await prisma.category.create({
            data: { name: "General", description: "General daily essentials" },
          });
        }
        catId = defaultCat.id;
      }
    }

    const trimmedName = name.trim();
    const trimmedDescription = description?.trim() || "";

    // ✅ Image upload with fallback
    let imageURL = "https://placehold.co/400x400?text=Product";
    try {
      imageURL = await uploadImageOnCloudinary(file as Express.Multer.File);
    } catch (cloudErr) {
      console.warn("⚠️ Cloudinary upload warning (using data URI fallback):", cloudErr);
      const base64Image = Buffer.from((file as Express.Multer.File).buffer).toString("base64");
      imageURL = `data:${(file as Express.Multer.File).mimetype};base64,${base64Image}`;
    }

    // ✅ Find or create global product
    let product = await prisma.product.findFirst({
      where: { name: trimmedName },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: trimmedName,
          description: trimmedDescription,
          image: imageURL,
          categoryId: catId,
          netQty: `${netQtyValue}${safeUnit}`,
        },
      });
    }

    // ✅ Check inventory duplicate
    const existingInventory = await prisma.shopInventory.findUnique({
      where: { shopId_productId: { shopId: shop.id, productId: product.id } },
    });

    if (existingInventory) {
      res.status(400).json({
        success: false,
        message: "Product already exists in this shop's inventory",
      });
      return;
    }

    // ✅ Add to shop inventory
    const inventory = await prisma.shopInventory.create({
      data: {
        shopId: shop.id,
        productId: product.id,
        price: parseFloat(price) || 0,
        quantity: 100, // default available stock
        netQty: parseFloat(netQtyValue) || 1,
        unit: safeUnit,
        isAvailable: true,
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
      inventory,
    });
  } catch (error: any) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal Server Error" });
  }
};

// ----------------- Edit Product -----------------
export const editProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, netQtyValue, unit } = req.body;
    const file = req.file;

    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const userId = Number(req.id);
    const userShops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
    const userShopIds = userShops.map((s) => s.id);

    const inventory = await prisma.shopInventory.findFirst({
      where: { productId: product.id, shopId: { in: userShopIds } },
    });

    if (!inventory) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to edit this product",
      });
      return;
    }

    let imageURL = product.image;
    if (file) {
      try {
        imageURL = await uploadImageOnCloudinary(file as Express.Multer.File);
      } catch (cloudErr) {
        const base64Image = Buffer.from((file as Express.Multer.File).buffer).toString("base64");
        imageURL = `data:${(file as Express.Multer.File).mimetype};base64,${base64Image}`;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: name ? name.trim() : product.name,
        description: description ? description.trim() : product.description,
        categoryId: categoryId ? Number(categoryId) : product.categoryId,
        image: imageURL,
      },
    });

    const updatedInventory = await prisma.shopInventory.update({
      where: { id: inventory.id },
      data: {
        price: price ? parseFloat(price) : inventory.price,
        netQty: netQtyValue ? parseFloat(netQtyValue) : inventory.netQty,
        unit: unit ? normalizeUnit(unit) : inventory.unit,
      },
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
      inventory: updatedInventory,
    });
  } catch (error: any) {
    console.error("❌ Error editing product:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal Server Error" });
  }
};

// ----------------- Toggle Product Availability -----------------
export const toggleProductAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(req.id);
    const userShops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
    const userShopIds = userShops.map((s) => s.id);

    const inventory = await prisma.shopInventory.findFirst({
      where: { productId: Number(id), shopId: { in: userShopIds } },
    });

    if (!inventory) {
      res.status(404).json({ success: false, message: "Product not found in your shop inventory" });
      return;
    }

    const updated = await prisma.shopInventory.update({
      where: { id: inventory.id },
      data: { isAvailable: !inventory.isAvailable },
    });

    res.status(200).json({
      success: true,
      message: updated.isAvailable ? "Product set as available" : "Product set as unavailable",
      inventory: updated,
    });
  } catch (error: any) {
    console.error("❌ Error toggling availability:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal Server Error" });
  }
};

// ----------------- Get All Products in a Shop -----------------
export const getAllProductsInShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = Number(req.params.shopId);
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });

    if (!shop) {
      res.status(404).json({ success: false, message: "Shop not found" });
      return;
    }

    const inventories = await prisma.shopInventory.findMany({
      where: { shopId },
      include: {
        product: { include: { category: true } },
      },
    });

    const products = inventories.map((item) => ({
      id: item.product.id,
      inventoryId: item.id,
      name: item.product.name,
      description: item.product.description,
      category: item.product.category?.name,
      image: item.product.image,
      price: item.price,
      quantity: item.quantity,
      netQty: item.netQty,
      unit: item.unit,
      isAvailable: item.isAvailable,
    }));

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("❌ Error fetching shop products:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal Server Error" });
  }
};

// ----------------- Get All Products (Global Catalog) -----------------
export const getAllProducts = asyncHandler(async (req, res) => {
  const { search, categoryId } = req.query;

  const filters: any = {};

  if (search) {
    filters.OR = [
      { name: { contains: String(search) } },
      { brand: { contains: String(search) } },
      { description: { contains: String(search) } },
    ];
  }

  if (categoryId) {
    filters.categoryId = Number(categoryId);
  }

  const products = await prisma.product.findMany({
    where: filters,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// 🔍 Search products with best price + nearby + available filters
export const searchProduct = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.q as string)?.trim() || "";
  const userId = Number(req.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);
  const address = user.addresses[0];
  if (!address) throw new AppError("Default address not found", 400);

  const MAX_DISTANCE_KM = 10;
  const EARTH_RADIUS_KM = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const userLat = address.latitude || 0;
  const userLon = address.longitude || 0;

  const allShops = await prisma.shop.findMany({
    select: { id: true, storeName: true, latitude: true, longitude: true },
  });

  const nearbyShops = allShops
    .map((shop) => {
      const dLat = toRad(shop.latitude - userLat);
      const dLon = toRad(shop.longitude - userLon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userLat)) *
          Math.cos(toRad(shop.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...shop, distance: EARTH_RADIUS_KM * c };
    })
    .filter((s) => s.distance <= MAX_DISTANCE_KM)
    .sort((a, b) => a.distance - b.distance);

  const nearbyShopIds = nearbyShops.map((shop) => shop.id);
  if (nearbyShopIds.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No nearby shops found within range",
      products: [],
    });
  }

  const inventories = await prisma.shopInventory.findMany({
    where: {
      isAvailable: true,
      shopId: { in: nearbyShopIds },
      product: {
        OR: [
          { name: { contains: query } },
          { brand: { contains: query } },
          { description: { contains: query } },
        ],
      },
    },
    include: {
      shop: true,
      product: {
        include: { category: true },
      },
    },
  });

  if (inventories.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No available products nearby",
      products: [],
    });
  }

  const bestProductsMap = new Map<number, any>();
  for (const inv of inventories) {
    const existing = bestProductsMap.get(inv.productId);
    if (!existing || inv.price < existing.price) {
      bestProductsMap.set(inv.productId, inv);
    }
  }

  const bestProducts = Array.from(bestProductsMap.values());

  return res.status(200).json({
    success: true,
    message: "Best nearby available products fetched successfully",
    count: bestProducts.length,
    products: bestProducts.map((inv) => ({
      id: inv.product.id,
      name: inv.product.name,
      description: inv.product.description,
      image: inv.product.image,
      category: inv.product.category?.name,
      netQty: inv.product.netQty,
      unit: inv.unit,
      price: inv.price,
      shopName: inv.shop.storeName,
      shopId: inv.shop.id,
      distance: nearbyShops.find((s) => s.id === inv.shop.id)?.distance || null,
    })),
  });
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: { products: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

export const addProductToShop = asyncHandler(async (req: Request, res: Response) => {
  const { productId, shopId, price, quantity, netQtyValue, unit } = req.body;

  if (!productId || !shopId || !price || !netQtyValue || !unit) {
    return res.status(400).json({
      success: false,
      message: "Product ID, Shop ID, Price, Net Quantity, and Unit are required",
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
  });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: Number(shopId) },
  });
  if (!shop) {
    return res.status(404).json({
      success: false,
      message: "Shop not found",
    });
  }

  const safeUnit = normalizeUnit(unit);

  const existing = await prisma.shopInventory.findUnique({
    where: {
      shopId_productId: {
        shopId: Number(shopId),
        productId: Number(productId),
      },
    },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Product already exists in this shop's inventory",
    });
  }

  const inventory = await prisma.shopInventory.create({
    data: {
      shopId: Number(shopId),
      productId: Number(productId),
      price: parseFloat(price),
      quantity: quantity ? Number(quantity) : 0,
      netQty: parseFloat(netQtyValue),
      unit: safeUnit,
      isAvailable: true,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          description: true,
          category: { select: { id: true, name: true } },
        },
      },
      shop: { select: { id: true, storeName: true, city: true } },
    },
  });

  return res.status(201).json({
    success: true,
    message: "Product successfully added to shop inventory",
    inventory,
  });
});
