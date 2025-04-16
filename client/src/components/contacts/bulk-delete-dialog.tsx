import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Contact } from "@shared/schema";

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
import { Loader2 } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onComplete?: () => void;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  contacts,
  onComplete,
}: BulkDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Using the batch endpoint for better performance
      return await apiRequest("POST", "/api/contacts/batch-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contacts deleted",
        description: `Successfully deleted ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`,
      });
      onOpenChange(false);
      setIsDeleting(false);
      if (onComplete) onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete contacts",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (contacts.length > 0) {
      setIsDeleting(true);
      deleteMutation.mutate(contacts.map(contact => contact.id));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Contacts</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {contacts.length} selected contact{contacts.length !== 1 ? 's' : ''}?
            <br />
            <br />
            This action cannot be undone and will permanently remove the selected contacts from your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}