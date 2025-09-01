import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Building, 
  Activity, 
  ShieldCheck, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { TenantDialog } from "@/components/admin/TenantDialog";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AuditLogsTable } from "@/components/admin/AuditLogsTable";
import { useState } from "react";
import type { AdminDashboardStats, TenantWithStats } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);
  const [showTenantDialog, setShowTenantDialog] = useState(false);

  // Fetch admin dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user
  });

  // Fetch tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery<TenantWithStats[]>({
    queryKey: ["/api/admin/tenants"],
    enabled: !!user
  });

  // Tenant activation/deactivation mutations
  const activateTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/admin/tenants/${tenantId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to activate tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    }
  });

  const deactivateTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/admin/tenants/${tenantId}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to deactivate tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    }
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tenants, users, and system settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Admin Access
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCollections || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalDocuments || 0} documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newUsersThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tenant Management</h2>
            <Button onClick={() => setShowTenantDialog(true)}>
              Add New Tenant
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tenants?.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{tenant.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tenant.domain}
                          </p>
                        </div>
                        <Badge variant={tenant.isActive ? "default" : "destructive"}>
                          {tenant.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {tenant.plan}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {tenant.userCount} users • {tenant.collectionCount} collections
                        </div>
                        <div className="flex space-x-2">
                          {tenant.isActive ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deactivateTenantMutation.mutate(tenant.id)}
                              disabled={deactivateTenantMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => activateTenantMutation.mutate(tenant.id)}
                              disabled={activateTenantMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <UserManagementTable />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
            <AuditLogsTable />
          </div>
        </TabsContent>
      </Tabs>

      {/* Tenant Dialog */}
      <TenantDialog 
        open={showTenantDialog} 
        onOpenChange={setShowTenantDialog}
        tenant={selectedTenant}
      />
    </div>
  );
}