import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, IndianRupee, MapPin, ArrowLeft } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/zustand/useOrderStore";

const OrderDetailPage = () => {
  const { id:orderId } = useParams();
  const { getOrderById, loading,singleOrder } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
   
    if (orderId) 
    {
        getOrderById(Number(orderId));
    }
  }, [orderId]);

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 text-brandGreen animate-spin" />
    </div>
  );
}

if (!singleOrder) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
        Order not found or failed to load ❌
      </h2>
      <Button onClick={() => navigate(-1)} className="mt-4 bg-brandGreen text-white">
        Go Back
      </Button>
    </div>
  );
}

  const order = singleOrder;

  return (
    <div className="max-w-4xl mx-auto my-10 px-4">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-brandGreen"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Button>

      <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Order #{order.id}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
          <OrderStatusBadge status={order.orderStatus} />
        </div>

        <Separator className="my-4" />

        {/* Shop Info */}
        <div className="mb-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Shop</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.shop?.storeName ?? "Unknown Shop"}
          </p>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3 mb-6 text-gray-700 dark:text-gray-300">
          <MapPin className="w-5 h-5 text-brandGreen mt-1" />
          <div>
            <h3 className="font-semibold">Delivery Address</h3>
            <p className="text-sm">
              {order.address?.addressLine1}, {order.address?.city}{" "}
              {order.address?.postalCode}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Items */}
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Items in this Order
        </h3>
        <div className="space-y-3">
          {(order.items || []).map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3 last:border-none"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.product?.image || "/placeholder.png"}
                  alt={item.product?.name}
                  className="w-14 h-14 rounded-md object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    {item.product?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.quantity} × ₹{item.pricePerUnit.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-800 dark:text-gray-200 font-semibold">
                ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Total */}
        <div className="flex justify-between items-center font-semibold text-lg text-gray-800 dark:text-gray-200">
          <span>Total Amount:</span>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-5 h-5" />
            {order.totalAmount.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

/* 🟢 Reuse Badge */
const OrderStatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-orange-500",
    out_for_delivery: "bg-teal-600",
    delivered: "bg-green-600",
    cancelled: "bg-red-500",
  };

  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${colorMap[status] || "bg-gray-400"
        }`}
    >
      {label}
    </span>
  );
};
