import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose?: () => void;
}

interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const SidebarItem = ({ href, icon, children, isActive, className, ...props }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-sm",
          isActive 
            ? "bg-blue-50 text-primary font-medium border-l-4 border-primary" 
            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent",
          className
        )}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
        }}
        {...props}
      >
        <span className={cn("mr-3", isActive ? "text-primary" : "text-gray-500")}>
          {icon}
        </span>
        {children}
      </a>
    </Link>
  );
};

export function Sidebar({ isOpen, onClose, className, ...props }: SidebarProps) {
  const [location] = useLocation();

  // Get current path
  const currentPath = location.split("?")[0];
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50" 
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "bg-white border-r border-gray-200 w-64 flex-shrink-0 fixed md:sticky inset-y-0 left-0 z-40 md:z-0 transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen",
          className
        )}
        {...props}
      >
        <ScrollArea className="h-full py-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          
          <SidebarItem 
            href="/" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            } 
            isActive={currentPath === "/"}
          >
            Dashboard
          </SidebarItem>
          
          <SidebarItem 
            href="/contacts" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            } 
            isActive={currentPath === "/contacts"}
          >
            Contacts
          </SidebarItem>
          
          <SidebarItem 
            href="/campaigns" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            } 
            isActive={currentPath === "/campaigns"}
          >
            Campaigns
          </SidebarItem>
          
          <SidebarItem 
            href="/analytics" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            } 
            isActive={currentPath === "/analytics"}
          >
            Analytics
          </SidebarItem>
          
          <div className="px-4 py-2 mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Settings
          </div>
          
          <SidebarItem 
            href="/account" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M7 20.662V19c0-1.105.895-2 2-2h6c1.105 0 2 .895 2 2v1.662"></path>
              </svg>
            } 
            isActive={currentPath === "/account"}
          >
            Account
          </SidebarItem>
          
          <SidebarItem 
            href="/settings" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            } 
            isActive={currentPath === "/settings"}
          >
            Settings
          </SidebarItem>
          
          <SidebarItem 
            href="/help" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            } 
            isActive={currentPath === "/help"}
          >
            Help & Support
          </SidebarItem>
        </ScrollArea>
      </aside>
    </>
  );
}
