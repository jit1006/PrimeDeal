import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShopStore } from "@/zustand/useShopStore";
import { Loader2, PackageX, Store } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const StoreOrders = () => {
    const { getShopOrders, updateShopOrders, shopOrders, loading, shop } = useShopStore();

    useEffect(() => {
        getShopOrders();
    }, [getShopOrders]);

    const handleStatusChange = async (orderId: string, status: string) => {
        await updateShopOrders(orderId, status);
    };

    if (!shop || shop.length === 0) {
        return (
            <div className="max-w-6xl mx-auto my-10 p-6 bg-white rounded-lg flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="rounded-full bg-brandOrange/10 p-4 mb-4">
                    <Store className="h-12 w-12 text-brandOrange" />
                </div>
                <h1 className="font-extrabold text-2xl text-textPrimary dark:text-white mb-2">Create Your Store First</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">You need to set up your store before you can add products. Let's get started!</p>
                <Link to="/admin/store">
                    <Button className="bg-brandGreen hover:bg-brandGreen/80 text-white">
                        Create Your Store
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold text-textPrimary dark:text-white text-center mb-8">Orders Overview</h1>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 text-brandGreen animate-spin" />
                </div>
            )}

            {/* No Orders Found */}
            {!loading && shopOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <PackageX className="w-16 h-16 text-gray-400 dark:text-gray-400" />
                    <p className="text-gray-500 text-lg mt-4 dark:text-gray-400">No orders found. Looks like it's time to get selling! </p>
                </div>
            )}

            {/* Orders List */}
            {!loading && shopOrders.length > 0 && (
                <div className="space-y-6">
                    {shopOrders.map((order) => (
                        <Card key={order.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <CardContent className="flex flex-col md:flex-row justify-between items-start gap-6">
                                {/* Order Details */}
                                <div className="flex-1 space-y-2 text-left">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Order ID: </span> {order.id}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Customer: </span> {order.user?.fullname || "Guest User"}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 w-60 break-words">
                                        <span className="font-medium">Address: </span> {order.address?.addressLine1 || ""}, {order.address?.city || ""}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Ordered Items: </span>
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                        {(order.items || []).map((item, index) => (
                                            <li key={index}>
                                                {item.product?.name || `Product #${item.productId}`} (x{item.quantity})
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                                        <span className="font-medium">Total Amount: </span> ₹{order.totalAmount}
                                    </p>
                                </div>

                                {/* Order Status Dropdown */}
                                <div className="w-full md:w-1/4 lg:w-1/5 text-center">
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Order Status
                                    </Label>
                                    <Select
                                        onValueChange={(newStatus) => handleStatusChange(String(order.id), newStatus)}
                                        defaultValue={order.orderStatus}
                                    >
                                        <SelectTrigger className="w-full dark:bg-gray-700">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {[
                                                    { label: "Pending", value: "pending" },
                                                    { label: "Confirmed", value: "confirmed" },
                                                    { label: "Preparing", value: "preparing" },
                                                    { label: "Out for Delivery", value: "out_for_delivery" },
                                                    { label: "Delivered", value: "delivered" },
                                                    { label: "Cancelled", value: "cancelled" },
                                                ].map((st) => (
                                                    <SelectItem key={st.value} value={st.value}>
                                                        {st.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoreOrders;