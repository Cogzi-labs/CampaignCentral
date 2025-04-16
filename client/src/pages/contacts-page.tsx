import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { BulkDeleteDialog } from "@/components/contacts/bulk-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, UploadIcon, EditIcon, TrashIcon } from "lucide-react";
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

export default function ContactsPage() {
  const { toast } = useToast();
  const [showAddContact, setShowAddContact] = React.useState(false);
  const [showImportContacts, setShowImportContacts] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedContacts, setSelectedContacts] = React.useState<any[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);
  
  // State for filters
  const [labelFilter, setLabelFilter] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState("");
  const [dateRangeFilter, setDateRangeFilter] = React.useState("");
  
  // Query parameters for filtered data
  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (labelFilter) params.append('label', labelFilter);
    if (locationFilter) params.append('location', locationFilter);
    if (dateRangeFilter) params.append('dateRange', dateRangeFilter);
    return params.toString();
  }, [labelFilter, locationFilter, dateRangeFilter]);

  // Fetch contacts with filters
  const {
    data: contacts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/contacts?${queryParams}`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      refetch();
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Extract unique locations from contacts for filter dropdown
  const uniqueLocations = React.useMemo(() => {
    const locations = contacts.map((contact: any) => contact.location).filter(Boolean);
    return Array.from(new Set(locations)) as string[];
  }, [contacts]);

  // Extract unique labels from contacts for filter dropdown
  const uniqueLabels = React.useMemo(() => {
    const labels = contacts.map((contact: any) => contact.label).filter(Boolean);
    return Array.from(new Set(labels)) as string[];
  }, [contacts]);

  // Handle delete contact
  const handleDeleteContact = () => {
    if (selectedContact) {
      deleteMutation.mutate(selectedContact.id);
    }
  };

  // Configure columns for data table
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (value: string) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: "Mobile",
      accessorKey: "mobile",
    },
    {
      header: "Location",
      accessorKey: "location",
    },
    {
      header: "Label",
      accessorKey: "label",
      cell: (value: string) => {
        if (!value) return null;
        
        let variant: any = "neutral";
        switch (value.toLowerCase()) {
          case "customer":
            variant = "success";
            break;
          case "lead":
            variant = "warning";
            break;
          case "subscriber":
            variant = "info";
            break;
          case "vip":
            variant = "default";
            break;
        }
        
        return <Badge variant={variant}>{value}</Badge>;
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
          <Button variant="ghost" size="icon" title="Edit Contact" onClick={() => {}}>
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            title="Delete Contact"
            onClick={() => {
              setSelectedContact(row);
              setShowDeleteDialog(true);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filters configuration
  const filters = [
    {
      name: "label",
      label: "Filter by Label",
      options: [
        { value: "", label: "All Labels" },
        ...uniqueLabels.map((label) => ({
          value: label,
          label,
        })),
      ],
      onFilterChange: setLabelFilter,
    },
    {
      name: "location",
      label: "Filter by Location",
      options: [
        { value: "", label: "All Locations" },
        ...uniqueLocations.map((location) => ({
          value: location,
          label: location,
        })),
      ],
      onFilterChange: setLocationFilter,
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

  // Actions buttons
  const actions = (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowImportContacts(true)}
        className="whitespace-nowrap"
      >
        <UploadIcon className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button
        size="sm"
        onClick={() => setShowAddContact(true)}
        className="whitespace-nowrap"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
    </div>
  );

  // Handle row selection
  const handleRowSelect = (rows: any[]) => {
    setSelectedContacts(rows);
  };

  // Action to delete multiple contacts
  const handleBulkDelete = () => {
    if (selectedContacts.length > 0) {
      setShowBulkDeleteDialog(true);
    } else {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to delete.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Contacts</h1>
          <p className="text-gray-600">Manage and organize your contacts</p>
        </div>
        {selectedContacts.length > 0 && (
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
              className="whitespace-nowrap"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Selected ({selectedContacts.length})
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={contacts}
          columns={columns}
          showCheckbox={true}
          onRowSelect={handleRowSelect}
          searchPlaceholder="Search contacts..."
          filters={filters}
          actions={actions}
        />
      </div>

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
      />

      {/* Import Contacts Dialog */}
      <ImportContactsDialog
        open={showImportContacts}
        onOpenChange={setShowImportContacts}
      />
      
      {/* Delete Contact Dialog */}
      <DeleteContactDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        contact={selectedContact}
      />

      {/* Bulk Delete Contact Dialog */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        contacts={selectedContacts}
        onComplete={() => setSelectedContacts([])}
      />
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
