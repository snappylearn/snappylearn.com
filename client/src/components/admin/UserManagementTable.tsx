import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./DataTable";
import { CheckCircle, XCircle, Shield, User, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserWithTenant } from "@shared/schema";

export function UserManagementTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: users, isLoading } = useQuery<UserWithTenant[]>({
    queryKey: ["/api/admin/users", selectedTenant !== "all" ? selectedTenant : undefined, selectedStatus !== "all" ? selectedStatus === "active" : undefined],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant !== "all") params.append("tenantId", selectedTenant);
      if (selectedStatus !== "all") params.append("isActive", selectedStatus === "active" ? "true" : "false");
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ["/api/admin/tenants"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tenants");
      if (!response.ok) throw new Error("Failed to fetch tenants");
      return response.json();
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/${isActive ? 'activate' : 'deactivate'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const columns = [
    {
      key: 'email' as keyof UserWithTenant,
      label: 'Email',
      render: (value: string, user: UserWithTenant) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {user.firstName} {user.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'tenant' as keyof UserWithTenant,
      label: 'Tenant',
      render: (tenant: UserWithTenant['tenant']) => (
        <div className="flex flex-col">
          <span className="font-medium">{tenant?.name || 'No Tenant'}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tenant?.domain || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'role' as keyof UserWithTenant,
      label: 'Role',
      render: (role: string) => (
        <Badge variant="outline" className={getRoleColor(role)}>
          {getRoleIcon(role)}
          <span className="ml-1 capitalize">{role.replace('_', ' ')}</span>
        </Badge>
      ),
    },
    {
      key: 'isActive' as keyof UserWithTenant,
      label: 'Status',
      render: (isActive: boolean) => (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: 'createdAt' as keyof UserWithTenant,
      label: 'Created',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'id' as keyof UserWithTenant,
      label: 'Actions',
      render: (id: string, user: UserWithTenant) => (
        <div className="flex space-x-2">
          <Select
            value={user.role}
            onValueChange={(role) => updateUserRoleMutation.mutate({ userId: id, role })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          
          {user.isActive ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateUserStatusMutation.mutate({ userId: id, isActive: false })}
              disabled={updateUserStatusMutation.isPending}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateUserStatusMutation.mutate({ userId: id, isActive: true })}
              disabled={updateUserStatusMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <div className="flex space-x-2">
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants?.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={users || []}
          columns={columns}
          searchable={true}
          searchKey="email"
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}