import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Calendar, Clock } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ProfileTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch profile data
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/profile/me');
      return response;
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ newEmail, currentPassword }: { newEmail: string; currentPassword: string }) => {
      const response = await fetchWithAuth('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: currentPassword, // This API is for password change, we'd need a separate email change endpoint
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully.",
      });
      setNewEmail("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateEmail = async () => {
    try {
      // Validate inputs
      const validation = emailSchema.safeParse({
        email: newEmail,
        password: confirmPassword,
      });

      if (!validation.success) {
        const errors = validation.error.errors.map(err => err.message).join(", ");
        toast({
          title: "Validation Error",
          description: errors,
          variant: "destructive",
        });
        return;
      }

      // Note: This would need a proper email update endpoint
      // For now, we'll show that the structure is ready
      toast({
        title: "Feature Coming Soon",
        description: "Email update functionality will be available soon.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error updating email:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading profile data</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            View and manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="current_email">Current Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <Input
                id="current_email"
                value={profileData?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {profileData?.subscription_status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Subscription Information
            </CardTitle>
            <CardDescription>
              Your subscription details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    profileData.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">{profileData.subscription_status}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Subscription Start Date</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {profileData.subscription_start_date ? format(new Date(profileData.subscription_start_date), "PPP") : "N/A"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Expiry Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {profileData.subscription_expiry_date ? format(new Date(profileData.subscription_expiry_date), "PPP") : "N/A"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Days Remaining</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {profileData.subscription_expiry_date ? 
                      Math.max(0, Math.ceil((new Date(profileData.subscription_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
                      : 0} days
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Update Email Address
          </CardTitle>
          <CardDescription>
            Change your email address. You'll need to confirm with your current password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_email">New Email Address</Label>
            <Input
              id="new_email"
              type="email"
              placeholder="newemail@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm_password"
                type="password"
                placeholder="Enter your current password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleUpdateEmail} 
            disabled={changePasswordMutation.isPending || !newEmail || !confirmPassword}
            className="w-full md:w-auto"
          >
            {changePasswordMutation.isPending ? "Updating..." : "Update Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;