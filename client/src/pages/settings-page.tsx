import * as React from "react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { 
  BellRing, 
  Globe, 
  Palette, 
  Moon, 
  Lock, 
  Shield, 
  Clock, 
  BadgeAlert, 
  Send,
  Copy,
  Loader2
} from "lucide-react";

export default function SettingsPage() {
  // State for WhatsApp Business API settings
  const [whatsappSettings, setWhatsappSettings] = useState({
    wabaApiUrl: '',
    facebookAccessToken: '',
    partnerMobile: '',
    wabaId: '',
    campaignApiKey: ''
  });
  
  // Settings type definition
  interface SettingsData {
    id: number;
    accountId: number;
    wabaApiUrl: string | null;
    facebookAccessToken: string | null;
    partnerMobile: string | null;
    wabaId: string | null;
    campaignApiKey: string | null;
    updatedAt: string;
  }

  // Fetch current settings
  const { 
    data: settings, 
    isLoading: settingsLoading 
  } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn<SettingsData>({ on401: "throw" }),
  });

  // Update local state when settings data is loaded
  React.useEffect(() => {
    if (settings) {
      setWhatsappSettings({
        wabaApiUrl: settings.wabaApiUrl ? settings.wabaApiUrl : '',
        facebookAccessToken: settings.facebookAccessToken ? settings.facebookAccessToken : '',
        partnerMobile: settings.partnerMobile ? settings.partnerMobile : '',
        wabaId: settings.wabaId ? settings.wabaId : '',
        campaignApiKey: settings.campaignApiKey ? settings.campaignApiKey : ''
      });
    }
  }, [settings]);
  
  // Mutation to update settings
  const { 
    mutate: updateSettings, 
    isPending: whatsappSettingsLoading 
  } = useMutation({
    mutationFn: async (settingsData: typeof whatsappSettings) => {
      const res = await apiRequest("PUT", "/api/settings", settingsData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp API settings saved",
        description: "Your API settings have been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle saving WhatsApp API settings
  const handleSaveWhatsAppSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(whatsappSettings);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated",
    });
  };
  
  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Appearance settings saved",
      description: "Your appearance preferences have been updated",
    });
  };
  
  const handleSaveRegional = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Regional settings saved",
      description: "Your regional preferences have been updated",
    });
  };
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your application settings and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <nav className="space-y-1">
                <a 
                  href="#notifications" 
                  className="flex items-center p-3 text-gray-700 bg-gray-100 rounded-md font-medium"
                >
                  <BellRing className="h-5 w-5 mr-3 text-primary" />
                  Notifications
                </a>
                <a 
                  href="#appearance" 
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                >
                  <Palette className="h-5 w-5 mr-3 text-primary" />
                  Appearance
                </a>
                <a 
                  href="#regional" 
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                >
                  <Globe className="h-5 w-5 mr-3 text-primary" />
                  Regional
                </a>
                <a 
                  href="#security" 
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                >
                  <Shield className="h-5 w-5 mr-3 text-primary" />
                  Security
                </a>
                <a 
                  href="#api" 
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                >
                  <Send className="h-5 w-5 mr-3 text-primary" />
                  API Access
                </a>
              </nav>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* Notifications */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellRing className="h-5 w-5 mr-2 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage how you receive notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications}>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive campaign performance reports via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Campaign Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when a campaign is completed</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Contact List Updates</Label>
                      <p className="text-sm text-gray-500">Receive notifications when contacts are updated</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Security Alerts</Label>
                      <p className="text-sm text-gray-500">Get notifications for suspicious activities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing Updates</Label>
                      <p className="text-sm text-gray-500">Receive newsletters and product updates</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Save Notification Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Appearance */}
          <Card id="appearance">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAppearance}>
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Dark Mode</Label>
                      <p className="text-sm text-gray-500">Use dark theme when available</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="density">Density</Label>
                    <Select defaultValue="comfortable">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accent">Accent Color</Label>
                    <Select defaultValue="blue">
                      <SelectTrigger>
                        <SelectValue placeholder="Select an accent color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Save Appearance Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Regional */}
          <Card id="regional">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                Regional
              </CardTitle>
              <CardDescription>Manage localization and regional preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveRegional}>
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                        <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                        <SelectItem value="cet">CET (Central European Time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select defaultValue="mdy">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="jpy">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Save Regional Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Security */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Manage your security and privacy settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Session Timeout</Label>
                    <p className="text-sm text-gray-500">Automatically log out after a period of inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Login Notifications</Label>
                    <p className="text-sm text-gray-500">Receive alerts about new logins to your account</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                  <div className="flex">
                    <BadgeAlert className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Recent Login</h4>
                      <p className="text-sm text-yellow-700">
                        A new login was detected from <span className="font-medium">192.168.1.1</span> on <span className="font-medium">April 16, 2025</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Security Settings</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* API Access */}
          <Card id="api">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2 text-primary" />
                API Access
              </CardTitle>
              <CardDescription>Manage API keys and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mb-6">
                {/* WhatsApp Business API Settings */}
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">WhatsApp Business API Settings</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure your WhatsApp Business API credentials to send messages through campaigns
                  </p>
                  <form onSubmit={handleSaveWhatsAppSettings}>
                    <div className="space-y-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="wabaApiUrl">WhatsApp Business API URL</Label>
                        <Input 
                          id="wabaApiUrl"
                          placeholder="Enter your WhatsApp Business API URL"
                          value={whatsappSettings.wabaApiUrl}
                          onChange={(e) => setWhatsappSettings({
                            ...whatsappSettings,
                            wabaApiUrl: e.target.value
                          })}
                        />
                        <p className="text-xs text-gray-500">
                          Full Graph API URL for fetching message templates (e.g., https://graph.facebook.com/v22.0/YOUR_WABA_ID/message_templates)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="facebookAccessToken">Facebook Access Token</Label>
                        <Input 
                          id="facebookAccessToken"
                          type="password"
                          placeholder="Enter your Facebook Access Token"
                          value={whatsappSettings.facebookAccessToken}
                          onChange={(e) => setWhatsappSettings({
                            ...whatsappSettings,
                            facebookAccessToken: e.target.value
                          })}
                        />
                        <p className="text-xs text-gray-500">
                          Authentication token for accessing the Facebook Graph API
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnerMobile">Partner Mobile Number</Label>
                        <Input 
                          id="partnerMobile"
                          placeholder="Enter your partner mobile number (e.g., 919069001515)"
                          value={whatsappSettings.partnerMobile}
                          onChange={(e) => setWhatsappSettings({
                            ...whatsappSettings,
                            partnerMobile: e.target.value
                          })}
                        />
                        <p className="text-xs text-gray-500">
                          The mobile number used to send campaigns (with country code, no spaces or symbols)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wabaId">WhatsApp Business Account ID (WABA ID)</Label>
                        <Input 
                          id="wabaId"
                          placeholder="Enter your WABA ID"
                          value={whatsappSettings.wabaId}
                          onChange={(e) => setWhatsappSettings({
                            ...whatsappSettings,
                            wabaId: e.target.value
                          })}
                        />
                        <p className="text-xs text-gray-500">
                          Your WhatsApp Business Account ID used for campaign API integration
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaignApiKey">Campaign API Key</Label>
                        <Input 
                          id="campaignApiKey"
                          type="password"
                          placeholder="Enter your Campaign API Key"
                          value={whatsappSettings.campaignApiKey}
                          onChange={(e) => setWhatsappSettings({
                            ...whatsappSettings,
                            campaignApiKey: e.target.value
                          })}
                        />
                        <p className="text-xs text-gray-500">
                          API key for campaign service to authenticate API requests
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={whatsappSettingsLoading}
                      >
                        {whatsappSettingsLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : 'Save WhatsApp Settings'}
                      </Button>
                    </div>
                  </form>
                </div>
                
                {/* API Key */}
                <div className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">API Key</h4>
                      <p className="text-sm text-gray-500">Use this key to authenticate API requests</p>
                    </div>
                    <Button variant="outline" size="sm">Generate New Key</Button>
                  </div>
                  <div className="bg-gray-100 p-3 rounded flex items-center justify-between">
                    <code className="text-sm font-mono">••••••••••••••••••••••••••••••</code>
                    <Button variant="ghost" size="sm">Show</Button>
                  </div>
                </div>
                
                {/* Webhook URL */}
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Webhook URL</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Configure a URL to receive webhook events
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="https://example.com/webhook"
                    />
                    <Button size="sm">Save</Button>
                  </div>
                </div>
                
                {/* API Usage */}
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">API Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Requests this month</span>
                      <span className="font-medium">1,204 / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Integrations</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded mr-3">
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium">Facebook</h5>
                          <p className="text-xs text-gray-500">Connected</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Disconnect</Button>
                    </div>
                    
                    <div className="p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded mr-3">
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium">Twitter</h5>
                          <p className="text-xs text-gray-500">Connected</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Disconnect</Button>
                    </div>
                    
                    <div className="p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded mr-3">
                          <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium">GitHub</h5>
                          <p className="text-xs text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                    
                    <div className="p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded mr-3">
                          <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671l-.267-.349c-1.045-1.367-2.067-2.766-2.674-4.369-.18-.479-.334-.985-.414-1.479-.097-.591-.065-1.22.088-1.783.149-.541.377-1.009.682-1.443.35-.499.748-.872 1.084-1.183.189-.174.38-.338.555-.501.256-.238.49-.464.675-.654.181-.19.34-.358.458-.501.252-.307.462-.574.583-.783.12-.209.209-.371.23-.446.024-.09.006-.111-.094-.143-.067-.021-.192-.011-.32.025-.396.111-.798.33-1.193.635-.562.434-1.096.904-1.579 1.429-1.003 1.087-1.836 2.385-2.398 3.789-.147.367-.284.784-.344 1.176-.042.28-.064.471-.067.587v.056c-.001.127.01.251.022.409.036.474.145 1.142.308 1.76.351 1.325.995 2.629 1.722 3.891.385.667.802 1.319 1.242 1.96l.416.61c.144.211.291.421.439.631.149.211.302.419.458.63.155.21.312.418.465.623l.161.213c.26.346.569.686.937 1.019.742.666 1.643 1.297 2.834 1.759.595.23 1.304.447 2.112.527 1.689.167 3.434-.265 4.915-1.286 1.287-.888 2.357-2.139 3.075-3.609.341-.697.666-1.549.826-2.362.071-.36.133-.927.084-1.297-.058-.433-.196-.896-.42-1.341-.283-.566-.713-1.075-1.12-1.462-.638-.609-1.326-1.071-2.01-1.578-.398-.295-.651-.629-.683-.781-.034-.152.089-.263.323-.343.565-.194 1.373-.211 2.015-.08 1.097.223 2.039.868 2.699 1.74.327.429.487.848.472 1.115-.057 1.068-.744 4.368-.406 6.27.322 1.818 1.323 4.059 3.216 5.181 1.362.807 3.132 1.088 4.642.521 1.541-.58 2.816-1.839 3.59-3.537.773-1.699 1.124-3.827 1.027-5.859-.045-.93-.201-1.917-.47-2.804-.237-.78-.625-1.609-1.163-2.27zm-1.151.525c.406.557.694 1.181.878 1.784.218.719.344 1.512.382 2.312.087 1.791-.224 3.698-.861 5.176-.67 1.558-1.778 2.713-3.137 3.225-1.25.469-2.8.263-3.943-.444-1.719-.947-2.666-3.033-2.96-4.659-.313-1.75.374-4.859.437-6.094.015-.292-.024-.574-.126-.814-.144-.336-.346-.627-.6-.852-.512-.45-1.239-.861-2.098-1.032-.89-.181-1.503-.089-1.768.006-.182.065-.315.156-.391.252-.144.183-.056.385.075.548.19.235.635.649 1.015.934.696.52 1.439 1.023 2.134 1.682.524.497 1.029 1.119 1.381 1.824.35.703.533 1.479.612 2.183.147 1.307-.378 2.799-1.137 3.921-.79 1.168-1.972 2.076-3.26 2.499-1.298.424-2.794.266-4.191-.318-.973-.408-1.762-.941-2.454-1.555-.635-.562-1.044-1.124-1.478-1.587-.079-.084-.16-.17-.248-.251-.064-.061-.343-.308-.423-.377-.153-.133-.304-.261-.456-.392-.149-.128-.295-.262-.449-.375-.102-.075-.21-.132-.307-.213-.032-.027-.235-.216-.374-.339l-.311-.318c-1.197-1.232-2.272-2.643-3.025-4.225-.196-.411-.36-.845-.505-1.29-.085-.261-.155-.502-.206-.753-.058-.29-.08-.554-.094-.801-.014-.244 0-.441.022-.555.101-.512.239-.944.399-1.326.756-1.801 2.147-3.353 3.74-4.347l.108-.066c.349-.209.721-.373 1.082-.517.374-.149.748-.267 1.108-.333.191-.035.38-.057.569-.064.169-.006.337.003.501.032.272.048.517.152.688.282.144.109.247.25.295.383.049.134.051.252.013.317-.064.112-.209.236-.421.42-.214.184-.476.403-.784.649-.146.117-.295.24-.441.362-.144.121-.287.242-.427.365-.325.284-.682.642-.955 1.023-.223.308-.409.641-.529 1.016-.115.36-.166.764-.092 1.158.075.394.196.77.349 1.127.566 1.313 1.478 2.517 2.47 3.713.082.098.171.201.248.283.075.081.151.161.229.245.303.324.622.637.968.947.337.302.699.592 1.087.883.596.448 1.259.875 2.01 1.243.771.38 1.633.679 2.59.83.961.152 2.02.123 3.027-.08 2.541-.512 4.854-2.253 6.122-4.764.516-1.024.816-2.178.975-3.376.1075-.8098.1399-1.661.1097-2.432-.0536-1.379-.278-2.681-.6209-3.873z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium">Slack</h5>
                          <p className="text-xs text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}