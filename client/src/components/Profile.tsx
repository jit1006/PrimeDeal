import {
  Mail,
  Phone,
  Plus,
  User,
  Loader2,
  Edit2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ProfileInputState, userProfileSchema } from "@/schema/userSchema";
import { useUserStore } from "@/zustand/useUserStore";
import { toast } from "sonner";
import AddressSection from "./AddressSection";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ---------------- Profile State -----------------
  const [profileData, setProfileData] = useState<ProfileInputState>({
    fullname: "",
    email: "",
    phoneNumber: "",
    profilePicture: "",
  });

  const updateProfile = useUserStore((state) => state.updateProfile);
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      setProfileData({
        fullname: user.fullname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        profilePicture: user.profilePicture || "",
      });
      setSelectedFile(user.profilePicture || "");
    }
  }, [user]);

  const [errors, setErrors] = useState<Partial<ProfileInputState>>({});
  const imageRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>(
    user?.profilePicture || ""
  );

  // Image Upload
  const fileChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedFile(result);
        setProfileData((prevData) => ({
          ...prevData,
          profilePicture: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Input Change
  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Cancel Editing
  const handleCancel = () => {
    if (user) {
      setProfileData({
        fullname: user.fullname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        profilePicture: user.profilePicture || "",
      });
      setSelectedFile(user.profilePicture || "");
    }
    setErrors({});
    setIsEditing(false);
  };

  // Submit Handler - ONLY runs when user actively submits in edit mode
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard: Prevent saving if user is not in editing mode
    if (!isEditing) {
      return;
    }

    const validationResult = userProfileSchema.safeParse(profileData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.formErrors.fieldErrors;
      setErrors(fieldErrors as Partial<ProfileInputState>);
      toast.error("Please fill all details correctly.");
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile(validationResult.data);
      setIsLoading(false);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 border border-gray-300 dark:border-gray-700 p-8 rounded-2xl shadow-sm bg-white dark:bg-gray-900 transition-all">
      {/* ---------------- Profile Section ---------------- */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Avatar Section */}
          <div className="relative w-28 h-28 md:w-32 md:h-32">
            <Avatar className="w-full h-full">
              <AvatarImage src={selectedFile || ""} />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-bold">
                {profileData.fullname?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={imageRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={fileChangeHandler}
              disabled={!isEditing}
            />
            {isEditing && (
              <div
                onClick={() => imageRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer transition-opacity"
              >
                <Plus className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Name, Email, Phone */}
          <div className="flex flex-col w-full md:w-2/3 space-y-4">
            <ProfileField
              icon={<User className="w-4 h-4" />}
              label="Full Name"
              name="fullname"
              value={profileData.fullname}
              onChange={changeHandler}
              disabled={!isEditing}
              error={errors.fullname}
            />
            <ProfileField
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              name="email"
              value={profileData.email}
              disabled={true}
              error={errors.email}
            />
            <ProfileField
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={changeHandler}
              disabled={!isEditing}
              error={errors.phoneNumber}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          {!isEditing ? (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="bg-brandOrange text-white px-8 py-2 hover:bg-brandOrange/90 transition flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          ) : (
            <>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-brandGreen text-white px-8 py-2 hover:bg-brandGreen/80 transition flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                disabled={isLoading}
                className="border-gray-400 text-gray-700 dark:text-gray-200 px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
            </>
          )}
        </div>
      </form>

      <Separator className="my-10 bg-gray-300 dark:bg-gray-700" />

      {/* ---------------- Address Section ---------------- */}
      <AddressSection />
    </div>
  );
};

export default Profile;

/* ===========================================================
   📦 Profile Field Component
=========================================================== */
const ProfileField = ({
  icon,
  label,
  name,
  value,
  onChange,
  disabled,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
}) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}
      </Label>
    </div>
    <Input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={`Enter ${label}`}
      className={`w-full border-b border-gray-400 bg-transparent focus:ring-0 focus:border-brandGreen dark:text-white ${
        disabled ? "opacity-75 cursor-not-allowed text-gray-500" : ""
      }`}
    />
    {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
  </div>
);
