import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "./DataTable";
import { Activity, User, Building, FileText, Settings } from "lucide-react";
import type { AdminAuditLog } from "@shared/schema";

export function AuditLogsTable() {
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedTarget, setSelectedTarget] = useState<string>("all");

  const { data: auditLogs, isLoading } = useQuery<AdminAuditLog[]>({
    queryKey: ["/api/admin/audit-logs", selectedAction, selectedTarget],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAction !== "all") params.append("action", selectedAction);
      if (selectedTarget !== "all") params.append("targetType", selectedTarget);
      params.append("limit", "100");
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />;
    if (action.includes('tenant')) return <Building className="h-4 w-4" />;
    if (action.includes('collection')) return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (action.includes('delete') || action.includes('deactivate')) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (action.includes('update') || action.includes('activate')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'tenant':
        return <Building className="h-4 w-4" />;
      case 'collection':
        return <FileText className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const formatActionDescription = (log: AdminAuditLog) => {
    const { action, targetType, details } = log;
    const actionWords = action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const targetName = details?.tenantName || details?.email || details?.name || `${targetType} ${log.targetId}`;
    
    return `${actionWords} ${targetType}: ${targetName}`;
  };

  const columns = [
    {
      key: 'createdAt' as keyof AdminAuditLog,
      label: 'Timestamp',
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(date).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      key: 'action' as keyof AdminAuditLog,
      label: 'Action',
      render: (action: string) => (
        <Badge variant="outline" className={getActionColor(action)}>
          {getActionIcon(action)}
          <span className="ml-1 capitalize">{action.replace(/_/g, ' ')}</span>
        </Badge>
      ),
    },
    {
      key: 'targetType' as keyof AdminAuditLog,
      label: 'Target',
      render: (targetType: string, log: AdminAuditLog) => (
        <div className="flex items-center space-x-2">
          {getTargetIcon(targetType)}
          <div className="flex flex-col">
            <span className="font-medium capitalize">{targetType}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {log.targetId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'adminId' as keyof AdminAuditLog,
      label: 'Admin',
      render: (adminId: string) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="text-sm">{adminId}</span>
        </div>
      ),
    },
    {
      key: 'details' as keyof AdminAuditLog,
      label: 'Description',
      render: (details: any, log: AdminAuditLog) => (
        <div className="max-w-md">
          <p className="text-sm">{formatActionDescription(log)}</p>
          {details && Object.keys(details).length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
              <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ),
    },
  ];

  // Extract unique actions and targets for filters
  const uniqueActions = [...new Set(auditLogs?.map(log => log.action) || [])];
  const uniqueTargets = [...new Set(auditLogs?.map(log => log.targetType) || [])];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audit Logs</CardTitle>
          <div className="flex space-x-2">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {uniqueTargets.map((target) => (
                  <SelectItem key={target} value={target}>
                    {target.charAt(0).toUpperCase() + target.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={auditLogs || []}
          columns={columns}
          searchable={false}
          isLoading={isLoading}
          pageSize={20}
        />
      </CardContent>
    </Card>
  );
}