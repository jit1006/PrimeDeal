import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopStore } from "@/zustand/useShopStore";
import { toast } from "sonner";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

type InputType = {
  storeName: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryTime: number;
  storeBanner: string | File;
};

const mapContainerStyle = {
  width: "100%",
  height: "350px",
  borderRadius: "1rem",
};

const defaultCenter = { lat: 23.2599, lng: 77.4126 }; // default: Bhopal

const AdminStoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addingStore = id === "new";
  const { loading, createShop, updateShop } = useShopStore();

  const [preview, setPreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [input, setInput] = useState<InputType>({
    storeName: "",
    description: "",
    address: "",
    city: "",
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    deliveryTime: 0,
    storeBanner: "",
  });

  // ✅ Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // ✅ Prefill when editing
  useEffect(() => {
    if (!addingStore && id) {
      const shop = useShopStore.getState().shop.find((s) => s.id == Number(id));
      if (shop) {
        setInput({
          storeName: shop.storeName,
          description: shop.description || "",
          address: shop.address,
          city: shop.city,
          latitude: shop.latitude,
          longitude: shop.longitude,
          deliveryTime: shop.deliveryTime,
          storeBanner: shop.storeBanner || "",
        });
        setPreview(shop.storeBanner || null);
      } else toast.error("Something went wrong!");
    }
  }, [addingStore, id]);

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files?.[0]) {
      const file = files[0];
      setInput((prev) => ({ ...prev, storeBanner: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setInput((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  // ✅ Get current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setInput((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        toast.success("Location detected successfully!");
        setLocating(false);
      },
      (err) => {
        toast.error("Failed to get location: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // ✅ Validation
  const validate = () => {
    if (
      !input.storeName.trim() ||
      !input.description.trim() ||
      !input.address.trim() ||
      !input.city.trim() ||
      !input.latitude ||
      !input.longitude ||
      !input.storeBanner
    ) {
      toast.error("Please fill all fields and add a banner.");
      return false;
    }
    return true;
  };

  // ✅ Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && value !== null)
        formData.append(key, String(value));
    });
    if (input.storeBanner instanceof File)
      formData.set("storeBanner", input.storeBanner);

    try {
      if (addingStore) {
        await createShop(formData);
        toast.success("Store created successfully!");
      } else {
        await updateShop(formData);
        toast.success("Store updated successfully!");
      }
      navigate("/admin/store");
    } catch (err: any) {
      toast.error("Failed to save store details.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-md rounded-xl my-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {addingStore ? "Create New Store" : "Edit Store Details"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Store Name</Label>
            <Input
              name="storeName"
              value={input.storeName}
              onChange={handleChange}
              placeholder="e.g. Fresh Groceries"
              required
            />
          </div>

          <div>
            <Label>Estimated Delivery Time (mins)</Label>
            <Input
              name="deliveryTime"
              type="number"
              value={input.deliveryTime}
              onChange={handleChange}
              placeholder="e.g. 30"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input
              name="description"
              value={input.description}
              onChange={handleChange}
              placeholder="Short store description..."
              required
            />
          </div>
        </div>

        {/* Address & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input
              name="city"
              value={input.city}
              onChange={handleChange}
              placeholder="e.g. New York"
              required
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              name="address"
              value={input.address}
              onChange={handleChange}
              placeholder="Full address..."
              required
            />
          </div>
        </div>

        {/* Location Picker */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Store Location (Pin on map)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={locating}
              className="flex items-center gap-2"
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-red-500" />
              )}
              Use Current Location
            </Button>
          </div>

          {loadError && (
            <p className="text-red-500 text-sm">Error loading maps script.</p>
          )}

          {!isLoaded ? (
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={{ lat: input.latitude, lng: input.longitude }}
                onClick={(e) => {
                  if (e.latLng) {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setInput((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                  }
                }}
              >
                <Marker
                  position={{ lat: input.latitude, lng: input.longitude }}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      const lat = e.latLng.lat();
                      const lng = e.latLng.lng();
                      setInput((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                      }));
                    }
                  }}
                />
              </GoogleMap>

              <p className="text-sm text-gray-500 mt-2">
                Latitude: {input.latitude.toFixed(6)} | Longitude:{" "}
                {input.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Banner Upload */}
          <div>
            <Label>Store Banner</Label>
            <Input
              name="storeBanner"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />

            {preview && (
              <div className="mt-3 w-full h-44 rounded-lg overflow-hidden border">
                <img
                  src={preview}
                  alt="Store Banner Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/store")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
              </>
            ) : addingStore ? (
              "Create Store"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminStoreDetail;
