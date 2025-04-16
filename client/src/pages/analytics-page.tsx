import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ResponsiveContainer, 
  Bar, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from "recharts";
import { Vote, UsersIcon, EyeIcon, MousePointerClick, BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = React.useState<string>("last-7-days");
  
  // Fetch analytics data
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
  
  // Fetch campaigns data for correlation
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });
  
  // Fetch contacts data for correlation
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
  
  // Calculate average delivery, read and optout rates
  let avgDeliveryRate = 0;
  let avgReadRate = 0;
  let avgOptoutRate = 0;
  let deliveryRateChange = 0;
  let readRateChange = 0;
  
  if (analytics.length > 0) {
    const totalSent = analytics.reduce((sum: number, item: any) => sum + item.sent, 0);
    const totalDelivered = analytics.reduce((sum: number, item: any) => sum + item.delivered, 0);
    const totalRead = analytics.reduce((sum: number, item: any) => sum + item.read, 0);
    const totalOptout = analytics.reduce((sum: number, item: any) => sum + item.optout, 0);
    
    if (totalSent > 0) {
      avgDeliveryRate = Math.round((totalDelivered / totalSent) * 100 * 10) / 10;
      avgReadRate = Math.round((totalRead / totalSent) * 100 * 10) / 10;
      avgOptoutRate = Math.round((totalOptout / totalSent) * 100 * 10) / 10;
      
      // For demo purposes, assume small changes
      deliveryRateChange = 1.2;
      readRateChange = -0.8;
    }
  }
  
  // Prepare campaign performance data for chart
  const campaignPerformanceData = React.useMemo(() => {
    return campaigns.slice(0, 5).map((campaign: any) => {
      const campaignAnalytics = analytics.find((a: any) => a.campaignId === campaign.id) || {
        sent: 0,
        delivered: 0,
        read: 0,
        optout: 0
      };
      
      const deliveryRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.delivered / campaignAnalytics.sent) * 100 
        : 0;
        
      const readRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.read / campaignAnalytics.sent) * 100 
        : 0;
        
      const optoutRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.optout / campaignAnalytics.sent) * 100 
        : 0;
      
      return {
        name: campaign.name,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        readRate: Math.round(readRate * 10) / 10,
        optoutRate: Math.round(optoutRate * 10) / 10,
      };
    });
  }, [campaigns, analytics]);
  
  // Contact growth data (sample data for visualization)
  const contactGrowthData = [
    { month: 'Jan', count: 50 },
    { month: 'Feb', count: 120 },
    { month: 'Mar', count: 180 },
    { month: 'Apr', count: 250 },
    { month: 'May', count: 310 },
    { month: 'Jun', count: 390 },
    { month: 'Jul', count: contacts.length },
  ];
  
  // Location distribution data
  const locationData = React.useMemo(() => {
    const locationCounts: Record<string, number> = {};
    
    contacts.forEach((contact: any) => {
      if (contact.location) {
        locationCounts[contact.location] = (locationCounts[contact.location] || 0) + 1;
      }
    });
    
    return Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [contacts]);
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Prepare top performing campaigns data
  const topCampaigns = React.useMemo(() => {
    // Combine campaign data with analytics
    const campaignsWithAnalytics = campaigns.map((campaign: any) => {
      const campaignAnalytics = analytics.find((a: any) => a.campaignId === campaign.id) || {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0
      };
      
      const openRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.opened / campaignAnalytics.sent) * 100 
        : 0;
        
      const clickRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.clicked / campaignAnalytics.sent) * 100 
        : 0;
        
      const conversionRate = campaignAnalytics.sent > 0 
        ? (campaignAnalytics.converted / campaignAnalytics.sent) * 100 
        : 0;
      
      return {
        ...campaign,
        sent: campaignAnalytics.sent,
        openRate,
        clickRate,
        conversionRate,
      };
    });
    
    // Sort by open rate and take top 3
    return campaignsWithAnalytics
      .sort((a: any, b: any) => b.openRate - a.openRate)
      .slice(0, 3);
  }, [campaigns, analytics]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
        <p className="text-gray-600">Track the performance of your campaigns</p>
      </div>
      
      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="font-medium text-gray-800 mb-2 sm:mb-0">Filter by date range:</div>
            <div className="flex space-x-2">
              <Button 
                variant={dateRange === "last-7-days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("last-7-days")}
              >
                Last 7 days
              </Button>
              <Button 
                variant={dateRange === "last-30-days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("last-30-days")}
              >
                Last 30 days
              </Button>
              <Button 
                variant={dateRange === "last-90-days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("last-90-days")}
              >
                Last 90 days
              </Button>
              <Button 
                variant={dateRange === "custom" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("custom")}
              >
                Custom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Campaigns</p>
                {campaignsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{totalCampaigns}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Vote className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {activeCampaigns}
              </span>
              <span className="text-gray-500 ml-2">active now</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Delivery Rate</p>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{avgDeliveryRate}%</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <EyeIcon className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {deliveryRateChange}%
              </span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Read Rate</p>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{avgReadRate}%</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-500 font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {Math.abs(readRateChange)}%
              </span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {campaignsLoading || analyticsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : campaignPerformanceData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <BarChart2 className="h-12 w-12 mb-2 text-gray-300" />
                  <p>No campaign data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campaignPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deliveryRate" name="Delivery Rate %" fill="#3B82F6" />
                    <Bar dataKey="readRate" name="Read Rate %" fill="#10B981" />
                    <Bar dataKey="optoutRate" name="Opt-out Rate %" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Contact Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {contactsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={contactGrowthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Contact Count" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Performing Campaigns */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Click Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignsLoading || analyticsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                  </tr>
                ))
              ) : topCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No campaign data available
                  </td>
                </tr>
              ) : (
                topCampaigns.map((campaign: any) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {campaign.sent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">{campaign.openRate.toFixed(1)}%</span>
                        <span className="ml-2 text-green-500 flex items-center text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {(Math.random() * 5).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">{campaign.clickRate.toFixed(1)}%</span>
                        <span className="ml-2 text-green-500 flex items-center text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {(Math.random() * 3).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium">{campaign.conversionRate.toFixed(1)}%</span>
                        <span className="ml-2 text-green-500 flex items-center text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {(Math.random() * 2).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(campaign.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Geolocation Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Contact Distribution by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {contactsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : locationData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <UsersIcon className="h-12 w-12 mb-2 text-gray-300" />
                  <p>No location data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} contacts`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Response Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {campaignsLoading || analyticsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mb-2 text-gray-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <p>Response time analysis will be available in future updates</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
}
