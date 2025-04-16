import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { UserCircle, Lock, Mail, Building } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile logic would go here
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Change password logic would go here
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully",
    });
  };
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Account Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <UserCircle className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="name" 
                        className="rounded-l-none" 
                        value={user?.name || ""} 
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="username" 
                        className="rounded-l-none" 
                        value={user?.username || ""} 
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Building className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="company" 
                        className="rounded-l-none" 
                        value="Your Company" 
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="role" 
                        className="rounded-l-none" 
                        value="Administrator" 
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="currentPassword" 
                        type="password" 
                        className="rounded-l-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        className="rounded-l-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-300">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        className="rounded-l-none" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Account Summary */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-500 text-sm mb-1">Account Type</h4>
                  <p className="font-semibold">Professional</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-500 text-sm mb-1">Account ID</h4>
                  <p className="font-semibold">{user?.accountId || "N/A"}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-500 text-sm mb-1">Joined</h4>
                  <p className="font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-500 text-sm mb-1">Status</h4>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="font-semibold">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Button 
                    variant="outline" 
                    className="border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 text-sm h-auto py-1"
                  >
                    Download Data
                  </Button>
                  <p className="text-sm text-gray-500">Export all your account data as a ZIP archive</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Button 
                    variant="outline" 
                    className="border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 text-sm h-auto py-1"
                  >
                    Delete Account
                  </Button>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}