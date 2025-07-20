import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useUser } from "@clerk/react-router";
import { api } from "convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "sonner";
import { IconSearch, IconShield, IconClock, IconExternalLink, IconSettings } from "@tabler/icons-react";

export default function DriveAudit() {
  const { user } = useUser();
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  
  // Convex queries and mutations
  const connections = useQuery(api.googleDrive.getUserDriveConnections, 
    user ? { userId: user.id } : "skip"
  );
  const auditHistory = useQuery(api.googleDrive.getAuditHistory, {});
  const createConnection = useMutation(api.googleDrive.createDriveConnection);
  const testConnection = useAction(api.googleDrive.testDriveConnection);
  const runAudit = useAction(api.googleDrive.runDomainAudit);

  const handleCreateConnection = async () => {
    if (!user || !domain || !adminEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Test the connection first
      const testResult = await testConnection({ domain, adminUser: adminEmail });
      
      if (!testResult.success) {
        toast.error(`Connection test failed: ${testResult.message}`);
        return;
      }

      // Create the connection
      await createConnection({
        userId: user.id,
        domain,
        adminEmail,
      });

      toast.success("Google Drive connection created successfully!");
      setDomain("");
      setAdminEmail("");
    } catch (error) {
      console.error("Failed to create connection:", error);
      toast.error("Failed to create connection. Please check your credentials.");
    }
  };

  const handleRunAudit = async (connectionDomain: string, connectionAdminEmail: string) => {
    if (!user) return;

    setIsRunningAudit(true);
    try {
      const result = await runAudit({
        domain: connectionDomain,
        adminUser: connectionAdminEmail,
      });

      toast.success(
        `Audit completed! Found ${result.totalFiles} public files across ${result.usersWithPublicFiles} users.`
      );
    } catch (error) {
      console.error("Audit failed:", error);
      toast.error("Audit failed. Please check your connection and try again.");
    } finally {
      setIsRunningAudit(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Drive Security Audit</h1>
        <p className="text-muted-foreground">
          Audit your Google Workspace for publicly shared files and security vulnerabilities.
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">
            <IconSettings className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="audit">
            <IconSearch className="w-4 h-4 mr-2" />
            Run Audit
          </TabsTrigger>
          <TabsTrigger value="history">
            <IconClock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Connections</CardTitle>
              <CardDescription>
                Set up domain-wide access to your Google Workspace for security auditing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreateConnection} disabled={!domain || !adminEmail}>
                Create Connection
              </Button>
            </CardContent>
          </Card>

          {connections && connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div key={connection._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{connection.domain}</div>
                        <div className="text-sm text-muted-foreground">{connection.adminEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(connection.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connection.isActive ? "default" : "secondary"}>
                          {connection.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleRunAudit(connection.domain, connection.adminEmail)}
                          disabled={isRunningAudit || !connection.isActive}
                        >
                          Run Audit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="w-5 h-5" />
                Security Audit
              </CardTitle>
              <CardDescription>
                Run a comprehensive security audit to find publicly shared files in your domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections && connections.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a connection to run an audit. The audit will scan all users in your domain
                    and identify files that are publicly accessible.
                  </p>
                  <div className="grid gap-3">
                    {connections
                      .filter(conn => conn.isActive)
                      .map((connection) => (
                        <div key={connection._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{connection.domain}</div>
                            <div className="text-sm text-muted-foreground">
                              Admin: {connection.adminEmail}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRunAudit(connection.domain, connection.adminEmail)}
                            disabled={isRunningAudit}
                          >
                            {isRunningAudit ? "Running..." : "Start Audit"}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconSettings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Connections Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to set up a Google Drive connection first.
                  </p>
                  <Button onClick={() => document.querySelector('[value="connections"]')?.click()}>
                    Set Up Connection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                View past security audits and their results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditHistory && auditHistory.length > 0 ? (
                <div className="space-y-4">
                  {auditHistory.map((audit) => (
                    <div key={audit._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{audit.domain}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(audit.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">{audit.totalFiles}</div>
                          <div className="text-xs text-muted-foreground">Public Files</div>
                        </div>
                      </div>
                      <Separator className="mb-3" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Users</div>
                          <div className="font-medium">{audit.totalUsers}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Users with Public Files</div>
                          <div className="font-medium">
                            {audit.results?.length || 0}
                          </div>
                        </div>
                      </div>
                      {audit.results && audit.results.length > 0 && (
                        <div className="mt-4">
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                              View Details
                            </summary>
                            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                              {audit.results.map((userResult: any, index: number) => (
                                <div key={index} className="text-xs border rounded p-2">
                                  <div className="font-medium">{userResult.user}</div>
                                  <div className="text-muted-foreground">
                                    {userResult.fileCount} public files
                                  </div>
                                  {userResult.files?.slice(0, 3).map((file: any, fileIndex: number) => (
                                    <div key={fileIndex} className="ml-2 mt-1 flex items-center gap-1">
                                      <span className="truncate">{file.name}</span>
                                      {file.webViewLink && (
                                        <a
                                          href={file.webViewLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          <IconExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                  {userResult.files?.length > 3 && (
                                    <div className="ml-2 text-muted-foreground">
                                      +{userResult.files.length - 3} more files
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconClock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Audit History</h3>
                  <p className="text-muted-foreground">
                    Run your first audit to see results here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}