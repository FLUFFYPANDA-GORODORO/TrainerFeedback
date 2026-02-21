import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  Lock,
  KeyRound,
  Shield,
  Mail,
  GraduationCap,
  Pencil,
} from "lucide-react";

import { updateTrainer } from "@/services/superadmin/trainerService";
import { updateSystemUser } from "@/services/superadmin/userService";
import { uploadImage } from "@/services/cloudinaryService";
import { Loader2, Camera } from "lucide-react";

const ProfilePage = () => {
  const { user, refreshUser } = useAuth(); // Added refreshUser
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");

  const handleNameSave = async () => {
    if (!editedName.trim() || editedName === user.name) {
      setIsEditingName(false);
      return;
    }

    setIsLoading(true);
    try {
      if (user.role === "trainer") {
        await updateTrainer(user.uid, { name: editedName });
      } else {
        await updateSystemUser(user.uid, { name: editedName });
      }

      toast.success("Name updated successfully");
      if (refreshUser) await refreshUser();
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error("Failed to update name");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const url = await uploadImage(file);

      if (user.role === "trainer") {
        await updateTrainer(user.uid, { photoUrl: url });
      } else {
        await updateSystemUser(user.uid, { photoUrl: url });
      }

      toast.success("Profile photo updated successfully");
      if (refreshUser) await refreshUser();
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "superAdmin":
        return "Super Admin";
      case "collegeAdmin":
        return "College Admin";
      case "trainer":
        return "Trainer";
      default:
        return "User";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in-50 duration-500">
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* User Info Card */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </Label>
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg border border-border/50 transition-all hover:bg-muted/60 group/container relative">
                <div className="relative group cursor-pointer shrink-0">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border-2 border-primary/20 overflow-hidden shadow-inner">
                    {user?.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg border-2 border-background z-10 transition-transform hover:scale-110">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    title="Change profile photo"
                  />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 max-w-sm animate-in zoom-in-95 duration-200">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-10 text-lg font-semibold bg-white border-primary focus-visible:ring-primary"
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleNameSave()
                          }
                        />
                        <Button
                          size="sm"
                          onClick={handleNameSave}
                          className="h-10"
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingName(false)}
                          className="h-10"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          title="Click to edit name"
                          onClick={() => {
                            setEditedName(user?.name || "");
                            setIsEditingName(true);
                          }}
                        >
                          <span className="font-bold text-foreground text-xl tracking-tight">
                            {user?.name}
                          </span>
                          <Pencil className="h-3.5 w-3.5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                          Click to edit your personal display name
                        </span>
                      </>
                    )}
                  </div>
                  {!isEditingName && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedName(user?.name || "");
                        setIsEditingName(true);
                      }}
                      className="hidden group-hover/container:flex animate-in fade-in slide-in-from-right-2 duration-200 h-8 rounded-full bg-background/80 backdrop-blur-sm border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Edit Details
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </Label>
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 transition-colors hover:bg-muted/60">
                <div className="p-2 bg-background rounded-md border border-border/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </Label>
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground capitalize">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              {user?.collegeName && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    College
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span
                      className="font-medium text-foreground truncate"
                      title={user.collegeName}
                    >
                      {user.collegeName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative group">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
                    className="pl-10 h-10 bg-background"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password (min. 6 chars)"
                      className="pl-10 h-10 bg-background"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      className="pl-10 h-10 bg-background"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-10 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating Password...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Update Password
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
