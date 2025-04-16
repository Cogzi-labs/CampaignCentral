import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  CopyIcon, 
  PlayIcon, 
  TrashIcon 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CampaignsPage() {
  const { toast } = useToast();
  const [showCreateCampaign, setShowCreateCampaign] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showLaunchDialog, setShowLaunchDialog] = React.useState(false);
  
  // State for filters
  const [statusFilter, setStatusFilter] = React.useState("");
  const [dateRangeFilter, setDateRangeFilter] = React.useState("");
  
  // Query parameters for filtered data
  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (dateRangeFilter) params.append('dateRange', dateRangeFilter);
    return params.toString();
  }, [statusFilter, dateRangeFilter]);

  // Fetch campaigns with filters
  const {
    data: campaigns = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/campaigns?${queryParams}`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Fetch contacts (to calculate contact counts)
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  // Launch campaign mutation
  const launchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/campaigns/${id}/launch`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign launched",
        description: "The campaign has been successfully launched.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      refetch();
      setShowLaunchDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to launch campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      refetch();
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle launch campaign
  const handleLaunchCampaign = () => {
    if (selectedCampaign) {
      launchMutation.mutate(selectedCampaign.id);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = () => {
    if (selectedCampaign) {
      deleteMutation.mutate(selectedCampaign.id);
    }
  };

  // Calculate contact count for a campaign
  const getContactCount = (campaign: any) => {
    if (!campaign.contactLabel) {
      return contacts.length;
    }
    
    return contacts.filter((contact: any) => contact.label === campaign.contactLabel).length;
  };

  // Configure columns for data table
  const columns = [
    {
      header: "Campaign Name",
      accessorKey: "name",
      cell: (value: string) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: "Template",
      accessorKey: "template",
    },
    {
      header: "Contact Label",
      accessorKey: "contactLabel",
      cell: (value: string) => value || "All Contacts",
    },
    {
      header: "Contacts",
      accessorKey: "id",
      cell: (_: any, row: any) => getContactCount(row),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (value: string) => {
        let variant: any = "neutral";
        switch (value) {
          case "active":
            variant = "success";
            break;
          case "draft":
            variant = "warning";
            break;
          case "completed":
            variant = "neutral";
            break;
        }
        
        return <Badge variant={variant}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: (value: string) => formatDate(value),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (_: any, row: any) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" title="View Details">
            <EyeIcon className="h-4 w-4" />
          </Button>
          
          {row.status === "draft" && (
            <>
              <Button variant="ghost" size="icon" title="Edit Campaign">
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Launch Campaign"
                onClick={() => {
                  setSelectedCampaign(row);
                  setShowLaunchDialog(true);
                }}
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Delete Campaign"
                onClick={() => {
                  setSelectedCampaign(row);
                  setShowDeleteDialog(true);
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {row.status !== "draft" && (
            <Button variant="ghost" size="icon" title="Duplicate Campaign">
              <CopyIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Filters configuration
  const filters = [
    {
      name: "status",
      label: "Status",
      options: [
        { value: "", label: "All Statuses" },
        { value: "draft", label: "Draft" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
      onFilterChange: setStatusFilter,
    },
    {
      name: "dateRange",
      label: "Created Date",
      options: [
        { value: "", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "last-week", label: "Last 7 days" },
        { value: "last-month", label: "Last 30 days" },
        { value: "last-year", label: "This year" },
      ],
      onFilterChange: setDateRangeFilter,
    },
  ];

  // Actions button
  const actions = (
    <Button
      size="sm"
      onClick={() => setShowCreateCampaign(true)}
      className="whitespace-nowrap"
    >
      <PlusIcon className="h-4 w-4 mr-2" />
      Create Campaign
    </Button>
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Campaigns</h1>
          <p className="text-gray-600">Create and manage your marketing campaigns</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={campaigns}
          columns={columns}
          searchPlaceholder="Search campaigns..."
          filters={filters}
          actions={actions}
        />
      </div>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={showCreateCampaign}
        onOpenChange={setShowCreateCampaign}
      />
      
      {/* Launch Campaign Confirmation */}
      <AlertDialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Launch Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to launch this campaign? This will send it to all targeted contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLaunchCampaign}>
              Launch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Campaign Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
