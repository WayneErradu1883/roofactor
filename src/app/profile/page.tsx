"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile image
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to change password.");
        return;
      }
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Network error.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 500KB, resize via canvas
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize to 200x200
          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext("2d")!;

          // Crop to square from center
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update-profile-image",
              profileImage: dataUrl,
            }),
          });

          if (res.ok) {
            setProfile((prev) =>
              prev ? { ...prev, profileImage: dataUrl } : prev
            );
          }
          setUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    setUploadingImage(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile-image",
          profileImage: null,
        }),
      });
      if (res.ok) {
        setProfile((prev) =>
          prev ? { ...prev, profileImage: null } : prev
        );
      }
    } catch {
      // silent
    } finally {
      setUploadingImage(false);
    }
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Profile</h2>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Profile Picture & Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profile"
                        className="size-20 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-border">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">{profile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.email} &middot; {profile?.role}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? "Uploading..." : "Upload Photo"}
                      </Button>
                      {profile?.profileImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={handleRemoveImage}
                          disabled={uploadingImage}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Switch between light and dark mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>
                  Update your password. You will stay signed in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="h-10"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-new-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-10"
                      required
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordMsg && (
                    <p className="text-sm text-primary">{passwordMsg}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
