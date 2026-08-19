import { Request, Response } from "express";
import { prisma } from "../db/db";
import { asyncHandler, AppError } from "../utils/asyncHandler";

// ----------------- Add New Address -----------------
export const addAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { addressLine1, addressLine2, city, state, postalCode, country, latitude, longitude, isDefault } = req.body;
  const userId = Number(req.id);

  if (!addressLine1 || !city || !state || !postalCode || !country) {
    throw new AppError("Required fields missing", 400);
  }

  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = !!isDefault || existingCount === 0;

  if (shouldBeDefault && existingCount > 0) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const newAddress = await prisma.address.create({
    data: {
      userId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isDefault: shouldBeDefault,
    },
  });

  res.status(201).json({ success: true, message: "Address added successfully", address: newAddress });
});

// ----------------- Update Address -----------------
export const updateAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { addressLine1, addressLine2, city, state, postalCode, country, latitude, longitude, isDefault } = req.body;
  const userId = Number(req.id);

  const address = await prisma.address.findUnique({ where: { id: Number(id) } });
  if (!address || address.userId !== userId) throw new AppError("Address not found", 404);

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updatedAddress = await prisma.address.update({
    where: { id: address.id },
    data: {
      addressLine1: addressLine1 || address.addressLine1,
      addressLine2: addressLine2 || address.addressLine2,
      city: city || address.city,
      state: state || address.state,
      postalCode: postalCode || address.postalCode,
      country: country || address.country,
      latitude: latitude !== undefined ? parseFloat(latitude) : address.latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : address.longitude,
      isDefault: isDefault !== undefined ? !!isDefault : address.isDefault,
    },
  });

  res.status(200).json({ success: true, message: "Address updated successfully", address: updatedAddress });
});

// ----------------- Delete Address -----------------
export const deleteAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = Number(req.id);

  const address = await prisma.address.findUnique({ where: { id: Number(id) } });
  if (!address || address.userId !== userId) throw new AppError("Address not found", 404);

  await prisma.address.delete({ where: { id: address.id } });

  res.status(200).json({ success: true, message: "Address deleted successfully" });
});

// ----------------- List All Addresses -----------------
export const listAddresses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = Number(req.id);

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" }, // default address first
  });

  res.status(200).json({ success: true, addresses });
});

// ----------------- Set Default Address -----------------
export const setDefaultAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = Number(req.id);

  const address = await prisma.address.findUnique({ where: { id: Number(id) } });
  if (!address || address.userId !== userId) throw new AppError("Address not found", 404);

  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  const updatedAddress = await prisma.address.update({
    where: { id: address.id },
    data: { isDefault: true },
  });

  res.status(200).json({ success: true, message: "Default address set successfully", address: updatedAddress });
});
