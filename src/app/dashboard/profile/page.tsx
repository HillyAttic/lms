"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { UserRoundIcon } from "@/lib/icons";
import { LearnerPageHeading } from "../learner-courses";

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);

  const initial = (user?.displayName || user?.email?.[0] || "U").charAt(0).toUpperCase();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;

    const displayName = name.trim();
    if (!displayName) {
      toast.error("Please enter your name.");
      return;
    }

    setSaving(true);
    try {
      // Only the account's own display name is editable here. The profile
      // document's `role` and `email` are written by the server action alone —
      // see ensureUserProfile — so this form never sends them.
      await updateProfile(auth.currentUser!, { displayName });
      toast.success("Profile updated.");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <LearnerPageHeading title="Profile" icon={UserRoundIcon} />

      <div className="mt-6 flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-purple-50 text-xl font-semibold text-purple-600">
          {user?.photoURL ? (
            // Google's avatar host is not in next.config's image domains.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={name} className="size-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{user?.email}</p>
          <p className="text-sm text-secondary capitalize">{role || "learner"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
        <div>
          <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
            Display name
          </label>
          <Input
            id="displayName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <Input id="email" value={user?.email || ""} disabled />
          <p className="mt-1.5 text-xs text-gray-500">
            Your email address cannot be changed here.
          </p>
        </div>

        <Button type="submit" disabled={saving} className="px-6">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
