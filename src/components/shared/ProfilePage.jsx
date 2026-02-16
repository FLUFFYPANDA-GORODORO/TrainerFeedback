import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock, KeyRound, Shield, Mail, GraduationCap } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success("Password changed successfully");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error("Failed to change password:", error);
            let message = "Failed to change password. Please check your current password.";
            if (error.code === 'auth/wrong-password' || error.message.includes('auth/wrong-password')) {
                message = "Incorrect current password.";
            } else if (error.code === 'auth/weak-password') {
                message = "Password is too weak.";
            } else if (error.code === 'auth/too-many-requests') {
                message = "Too many failed attempts. Please try again later.";
            }
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'superAdmin': return 'Super Admin';
            case 'collegeAdmin': return 'College Admin';
            case 'trainer': return 'Trainer';
            default: return role;
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
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 transition-colors hover:bg-muted/60">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base border border-primary/20">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground text-lg">{user?.name}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 transition-colors hover:bg-muted/60">
                                <div className="p-2 bg-background rounded-md border border-border/50">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium text-foreground">{user?.email}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</Label>
                                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-foreground capitalize">{getRoleLabel(user?.role)}</span>
                                </div>
                            </div>

                            {user?.collegeName && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">College</Label>
                                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-foreground truncate" title={user.collegeName}>{user.collegeName}</span>
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
                                <CardDescription>Update your password to keep your account secure</CardDescription>
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
                                <Button type="submit" className="w-full h-10 text-base font-medium shadow-sm hover:shadow-md transition-all" disabled={isLoading}>
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
