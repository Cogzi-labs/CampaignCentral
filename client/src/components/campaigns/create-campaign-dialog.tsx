import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { campaignValidationSchema } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const formSchema = campaignValidationSchema.extend({
  template: z.string().min(1, "Please select a template"),
  contactLabel: z.string().optional(),
  scheduleForLater: z.boolean().default(false),
});

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  
  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: open,
  });

  // Fetch contacts (for contact labels)
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: open,
  });
  
  // Extract unique labels from contacts
  const uniqueLabels = React.useMemo(() => {
    if (!Array.isArray(contacts)) return [];
    const labels = contacts.map((contact: any) => contact.label);
    return Array.from(new Set(labels.filter(Boolean)));
  }, [contacts]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      template: "",
      contactLabel: "",
      scheduleForLater: false,
    },
  });

  const campaignMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Remove scheduleForLater as it's not part of the campaign schema
      const { scheduleForLater, ...campaignData } = values;
      
      const res = await apiRequest("POST", "/api/campaigns", campaignData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign created",
        description: "The campaign was created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    campaignMutation.mutate(values);
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Promotion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(templates) ? templates.map((template: any) => (
                        <SelectItem key={template.id || `template-${template.name}`} value={template.id || `id-${template.name}`}>
                          {template.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Label</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All Contacts" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key="all" value="all">All Contacts</SelectItem>
                      {uniqueLabels.map((label: string) => 
                        // Make sure we never have an empty string value
                        label && label.trim() !== "" ? (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduleForLater"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Schedule for later</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={campaignMutation.isPending}
              >
                {campaignMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Campaign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper to prevent code duplication
import { getQueryFn } from "@/lib/queryClient";
