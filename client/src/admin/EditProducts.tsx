import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductListFormSchema, ProductListSchema } from "@/schema/ProductList";
import { useProductStore } from "@/zustand/useProductStore";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dispatch, SetStateAction } from "react";

const EditProducts = ({
  selectedProduct,
  editOpen,
  setEditOpen,
  shopId,
}: {
  selectedProduct: (ProductListFormSchema & { id?: string | number }) | null;
  editOpen: boolean;
  setEditOpen: Dispatch<SetStateAction<boolean>>;
  shopId?: number;
}) => {
  const [input, setInput] = useState<ProductListFormSchema>({
    name: "",
    description: "",
    price: 0,
    netQty: "",
    image: undefined,
  });
  const [unit, setUnit] = useState("kg");
  const [error, setError] = useState<Partial<Record<keyof ProductListFormSchema, string>>>({});
  const { loading, editProduct, fetchProductsByShop } = useProductStore();

  useEffect(() => {
    if (selectedProduct) {
      const netQtyStr = String(selectedProduct.netQty || "");
      const numericNetQty = netQtyStr.replace(/[^0-9.]/g, "");
      
      const units = ["kg", "gms", "ltr", "ml", "unit"];
      const detectedUnit = units.find((u) => netQtyStr.toLowerCase().includes(u)) || "kg";

      setInput({
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        price: selectedProduct.price || 0,
        netQty: numericNetQty || "1",
        image: undefined,
      });
      setUnit(detectedUnit);
    }
  }, [selectedProduct]);

  const changeEventHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = ProductListSchema.safeParse({ ...input, netQty: input.netQty + unit });
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      const formattedErrors: Record<string, string> = {};
      for (const key in fieldErrors) {
        formattedErrors[key] = fieldErrors[key as keyof typeof fieldErrors]?.[0] || "";
      }
      setError(formattedErrors);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      formData.append("netQtyValue", input.netQty.toString());
      formData.append("unit", unit);
      if (input.image) {
        formData.append("image", input.image);
      }

      if (selectedProduct?.id) {
        await editProduct(selectedProduct.id, formData);
        setEditOpen(false);
        if (shopId) {
          fetchProductsByShop(shopId);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Product</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update your product details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitHandler} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label className="mb-1.5 ml-1">Product Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="Enter product name"
                value={input.name}
                onChange={changeEventHandler}
              />
              {error.name && (
                <span className="text-xs font-medium text-red-500">{error.name}</span>
              )}
            </div>
            <div className="flex flex-col">
              <Label className="mb-1.5 ml-1">Price (Rs)</Label>
              <Input
                type="number"
                name="price"
                placeholder="Enter product price"
                value={input.price}
                onChange={changeEventHandler}
              />
              {error.price && (
                <span className="text-xs font-medium text-red-500">{error.price}</span>
              )}
            </div>
            <div className="flex flex-col md:col-span-2">
              <Label className="mb-1.5 ml-1">Description</Label>
              <textarea
                name="description"
                placeholder="Enter product description"
                value={input.description}
                onChange={changeEventHandler}
                className="border rounded-md p-2 h-20 max-h-40 overflow-y-auto resize-none bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black"
              />
              {error.description && (
                <span className="text-xs font-medium text-red-500">{error.description}</span>
              )}
            </div>
            <div className="flex flex-col md:col-span-2">
              <Label className="mb-1.5 ml-1">Net Quantity</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="netQty"
                  placeholder="Enter quantity"
                  value={input.netQty}
                  onChange={changeEventHandler}
                />
                <select
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="border rounded-md p-2 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="kg">kg</option>
                  <option value="gms">gms</option>
                  <option value="ltr">ltr</option>
                  <option value="ml">ml</option>
                  <option value="unit">unit</option>
                </select>
              </div>
              {error.netQty && (
                <span className="text-xs font-medium text-red-500">{error.netQty}</span>
              )}
            </div>
            <div className="flex flex-col md:col-span-2">
              <Label className="mb-1.5 ml-1">Upload Product Image</Label>
              <Input
                type="file"
                name="image"
                accept=".png, .jpg, .jpeg"
                onChange={(e) => setInput({ ...input, image: e.target.files?.[0] || undefined })}
              />
              {error.image && (
                <span className="text-xs font-medium text-red-500">{error.image}</span>
              )}
            </div>
          </div>
          <DialogFooter className="mt-5">
            {loading ? (
              <Button disabled className="bg-brandGreen hover:bg-brandGreen/80 text-white flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
              </Button>
            ) : (
              <Button type="submit" className="bg-brandGreen hover:bg-brandGreen/90 text-white">
                Submit
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProducts;