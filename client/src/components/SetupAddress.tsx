import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAddressStore } from "@/zustand/useAddressStore";
import { Address } from "../../../types/types";

const SetupAddress = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { loading, addAddress, updateAddress } = useAddressStore();

  const [address, setAddress] = useState<Omit<Address, "id">>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      const _id = Number(id);
      const address = useAddressStore
        .getState()
        .addresses.find((a) => a.id === _id);
      if (address) {
        setAddress(address);
      }
    } 
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress({ ...address, [name]: value });
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress((prev) => ({ ...prev, latitude, longitude }));
        try {
          // reverse geocode using OpenStreetMap (no API key required)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            setAddress((prev) => ({
              ...prev,
              city: addr.city || addr.town || addr.village || "",
              state: addr.state || "",
              postalCode: addr.postcode || "",
              country: addr.country || "",
            }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        alert("Failed to fetch location: " + err.message);
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalAddress = {
      ...address,
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    };
    try {
      if (useAddressStore.getState().addresses.length === 0) {
        finalAddress.isDefault = true;
      }
      if (id) {
        await updateAddress(Number(id), finalAddress);
      } else {
        await addAddress(finalAddress);
      }
      navigate("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="md:p-8 w-full max-w-md rounded-lg md:border border-gray-200 mx-4"
      >
        <div className="mb-4">
          <h1 className="font-bold text-2xl text-textPrimary dark:text-white">
            Prime Deal
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Set up your delivery address
          </p>
        </div>

        {/* Use Location Button */}
        <div className="flex justify-end mb-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex items-center gap-2 text-brandOrange border-brandOrange hover:bg-brandOrange hover:text-white transition"
          >
            {locating ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" /> Locating...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" /> Use My Location
              </>
            )}
          </Button>
        </div>

        {/* Address Form Fields */}
        <div className="space-y-4">
          <Input
            name="addressLine1"
            placeholder="Address Line 1"
            value={address.addressLine1}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
            required
          />
          <Input
            name="addressLine2"
            placeholder="Address Line 2 (Optional)"
            value={address.addressLine2}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
          />
          <Input
            name="city"
            placeholder="City"
            value={address.city}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
            required
          />
          <Input
            name="state"
            placeholder="State"
            value={address.state}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
            required
          />
          <Input
            name="postalCode"
            placeholder="Postal Code"
            value={address.postalCode}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
            required
          />
          <Input
            name="country"
            placeholder="Country"
            value={address.country}
            onChange={handleChange}
            className="pl-3 border border-gray-300 focus:ring-1 focus:ring-brandOrange text-textPrimary bg-backgroundLight"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6 mb-4">
          {loading ? (
            <Button
              disabled
              className="w-full bg-brandOrange text-white py-2 rounded-md hover:bg-opacity-90 transition border-transparent"
            >
              <Loader2 className="animate-spin h-4 w-4" /> Saving...
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-brandOrange text-white py-2 rounded-md hover:bg-opacity-90 transition border-transparent"
            >
              Save Address
            </Button>
          )}
        </div>

        <Separator />
        <p className="m-2 text-center text-sm text-textSecondary">
          You can edit your address later in your profile.
        </p>
      </form>
    </div>
  );
};

export default SetupAddress;
