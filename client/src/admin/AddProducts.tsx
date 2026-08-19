import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Store, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditProducts from "./EditProducts";
import { ProductListFormSchema, ProductListSchema } from "@/schema/ProductList";
import { useProductStore } from "@/zustand/useProductStore";
import { useShopStore } from "@/zustand/useShopStore";

type ProductFormInput = {
  name: string;
  description: string;
  price: number;
  image?: File;
  netQty: string;
  id: string;
  categoryId: number;
};

const AddProducts = () => {
  const shopId = Number(useParams().id);
  const [input, setInput] = useState<ProductFormInput>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
    netQty: "",
    id: "",
    categoryId: 0,
  });
  const [unit, setUnit] = useState("kg");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductListFormSchema | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<Partial<Record<keyof ProductListFormSchema, string>>>({});
  const [editOpen, setEditOpen] = useState<boolean>(false);

  const {
    loading,
    createProduct,
    shopInventory: products,
    fetchProductsByShop,
  } = useProductStore();
  const { shop } = useShopStore();

  const changeEventHandler = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  useEffect(() => {
    if (shopId) fetchProductsByShop(shopId);
  }, [shopId, fetchProductsByShop]);

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting Form Data:", input);
    const result = ProductListSchema.safeParse({
      ...input,
      netQty: input.netQty + unit,
    });
    if (!result.success) {
      console.log("❌ Zod Validation Errors:", result.error.format());
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
      formData.append("shopId", shopId.toString());
      if (input.categoryId) formData.append("categoryId", input.categoryId.toString());
      if (input.image) formData.append("image", input.image);

      await createProduct(formData, shopId);
      setOpen(false);
      setInput({
        name: "",
        description: "",
        price: 0,
        netQty: "",
        id: "",
        image: undefined,
        categoryId: 0,
      });
      setError({});
    } catch (err) {
      console.log(err);
    }
  };

  const renderAddProductForm = () => (
    <DialogContent className="p-6 space-y-4">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Add New Product</DialogTitle>
        <DialogDescription className="text-sm text-gray-500">
          Add products that will make your store stand out
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
            {error.name && <span className="text-xs font-medium text-red-500">{error.name}</span>}
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
            {error.price && <span className="text-xs font-medium text-red-500">{error.price}</span>}
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
            {error.description && <span className="text-xs font-medium text-red-500">{error.description}</span>}
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
            {error.netQty && <span className="text-xs font-medium text-red-500">{error.netQty}</span>}
          </div>

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

        <DialogFooter className="mt-5">
          {loading ? (
            <Button
              disabled
              className="bg-brandGreen hover:bg-brandGreen/80 text-white flex items-center"
            >
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
  );

  // 🏬 No Shop Created
  if (!shop) {
    return (
      <div className="max-w-6xl mx-auto my-10 p-6 bg-white rounded-lg flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="rounded-full bg-brandOrange/10 p-4 mb-4">
          <Store className="h-12 w-12 text-brandOrange" />
        </div>
        <h1 className="font-extrabold text-2xl text-textPrimary dark:text-white mb-2">
          Create Your Store First
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          You need to set up your store before you can add products. Let's get started!
        </p>
        <Link to="/admin/store">
          <Button className="bg-brandGreen hover:bg-brandGreen/80 text-white">
            Create Your Store
          </Button>
        </Link>
      </div>
    );
  }

  // 🛍 No Products Yet
  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto my-10 p-6 bg-white rounded-lg flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="rounded-full bg-brandOrange/10 p-4 mb-4">
          <ShoppingBag className="h-12 w-12 text-brandOrange" />
        </div>
        <h1 className="font-extrabold text-2xl text-textPrimary mb-2 dark:text-white">
          Your Store Shelves Are Empty
        </h1>
        <p className="text-gray-600 max-w-md mb-6 dark:text-gray-400">
          Time to add your first product! Showcase what makes your store special.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brandGreen hover:bg-brandGreen/80 text-white flex items-center">
              <Plus className="mr-2" /> Add Your First Product
            </Button>
          </DialogTrigger>
          {renderAddProductForm()}
        </Dialog>
      </div>
    );
  }

  // 🧾 Products Exist
  return (
    <div className="max-w-6xl mx-auto my-10 p-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-extrabold text-2xl text-textPrimary dark:text-white">
          Available Products
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brandOrange hover:bg-brandOrange/80 text-white flex items-center">
              <Plus className="mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          {renderAddProductForm()}
        </Dialog>
      </div>

      <div className="space-y-6">
        {products.map((item: any, index: number) => {
          const productObj = item.product || item;
          return (
            <div
              key={index}
              className="relative flex flex-col md:flex-row items-start p-4 shadow-md rounded-lg border bg-white dark:bg-gray-700 space-y-4 md:space-y-0"
            >
              <img
                src={productObj.image || "https://placehold.co/100x100?text=Product"}
                alt={productObj.name}
                className="h-24 w-24 object-cover rounded-lg"
              />
              <div className="flex-1 ml-4">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {productObj.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-100 mt-1 line-clamp-2">
                  {productObj.description}
                </p>
                <h2 className="text-md font-semibold mt-2">
                  Net Qty: <span className="text-gray-600">{item.netQty ?? productObj.netQty}</span>
                </h2>
                <h2 className="text-md font-semibold mt-2">
                  Price: <span className="text-brandGreen">₹{item.price ?? productObj.price}</span>
                </h2>
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedProduct({
                      ...productObj,
                      name: productObj.name,
                      id: productObj.id,
                      price: item.price ?? productObj.price,
                      netQty: item.netQty ?? productObj.netQty,
                    });
                    setEditOpen(true);
                  }}
                  size="sm"
                  className="bg-brandGreen text-white hover:bg-brandGreen/80 px-6 py-4 rounded-md"
                >
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
        <EditProducts
          selectedProduct={selectedProduct}
          editOpen={editOpen}
          setEditOpen={setEditOpen}
          shopId={shopId}
        />
      </div>
    </div>
  );
};

export default AddProducts;