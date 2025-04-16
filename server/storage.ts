import { users, type User, type InsertUser, contacts, type Contact, type InsertContact, campaigns, type Campaign, type InsertCampaign, analytics, type Analytics, type InsertAnalytics } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact methods
  getContacts(accountId: number, filters?: ContactFilters): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  getContactByMobile(mobile: string, accountId: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  importContacts(contacts: InsertContact[], deduplicateByMobile: boolean): Promise<{ imported: number, duplicates: number }>;
  
  // Campaign methods
  getCampaigns(accountId: number, filters?: CampaignFilters): Promise<Campaign[]>;
  getCampaignById(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  launchCampaign(id: number): Promise<boolean>;
  
  // Analytics methods
  getAnalytics(accountId: number, campaignId?: number): Promise<Analytics[]>;
  createOrUpdateAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
}

// Filter types
export interface ContactFilters {
  search?: string;
  label?: string;
  location?: string;
  dateRange?: string;
}

export interface CampaignFilters {
  search?: string;
  status?: string;
  dateRange?: string;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private campaigns: Map<number, Campaign>;
  private analyticsData: Map<number, Analytics>;
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private contactCurrentId: number;
  private campaignCurrentId: number;
  private analyticsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.campaigns = new Map();
    this.analyticsData = new Map();
    
    this.userCurrentId = 1;
    this.contactCurrentId = 1;
    this.campaignCurrentId = 1;
    this.analyticsCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // CONTACT METHODS
  async getContacts(accountId: number, filters?: ContactFilters): Promise<Contact[]> {
    let contacts = Array.from(this.contacts.values()).filter(
      (contact) => contact.accountId === accountId
    );
    
    if (filters) {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        contacts = contacts.filter(contact => 
          contact.name.toLowerCase().includes(searchTerm) || 
          contact.mobile.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.label) {
        contacts = contacts.filter(contact => contact.label === filters.label);
      }
      
      if (filters.location) {
        contacts = contacts.filter(contact => contact.location === filters.location);
      }
      
      if (filters.dateRange) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'last-week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'last-month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'last-year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        contacts = contacts.filter(contact => 
          new Date(contact.createdAt) >= startDate
        );
      }
    }
    
    return contacts;
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactByMobile(mobile: string, accountId: number): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(
      (contact) => contact.mobile === mobile && contact.accountId === accountId
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactCurrentId++;
    const createdAt = new Date();
    const contact: Contact = { ...insertContact, id, createdAt };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...updateData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async importContacts(contacts: InsertContact[], deduplicateByMobile: boolean): Promise<{ imported: number, duplicates: number }> {
    let imported = 0;
    let duplicates = 0;
    
    for (const contact of contacts) {
      if (deduplicateByMobile) {
        const existing = await this.getContactByMobile(contact.mobile, contact.accountId);
        if (existing) {
          duplicates++;
          continue;
        }
      }
      
      await this.createContact(contact);
      imported++;
    }
    
    return { imported, duplicates };
  }

  // CAMPAIGN METHODS
  async getCampaigns(accountId: number, filters?: CampaignFilters): Promise<Campaign[]> {
    let campaigns = Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.accountId === accountId
    );
    
    if (filters) {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        campaigns = campaigns.filter(campaign => 
          campaign.name.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.status) {
        campaigns = campaigns.filter(campaign => campaign.status === filters.status);
      }
      
      if (filters.dateRange) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'last-week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'last-month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'last-year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        campaigns = campaigns.filter(campaign => 
          new Date(campaign.createdAt) >= startDate
        );
      }
    }
    
    return campaigns;
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignCurrentId++;
    const createdAt = new Date();
    const campaign: Campaign = { 
      ...insertCampaign, 
      id,
      status: "draft", 
      createdAt
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, updateData: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...updateData };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }
  
  async launchCampaign(id: number): Promise<boolean> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return false;
    
    const updatedCampaign = { ...campaign, status: "active" };
    this.campaigns.set(id, updatedCampaign);
    
    // Create initial analytics entry
    await this.createOrUpdateAnalytics({
      campaignId: id,
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      accountId: campaign.accountId
    });
    
    return true;
  }

  // ANALYTICS METHODS
  async getAnalytics(accountId: number, campaignId?: number): Promise<Analytics[]> {
    let analytics = Array.from(this.analyticsData.values()).filter(
      (analytics) => analytics.accountId === accountId
    );
    
    if (campaignId) {
      analytics = analytics.filter(a => a.campaignId === campaignId);
    }
    
    return analytics;
  }

  async createOrUpdateAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    // Check if we already have analytics for this campaign
    const existing = Array.from(this.analyticsData.values()).find(
      a => a.campaignId === insertAnalytics.campaignId
    );
    
    if (existing) {
      const updated = { 
        ...existing, 
        ...insertAnalytics,
        updatedAt: new Date()
      };
      this.analyticsData.set(existing.id, updated);
      return updated;
    }
    
    // Create new analytics
    const id = this.analyticsCurrentId++;
    const updatedAt = new Date();
    const analytics: Analytics = { ...insertAnalytics, id, updatedAt };
    this.analyticsData.set(id, analytics);
    return analytics;
  }
}

export const storage = new MemStorage();
