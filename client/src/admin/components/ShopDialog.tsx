import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-menubar";
import { Plus, Loader2 } from "lucide-react";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { ProductListFormSchema, ProductListSchema } from "@/schema/ProductList";
import { useProductStore } from "@/zustand/useProductStore";

const ShopDialog = forwardRef((_props, ref) => {
  const [input, setInput] = useState<ProductListFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
    netQty: "",
    id: "",
  });
  const [open, setOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [unit, setUnit] = useState("unit");
  const [error, setError] = useState<Partial<Record<keyof ProductListFormSchema, string>>>({});

  const loading = useProductStore((state) => state.loading);
  const createProduct = useProductStore((state) => state.createProduct);

  useImperativeHandle(ref, () => ({
    open: (id?: number) => {
      if (id) setSelectedShopId(id);
      setOpen(true);
    },
    close: () => setOpen(false),
  }));

  const changeEventHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setInput({
      ...input,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = ProductListSchema.safeParse({
      ...input,
      netQty: input.netQty + unit,
    });
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
      if (!selectedShopId) {
        alert("Please select a shop to add the product.");
        return;
      }

      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      formData.append("netQty", input.netQty + unit);
      formData.append("shopId", selectedShopId.toString());
      if (input.image) {
        formData.append("image", input.image);
      }

      await createProduct(formData);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button
          className="bg-brandOrange hover:bg-brandOrange/80 text-white flex items-center"
          onClick={() => setSelectedShopId(selectedShopId)}
        >
          <Plus className="mr-1" /> Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Product
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Add products that will make your store stand out
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitHandler} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
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
                <span className="text-xs font-medium text-red-500">
                  {error.name}
                </span>
              )}
            </div>

            {/* Price */}
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
                <span className="text-xs font-medium text-red-500">
                  {error.price}
                </span>
              )}
            </div>

            {/* Description */}
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
                <span className="text-xs font-medium text-red-500">
                  {error.description}
                </span>
              )}
            </div>

            {/* Quantity */}
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
                  <option value="unit">unit</option>
                  <option value="kg">kg</option>
                  <option value="gms">gms</option>
                  <option value="ltr">ltr</option>
                  <option value="ml">ml</option>
                </select>
              </div>
              {error.netQty && (
                <span className="text-xs font-medium text-red-500">
                  {error.netQty}
                </span>
              )}
            </div>

            {/* Image Upload */}
            <div className="flex flex-col md:col-span-2">
              <Label className="mb-1.5 ml-1">Upload Product Image</Label>
              <Input
                type="file"
                accept=".png, .jpg, .jpeg"
                name="image"
                onChange={(e) =>
                  setInput({
                    ...input,
                    image: e.target.files?.[0] || undefined,
                  })
                }
              />
              {error.image && (
                <span className="text-xs font-medium text-red-500">
                  {error.image || "*Product image is required"}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="mt-5">
            {loading ? (
              <Button
                disabled
                className="bg-brandGreen hover:bg-brandGreen/80 text-white flex items-center"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-brandGreen hover:bg-brandGreen/90 text-white"
              >
                Submit
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

ShopDialog.displayName = "ShopDialog";

export default ShopDialog;
