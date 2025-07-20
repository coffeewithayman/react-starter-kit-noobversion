import { google } from "googleapis";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Google Drive API scopes needed for audit functionality
const SCOPES = [
  "https://www.googleapis.com/auth/admin.directory.users.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file"
];

// Initialize Google Drive service with domain-wide delegation
const initializeDriveService = (domain: string, adminUser: string) => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    SCOPES,
    adminUser // Domain-wide delegation subject
  );

  return google.drive({ version: "v3", auth });
};

// Initialize Admin SDK for user directory access
const initializeAdminService = (domain: string, adminUser: string) => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    SCOPES,
    adminUser
  );

  return google.admin({ version: "directory_v1", auth });
};

// Get all users in the domain
export const getDomainUsers = action({
  args: {
    domain: v.string(),
    adminUser: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const admin = initializeAdminService(args.domain, args.adminUser);
      
      const users: any[] = [];
      let pageToken = undefined;
      
      do {
        const response = await admin.users.list({
          domain: args.domain,
          maxResults: 500,
          pageToken,
        });
        
        if (response.data.users) {
          users.push(...response.data.users);
        }
        
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      
      return users.map(user => ({
        email: user.primaryEmail,
        name: user.name?.fullName,
        id: user.id,
        suspended: user.suspended,
      }));
    } catch (error) {
      console.error("Error fetching domain users:", error);
      throw new Error(`Failed to fetch domain users: ${error.message}`);
    }
  },
});

// Get publicly shared files for a specific user
export const getPubliclySharedFiles = action({
  args: {
    domain: v.string(),
    adminUser: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const auth = new google.auth.JWT(
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!).client_email,
        undefined,
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!).private_key,
        SCOPES,
        args.userEmail // Impersonate this user
      );

      const drive = google.drive({ version: "v3", auth });
      
      const files: any[] = [];
      let pageToken = undefined;
      
      do {
        // Search for files that are publicly shared
        const response = await drive.files.list({
          q: "visibility='anyoneCanFind' or visibility='anyoneWithLink'",
          fields: "nextPageToken, files(id, name, webViewLink, modifiedTime, permissions, owners)",
          pageSize: 1000,
          pageToken,
        });
        
        if (response.data.files) {
          // Filter for files that are actually publicly accessible
          const publicFiles = response.data.files.filter(file => {
            return file.permissions?.some(permission => 
              permission.type === "anyone" || 
              (permission.type === "domain" && permission.domain === args.domain)
            );
          });
          
          files.push(...publicFiles);
        }
        
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        modifiedTime: file.modifiedTime,
        owner: file.owners?.[0]?.emailAddress || args.userEmail,
        permissions: file.permissions?.map(p => ({
          type: p.type,
          role: p.role,
          domain: p.domain,
        })),
      }));
    } catch (error) {
      console.error(`Error fetching files for ${args.userEmail}:`, error);
      throw new Error(`Failed to fetch files for ${args.userEmail}: ${error.message}`);
    }
  },
});

// Run a complete domain audit and store results
export const runDomainAudit = action({
  args: {
    domain: v.string(),
    adminUser: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get all domain users
      const users = await ctx.runAction(api.googleDrive.getDomainUsers, {
        domain: args.domain,
        adminUser: args.adminUser,
      });
      
      const auditResults = [];
      let totalFiles = 0;
      
      // Audit each user's files
      for (const user of users) {
        if (user.suspended) continue; // Skip suspended users
        
        try {
          const userFiles = await ctx.runAction(api.googleDrive.getPubliclySharedFiles, {
            domain: args.domain,
            adminUser: args.adminUser,
            userEmail: user.email,
          });
          
          totalFiles += userFiles.length;
          
          if (userFiles.length > 0) {
            auditResults.push({
              user: user.email,
              userName: user.name,
              fileCount: userFiles.length,
              files: userFiles,
            });
          }
        } catch (error) {
          console.error(`Failed to audit user ${user.email}:`, error);
          // Continue with other users even if one fails
        }
      }
      
      // Store audit results in database
      const auditId = await ctx.runMutation(api.googleDrive.storeAuditResults, {
        domain: args.domain,
        totalUsers: users.length,
        totalFiles,
        results: auditResults,
      });
      
      return {
        auditId,
        totalUsers: users.length,
        usersWithPublicFiles: auditResults.length,
        totalFiles,
        results: auditResults,
      };
    } catch (error) {
      console.error("Error running domain audit:", error);
      throw new Error(`Domain audit failed: ${error.message}`);
    }
  },
});

// Store audit results in the database
export const storeAuditResults = mutation({
  args: {
    domain: v.string(),
    totalUsers: v.number(),
    totalFiles: v.number(),
    results: v.any(),
  },
  handler: async (ctx, args) => {
    const auditId = await ctx.db.insert("driveAudits", {
      domain: args.domain,
      totalUsers: args.totalUsers,
      totalFiles: args.totalFiles,
      results: args.results,
      createdAt: Date.now(),
    });
    
    return auditId;
  },
});

// Get audit history
export const getAuditHistory = query({
  args: {
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let audits;
    
    if (args.domain) {
      audits = await ctx.db
        .query("driveAudits")
        .filter(q => q.eq(q.field("domain"), args.domain))
        .order("desc")
        .take(50);
    } else {
      audits = await ctx.db
        .query("driveAudits")
        .order("desc")
        .take(50);
    }
    
    return audits;
  },
});

// Get specific audit by ID
export const getAuditById = query({
  args: {
    auditId: v.id("driveAudits"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.auditId);
  },
});

// Create or update a drive connection for a user
export const createDriveConnection = mutation({
  args: {
    userId: v.string(),
    domain: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists
    const existing = await ctx.db
      .query("driveConnections")
      .filter(q => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("domain"), args.domain)
      ))
      .first();
    
    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        adminEmail: args.adminEmail,
        isActive: true,
      });
      return existing._id;
    } else {
      // Create new connection
      return await ctx.db.insert("driveConnections", {
        userId: args.userId,
        domain: args.domain,
        adminEmail: args.adminEmail,
        isActive: true,
        createdAt: Date.now(),
      });
    }
  },
});

// Get user's drive connections
export const getUserDriveConnections = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("driveConnections")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Deactivate a drive connection
export const deactivateDriveConnection = mutation({
  args: {
    connectionId: v.id("driveConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      isActive: false,
    });
  },
});

// Test Google Drive API connection
export const testDriveConnection = action({
  args: {
    domain: v.string(),
    adminUser: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required");
      }

      // Test admin SDK connection
      const admin = initializeAdminService(args.domain, args.adminUser);
      const testResponse = await admin.users.list({
        domain: args.domain,
        maxResults: 1,
      });
      
      return {
        success: true,
        message: "Successfully connected to Google Drive API",
        userCount: testResponse.data.users?.length || 0,
      };
    } catch (error) {
      console.error("Drive connection test failed:", error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  },
});