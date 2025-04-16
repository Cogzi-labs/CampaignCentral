import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import axios from "axios";

export default function EmailTestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  async function handleTestEmail() {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await axios.post("/api/test-email", { email });
      
      setResult({
        success: true,
        data: response.data
      });
      
      toast({
        title: "Test Completed",
        description: "Test email operation completed. Check the results below.",
      });
    } catch (error) {
      console.error("Test email error:", error);
      
      let errorMessage = "An unexpected error occurred";
      let errorDetails = null;
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = error.response.data;
      }
      
      setResult({
        success: false,
        error: errorMessage,
        details: errorDetails
      });
      
      toast({
        title: "Email Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Sending Test</CardTitle>
          <CardDescription>
            Test the email sending functionality to diagnose any issues with AWS SES.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter recipient email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {result && (
              <div className="mt-4 p-4 rounded border bg-muted">
                <h3 className="font-medium mb-2">Test Results:</h3>
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleTestEmail} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : "Send Test Email"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 max-w-md mx-auto text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">Common AWS SES Issues:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>The sender email ({process.env.SES_SENDER || "Not configured"}) needs to be verified in AWS SES</li>
          <li>The recipient email needs to be verified if your account is in the SES sandbox</li>
          <li>The AWS credentials need proper SES permissions</li>
          <li>There might be SES sending quotas or throttling</li>
        </ul>
      </div>
    </div>
  );
}