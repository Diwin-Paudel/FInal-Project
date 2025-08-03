import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Shield, Database, Globe } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "FoodExpress",
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    deliveryRadius: "10", // km
    minOrderAmount: "50", // currency
    platformFee: "5", // percentage
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: "8",
    sessionTimeout: "24", // hours
    maxLoginAttempts: "5",
    requireEmailVerification: true,
    twoFactorEnabled: false,
  });

  const handleSaveSettings = (settingsType: string) => {
    toast({
      title: "Settings Saved",
      description: `${settingsType} settings have been updated successfully.`,
    });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-gray-600">Configure platform-wide settings and preferences</p>
          </div>

          <div className="grid gap-6">
            {/* Platform Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Platform Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input
                      id="platform-name"
                      value={platformSettings.platformName}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        platformName: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery-radius">Delivery Radius (km)</Label>
                    <Input
                      id="delivery-radius"
                      type="number"
                      value={platformSettings.deliveryRadius}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        deliveryRadius: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-order">Minimum Order Amount</Label>
                    <Input
                      id="min-order"
                      type="number"
                      value={platformSettings.minOrderAmount}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        minOrderAmount: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                    <Input
                      id="platform-fee"
                      type="number"
                      value={platformSettings.platformFee}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        platformFee: e.target.value
                      })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable access to the platform</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) => setPlatformSettings({
                        ...platformSettings,
                        maintenanceMode: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Registration Enabled</Label>
                      <p className="text-sm text-gray-600">Allow new user registrations</p>
                    </div>
                    <Switch
                      checked={platformSettings.registrationEnabled}
                      onCheckedChange={(checked) => setPlatformSettings({
                        ...platformSettings,
                        registrationEnabled: checked
                      })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("Platform")}>
                  Save Platform Settings
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Send email notifications to users</p>
                    </div>
                    <Switch
                      checked={platformSettings.emailNotifications}
                      onCheckedChange={(checked) => setPlatformSettings({
                        ...platformSettings,
                        emailNotifications: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Send SMS notifications to users</p>
                    </div>
                    <Switch
                      checked={platformSettings.smsNotifications}
                      onCheckedChange={(checked) => setPlatformSettings({
                        ...platformSettings,
                        smsNotifications: checked
                      })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("Notification")}>
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password-length">Minimum Password Length</Label>
                    <Input
                      id="password-length"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: e.target.value
                      })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-600">Users must verify email before accessing platform</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        requireEmailVerification: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Enable 2FA for admin accounts</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        twoFactorEnabled: checked
                      })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings("Security")}>
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Platform Version</Label>
                    <p className="font-medium">1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Database Status</Label>
                    <p className="font-medium text-green-600">Connected</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Last Backup</Label>
                    <p className="font-medium">Today, 12:00 AM</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Server Uptime</Label>
                    <p className="font-medium">24 days, 5 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}