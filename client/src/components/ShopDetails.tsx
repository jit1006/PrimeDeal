import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Timer } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useShopStore } from "@/zustand/useShopStore";
import { useCartStore } from "@/zustand/useCartStore";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ShopDetails = () => {
  const { id } = useParams();
  const { singleShop, getSingleShop, loading } = useShopStore();
  const { addToCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (id) getSingleShop(id);
  }, [id, getSingleShop]);

  const inventory = singleShop?.inventory ?? [];

  /** 🧠 Extract unique categories — memoized */
  const allCategories = useMemo(() => {
    if (!inventory.length) return ["All"];
    const unique = new Set(
      inventory.map((item) => item.product?.category?.name).filter((name): name is string => Boolean(name))
    );
    return ["All", ...Array.from(unique)];
  }, [inventory]);

  /** ⚡ Filter inventory efficiently */
  const filteredInventory = useMemo(() => {
    if (selectedCategory === "All") return inventory;
    return inventory.filter(
      (item) => item.product?.category?.name === selectedCategory
    );
  }, [selectedCategory, inventory]);

  if (loading || !singleShop) return <ShopDetailsSkeleton />;

  return (
    <div className="max-w-6xl mx-auto my-10 px-4">
      {/* 🏪 Banner */}
      <div className="relative w-full h-56 md:h-72 lg:h-80 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
        <img
          src={
            singleShop.storeBanner ||
            "https://placehold.co/1200x400?text=Shop+Banner"
          }
          alt={singleShop.storeName}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-5 left-5 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
            {singleShop.storeName}
          </h1>
          <p className="text-sm opacity-90 mt-1">{singleShop.address}</p>
        </div>
      </div>

      {/* 🧾 Shop Info */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* 🏷️ Category Filter */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map((category) => (
            <Badge
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded-md border cursor-pointer transition-all duration-200 shadow-sm",
                selectedCategory === category
                  ? "bg-brandGreen text-white border-brandGreen"
                  : "bg-background dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-textPrimary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* ⏱️ Delivery Time */}
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-brandGreen" />
          <p className="text-lg font-medium text-textPrimary dark:text-white">
            <span className="font-semibold">{singleShop.deliveryTime}</span> min
            delivery
          </p>
        </div>
      </div>

      {/* 🛍️ Product Grid */}
      <div className="mt-10">
        {filteredInventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product}
                inventory={item}
                shopId={singleShop.id}
                addToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;

/* -------------------- Product Card -------------------- */
const ProductCard = ({ product, inventory, shopId, addToCart }: any) => {
  const handleAddToCart = () => {
    if (!inventory.isAvailable) {
      toast.error("This product is currently unavailable");
      return;
    }

    const added = addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        price: inventory.price,
        netQty: product.netQty,
        unit: inventory.unit,
        shopId,
        isAvailable: inventory.isAvailable,
      },
      shopId
    );

    if (added) {
      toast.success("Product added to cart");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="object-contain w-full h-full p-3"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col flex-grow justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
            {product.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {product.description}
          </p>
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {product.netQty} {inventory.unit}
            </p>
            <p className="text-lg font-bold text-brandGreen">
              ₹{inventory.price.toFixed(2)}
            </p>
          </div>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!inventory.isAvailable}
          className={cn(
            "mt-4 w-full text-white py-2 rounded-md transition",
            inventory.isAvailable
              ? "bg-brandGreen hover:bg-brandGreen/80"
              : "bg-gray-400 cursor-not-allowed"
          )}
        >
          {inventory.isAvailable ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
};

/* -------------------- Skeleton Loader -------------------- */
const ShopDetailsSkeleton = () => (
  <div className="max-w-6xl mx-auto my-10 px-4 flex flex-col items-center">
    <Skeleton className="w-full h-56 md:h-72 lg:h-80 rounded-lg mb-6" />
    <div className="w-full flex flex-wrap justify-between items-center mb-6 gap-4">
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-6 w-32 rounded-md" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  </div>
);
