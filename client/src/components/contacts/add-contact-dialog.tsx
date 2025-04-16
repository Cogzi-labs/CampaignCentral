import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { contactValidationSchema } from "@shared/schema";

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
import { Loader2 } from "lucide-react";

const formSchema = contactValidationSchema.extend({
  label: z.string().min(1, "Please select a label"),
});

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({ open, onOpenChange }: AddContactDialogProps) {
  const { toast } = useToast();
  const [useCustomLabel, setUseCustomLabel] = React.useState(false);
  const [customLabelValue, setCustomLabelValue] = React.useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mobile: "",
      location: "",
      label: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/contacts", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact created",
        description: "The contact was created successfully",
      });
      form.reset();
      setUseCustomLabel(false);
      setCustomLabelValue("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    contactMutation.mutate(values);
  };

  // Apply custom label to form when valid
  React.useEffect(() => {
    if (useCustomLabel && customLabelValue.trim()) {
      form.setValue("label", customLabelValue.trim());
    }
  }, [customLabelValue, useCustomLabel, form]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setUseCustomLabel(false);
      setCustomLabelValue("");
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Label Field - Split into two separate sections */}
              <div className="space-y-4">
                <FormItem className="space-y-1">
                  <FormLabel>Label</FormLabel>
                  
                  <div className="flex space-x-2 mb-2">
                    <Button 
                      type="button"
                      size="sm"
                      variant={!useCustomLabel ? "default" : "outline"}
                      onClick={() => setUseCustomLabel(false)}
                    >
                      Predefined
                    </Button>
                    <Button 
                      type="button"
                      size="sm"
                      variant={useCustomLabel ? "default" : "outline"}
                      onClick={() => setUseCustomLabel(true)}
                    >
                      Custom
                    </Button>
                  </div>
                </FormItem>
                
                {!useCustomLabel ? (
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a label" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Customer">Customer</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Subscriber">Subscriber</SelectItem>
                              <SelectItem value="VIP">VIP</SelectItem>
                              <SelectItem value="Prospect">Prospect</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter custom label"
                        value={customLabelValue}
                        onChange={(e) => setCustomLabelValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => {
                          if (customLabelValue.trim()) {
                            form.setValue("label", customLabelValue.trim());
                          }
                        }}
                        disabled={!customLabelValue.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    {form.formState.errors.label && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.label.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
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
                disabled={contactMutation.isPending}
              >
                {contactMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
