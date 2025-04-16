import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mail, MessageSquare, Phone, FileText, LifeBuoy, BookOpen, Video } from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Help & Support</h1>
        <p className="text-gray-600">Find answers to your questions and learn how to use the platform</p>
      </div>
      
      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..." 
                className="pl-10 pr-4 py-6 text-lg"
              />
              <Button className="absolute right-1 top-1/2 -translate-y-1/2">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="guides" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Guides</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>Video Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Contact Support</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Guides Tab */}
        <TabsContent value="guides" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Learn the basics of the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="text-blue-600 hover:underline cursor-pointer">Platform overview</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Creating your first campaign</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Managing contacts</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Understanding analytics</li>
                </ul>
                <Button variant="ghost" className="w-full mt-4">View all articles</Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="h-40 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <LifeBuoy className="h-16 w-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle>Campaign Management</CardTitle>
                <CardDescription>Create and optimize your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="text-blue-600 hover:underline cursor-pointer">Campaign types and features</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Templates and customization</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Scheduling and automation</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">A/B testing campaigns</li>
                </ul>
                <Button variant="ghost" className="w-full mt-4">View all articles</Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="h-40 bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                <FileText className="h-16 w-16 text-white" />
              </div>
              <CardHeader>
                <CardTitle>Contact Management</CardTitle>
                <CardDescription>Organize and segment your contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="text-blue-600 hover:underline cursor-pointer">Importing contacts</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Creating contact groups</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Contact segmentation</li>
                  <li className="text-blue-600 hover:underline cursor-pointer">Maintaining contact data</li>
                </ul>
                <Button variant="ghost" className="w-full mt-4">View all articles</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Video Tutorials Tab */}
        <TabsContent value="tutorials" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-5 w-5 text-white fill-current ml-1" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
                <img src="https://via.placeholder.com/400x200?text=Getting+Started" alt="Video thumbnail" className="object-cover w-full h-full" />
              </div>
              <CardHeader>
                <CardTitle>Platform Introduction</CardTitle>
                <CardDescription>Duration: 8 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  A complete walkthrough of the platform's main features and capabilities.
                </p>
                <Button variant="outline" className="w-full">Watch now</Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-5 w-5 text-white fill-current ml-1" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
                <img src="https://via.placeholder.com/400x200?text=Campaign+Setup" alt="Video thumbnail" className="object-cover w-full h-full" />
              </div>
              <CardHeader>
                <CardTitle>Creating Effective Campaigns</CardTitle>
                <CardDescription>Duration: 15 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Learn how to create, schedule and optimize campaigns for maximum engagement.
                </p>
                <Button variant="outline" className="w-full">Watch now</Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-5 w-5 text-white fill-current ml-1" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
                <img src="https://via.placeholder.com/400x200?text=Analytics" alt="Video thumbnail" className="object-cover w-full h-full" />
              </div>
              <CardHeader>
                <CardTitle>Understanding Analytics</CardTitle>
                <CardDescription>Duration: 12 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Master the analytics dashboard to measure and improve campaign performance.
                </p>
                <Button variant="outline" className="w-full">Watch now</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="link" className="text-primary">View all tutorials</Button>
          </div>
        </TabsContent>
        
        {/* FAQ Tab */}
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create a new campaign?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      To create a new campaign, navigate to the Campaigns page and click the "Create Campaign" button. 
                      Fill in the campaign details including name, template, and target audience. You can schedule it 
                      immediately or save it for later launch.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I import contacts?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      You can import contacts by going to the Contacts page and clicking "Import Contacts". 
                      Our system supports CSV file imports. Make sure your CSV file has the required headers 
                      (name, mobile, email, etc). You can also create contacts individually by clicking 
                      "Add Contact".
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>What metrics should I track for my campaigns?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Key metrics to track include open rates, click-through rates, conversion rates, and 
                      engagement rates. The Analytics dashboard provides a comprehensive view of these metrics. 
                      Focus on trends over time rather than individual campaign performance for better insights.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>How can I segment my contacts?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      You can segment contacts by adding labels to them. Go to the Contacts page, select the 
                      contacts you want to segment, and add or update their labels. You can then target specific 
                      segments when creating campaigns by selecting the relevant label.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>What's the best time to send campaigns?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      The best time depends on your audience. Generally, weekday mornings (9-11 AM) and 
                      evenings (4-7 PM) tend to have higher engagement rates. Our analytics can help you 
                      determine the optimal time for your specific audience based on past campaign performance.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>How do I track campaign performance?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Track campaign performance in the Analytics section. You'll find detailed metrics for each 
                      campaign including delivery rates, open rates, click rates, and conversions. You can also 
                      compare campaigns against each other to identify successful strategies.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-7">
                  <AccordionTrigger>Can I schedule campaigns in advance?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Yes, when creating or editing a campaign, you can select the "Schedule for later" option 
                      which allows you to set a specific date and time for your campaign to be sent. This is 
                      useful for planning campaigns around specific events or optimal sending times.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contact Support Tab */}
        <TabsContent value="contact" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-center">Live Chat</CardTitle>
                <CardDescription className="text-center">
                  Chat with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Available Monday to Friday, 9am to 6pm GMT
                </p>
                <Button className="w-full">Start Chat</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-center">Email Support</CardTitle>
                <CardDescription className="text-center">
                  Send us an email anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  We respond to emails within 24 hours
                </p>
                <Button variant="outline" className="w-full">support@example.com</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-center">Phone Support</CardTitle>
                <CardDescription className="text-center">
                  Call our dedicated support line
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Available for premium customers
                </p>
                <Button variant="outline" className="w-full">+1 (555) 123-4567</Button>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input id="email" type="email" placeholder="your.email@example.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="How can we help you?" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea 
                    id="message" 
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-32"
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                
                <Button type="submit" className="w-full md:w-auto">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}