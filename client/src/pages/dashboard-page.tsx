import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, ResponsiveContainer, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, UsersIcon, StarIcon, BarChart2Icon, TrendingUpIcon } from "lucide-react";

// Define chart data type
interface ChartData {
  name: string;
  value: number;
  prevValue?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch campaigns
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

  // Fetch contacts
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

  // Fetch analytics
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

  // Calculate stats
  const activeCampaigns = campaigns.filter((campaign: any) => campaign.status === "active").length;
  
  // Calculate response rate if analytics data is available
  let responseRate = 0;
  let responseRateChange = 0;
  
  if (analytics.length > 0) {
    const totalSent = analytics.reduce((sum: number, item: any) => sum + item.sent, 0);
    const totalOpened = analytics.reduce((sum: number, item: any) => sum + item.opened, 0);
    
    if (totalSent > 0) {
      responseRate = Math.round((totalOpened / totalSent) * 100 * 10) / 10;
      // For demo purposes, assume a small change
      responseRateChange = -3;
    }
  }

  // Sample data for contact growth chart
  const contactGrowthData = [
    { name: 'Jan', value: 150 },
    { name: 'Feb', value: 230 },
    { name: 'Mar', value: 280 },
    { name: 'Apr', value: 340 },
    { name: 'May', value: 390 },
    { name: 'Jun', value: 430 },
    { name: 'Jul', value: contacts.length },
  ];

  // Sort campaigns by createdAt to get recent ones
  const sortedCampaigns = [...campaigns].sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Take the 3 most recent campaigns
  const recentCampaigns = sortedCampaigns.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Here's an overview of your campaigns.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Contacts</p>
                {contactsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{contacts.length}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                12%
              </span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Campaigns</p>
                {campaignsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{activeCampaigns}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <StarIcon className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {recentCampaigns.length > 0
                  ? `Last campaign launched ${formatDate(recentCampaigns[0].createdAt)}`
                  : "No campaigns launched yet"}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Response Rate</p>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{responseRate}%</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart2Icon className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {responseRateChange !== 0 && (
                <>
                  <span className={`font-medium flex items-center ${responseRateChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {responseRateChange > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(responseRateChange)}%
                  </span>
                  <span className="text-gray-500 ml-2">from last month</span>
                </>
              )}
              {responseRateChange === 0 && (
                <span className="text-gray-500">Not enough data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Campaigns */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Campaign Name</th>
                <th className="px-5 py-3 text-left font-medium">Template</th>
                <th className="px-5 py-3 text-left font-medium">Contacts</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Created</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaignsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                  </tr>
                ))
              ) : recentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    No campaigns found. Create your first campaign!
                  </td>
                </tr>
              ) : (
                recentCampaigns.map((campaign: any) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">{campaign.name}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{campaign.template}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {contacts.filter((contact: any) => 
                        !campaign.contactLabel || contact.label === campaign.contactLabel
                      ).length}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(campaign.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" title="View Details">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex justify-between items-center border-t border-gray-200">
          <Link href="/campaigns">
            <a className="text-primary text-sm font-medium hover:underline">View all campaigns</a>
          </Link>
        </div>
      </Card>
      
      {/* Quick Actions & Contact Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/contacts">
              <a className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Add New Contact</h3>
                  <p className="text-sm text-gray-500">Add individual contacts to your database</p>
                </div>
              </a>
            </Link>
            
            <Link href="/contacts">
              <a className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Import Contacts</h3>
                  <p className="text-sm text-gray-500">Bulk import contacts via CSV file</p>
                </div>
              </a>
            </Link>
            
            <Link href="/campaigns">
              <a className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Create Campaign</h3>
                  <p className="text-sm text-gray-500">Set up a new campaign for your contacts</p>
                </div>
              </a>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Contact Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {contactsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={contactGrowthData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Helper components and functions
function StatusBadge({ status }: { status: string }) {
  let className = "px-2 py-1 text-xs rounded-full ";
  
  switch (status) {
    case "active":
      className += "bg-green-100 text-green-800";
      break;
    case "draft":
      className += "bg-yellow-100 text-yellow-800";
      break;
    case "completed":
      className += "bg-gray-100 text-gray-800";
      break;
    default:
      className += "bg-gray-100 text-gray-800";
  }
  
  return <span className={className}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
}
