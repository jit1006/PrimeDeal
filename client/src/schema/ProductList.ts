import { z } from "zod";

export const ProductListSchema = z.object({
    name: z.string().min(2, "Product Name must be at least 2 characters").max(30, "Product Name must be less than 30 characters").regex(/^[A-Za-z\s]+$/, " / Product name must contain only letters and spaces"),
    description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description must be less than 200 characters"),
    price: z.number().min(10, "Price must be at least 10").max(1000, "Price must be less than 1000"),
    netQty: z.string()
    .regex(/^[1-9]\d*(unit|kg|gms|ltr|ml)$/, "Net Quantity must be greater than zero and in format '1kg' or '500gms'"),
    image: z
        .instanceof(File)
        .optional()
        .refine((file) => file && file.size !== 0, "Please upload a product image"),
    id: z.string().optional()
});

export type ProductListFormSchema = z.infer<typeof ProductListSchema>;
