import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/zustand/useShopStore";
import { useProductStore } from "@/zustand/useProductStore";
import axios from "axios";
import { unitOptions } from "@/config/data"; // 🧠 Should be like ["pcs", "g", "kg", "ml", "ltr"]

export default function ProductCatalog() {
  const { shop: shopList } = useShopStore();
  const { products, loading, fetchAllProducts, addExistingProductToShop } =
    useProductStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [netQtyValue, setNetQtyValue] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [openAddToShop, setOpenAddToShop] = useState(false);

  // ✅ Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/v1/product/category"
        );
        if (res.data.success) setCategories(res.data.categories);
      } catch {
        toast.error("⚠️ Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // ✅ Fetch products when filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAllProducts(search, selectedCategory ?? undefined);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory]);

  // 🛒 Add product to shop
  const handleAdd = async () => {
    if (!selectedShop || !price || !quantity || !netQtyValue || !unit) {
      toast.error("⚠️ Please fill all fields");
      return;
    }

    try {
      await addExistingProductToShop(
        selectedProduct.id,
        selectedShop,
        Number(price),
        Number(quantity),
        Number(netQtyValue),
        unit
      );
      toast.success(
        `✅ Added to ${shopList.find((s) => s.id === selectedShop)?.storeName}`
      );
      setOpenAddToShop(false);
      setPrice("");
      setQuantity("");
      setNetQtyValue("");
      setUnit("pcs");
      setSelectedShop(null);
    } catch {
      toast.error("❌ Failed to add product");
    }
  };

  // 🏪 If no shop exists
  if (shopList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          No Shops Found
        </h2>
        <p className="text-gray-500 mt-2 dark:text-gray-400">
          Please create a shop before managing products.
        </p>
        <Button
          onClick={() => (window.location.href = "/admin/store/new")}
          className="mt-4 bg-brandOrange hover:bg-hoverOrange text-white"
        >
          + Create Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          🛍️ Product Catalog
        </h1>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <Button
          onClick={() =>
            fetchAllProducts(search, selectedCategory ?? undefined)
          }
          disabled={loading}
          className="bg-brandGreen hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4 mr-1" />
          ) : (
            <Search className="w-4 h-4 mr-1" />
          )}
          Search
        </Button>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Chip
          label="All"
          selected={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            selected={selectedCategory === cat.id}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
            }
          />
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No products found.</p>
        ) : (
          products.map((p) => (
            <Card
              key={p.id}
              className="rounded-xl shadow-sm hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-4 space-y-3">
                <img
                  src={p.image || "https://placehold.co/300x300?text=Product"}
                  alt={p.name}
                  className="w-full h-52 rounded-lg object-cover hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.netQty}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {typeof p.category === "string" ? p.category : p.category?.name || "Uncategorized"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedProduct(p);
                    setOpenAddToShop(true);
                  }}
                  className="w-full bg-brandOrange hover:bg-hoverOrange text-white"
                >
                  + Add to Shop
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add to Shop Modal */}
      <Dialog open={openAddToShop} onOpenChange={setOpenAddToShop}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add “{selectedProduct?.name}” to Shop
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Select Shop */}
            <select
              value={selectedShop ?? ""}
              onChange={(e) => setSelectedShop(Number(e.target.value))}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            >
              <option value="">Select a shop...</option>
              {shopList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.storeName} - {shop.city}
                </option>
              ))}
            </select>

            {/* Price */}
            <Input
              placeholder="Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />

            {/* Quantity */}
            <Input
              placeholder="Stock Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />

            {/* ✅ Net Quantity & Unit */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Net Quantity (e.g. 500)"
                type="number"
                value={netQtyValue}
                onChange={(e) => setNetQtyValue(e.target.value)}
                className="flex-1 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-brandGreen hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------------------------
   🧩 Chip Component
--------------------------------------------- */
const Chip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
      selected
        ? "bg-brandGreen text-white border-brandGreen"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`}
  >
    {label}
  </button>
);
