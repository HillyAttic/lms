"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  getPlatformSettings,
  updatePlatformSettings,
  uploadSettingsImage,
} from "@/app/actions/settings-actions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { Save, Image, X } from "@/lib/icons";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";

type Tab = "platform" | "profile";

export default function SettingsPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("platform");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform settings
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7D52F4");
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getPlatformSettings();
      if (result.success && result.data) {
        const data = result.data as any;
        setSiteName(data.siteName || "");
        setSiteDescription(data.siteDescription || "");
        setPrimaryColor(data.primaryColor || "#7D52F4");
        setAllowSelfRegistration(data.allowSelfRegistration !== false);
        setLogoUrl(data.logoUrl);
        setLogoPreview(data.logoUrl);
      }
    } catch (error) {
      toast.error("Failed to load settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setLogoFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSavePlatform = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let newLogoUrl = logoUrl;

      // Upload logo if changed
      if (logoFile) {
        const uploadResult = await uploadSettingsImage(
          logoFile,
          `settings/logo.${logoFile.name.split(".").pop()}`
        );
        if (uploadResult.success) {
          newLogoUrl = uploadResult.url || null;
        } else {
          toast.error("Failed to upload logo");
          setSaving(false);
          return;
        }
      }

      const result = await updatePlatformSettings({
        siteName,
        siteDescription,
        primaryColor,
        allowSelfRegistration,
        logoUrl: newLogoUrl || undefined,
      });

      if (result.success) {
        toast.success("Settings saved successfully");
        setLogoUrl(newLogoUrl);
        setLogoFile(null);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your platform settings" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("platform")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "platform"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Platform
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Profile
        </button>
      </div>

      {/* Platform Settings */}
      {activeTab === "platform" && (
        <div className="max-w-2xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <form onSubmit={handleSavePlatform} className="space-y-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Logo
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(logoUrl);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="h-16 w-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                    <Image className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-sm text-gray-500">
                  Recommended size: 200x50px. PNG or SVG preferred.
                </p>
              </div>
            </div>

            {/* Site Name */}
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                id="siteName"
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter site name"
              />
            </div>

            {/* Site Description */}
            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                id="siteDescription"
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Brief description of your platform"
              />
            </div>

            {/* Primary Color */}
            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="#7D52F4"
                />
              </div>
            </div>

            {/* Self Registration */}
            <div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">Allow Self Registration</p>
                <p className="text-sm text-gray-500">
                  Let users register accounts without admin approval
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowSelfRegistration(!allowSelfRegistration)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowSelfRegistration ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowSelfRegistration ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <div className="max-w-2xl rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">
                  {(user?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.displayName || "No name"}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-purple-600 mt-1 capitalize">{role || "Unknown"}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed from here
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={user?.uid || ""}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 text-gray-500 font-mono text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown"}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact another admin to change your role
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
