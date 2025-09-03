import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
  Timer
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { tasksApi } from "@/lib/api";
import type { Task, TaskRun } from "@shared/schema";

export default function TaskDetail() {
  const { id } = useParams();

  // Fetch task details
  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ['/api/tasks', id],
    queryFn: () => tasksApi.getById(parseInt(id!)),
    enabled: !!id,
  });

  // Fetch task runs
  const { data: taskRuns = [], isLoading: runsLoading } = useQuery<TaskRun[]>({
    queryKey: ['/api/tasks', id, 'runs'],
    queryFn: () => tasksApi.getRuns(parseInt(id!)),
    enabled: !!id,
  });

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (taskLoading) {
    return (
      <TwitterStyleLayout>
        <div>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  if (!task) {
    return (
      <TwitterStyleLayout>
        <div>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h1>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
            <Link href="/tasks">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  return (
    <TwitterStyleLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600">Task Details & Execution History</p>
          </div>
        </div>

        {/* Task Detail Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
                <CardDescription className="text-base">
                  {task.description || 'No description provided'}
                </CardDescription>
              </div>
              <Badge variant={task.isActive ? "default" : "secondary"}>
                {task.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Prompt */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">AI Prompt</h3>
              <p className="text-gray-700">{task.prompt}</p>
            </div>

            {/* Task Schedule & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Schedule</p>
                  <p className="text-gray-600">{task.schedule || 'Manual'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Last Run</p>
                  <p className="text-gray-600">{formatDateTime(task.lastRun)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Next Run</p>
                  <p className="text-gray-600">{formatDateTime(task.nextRun)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Runs Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Execution History</h2>
          
          {runsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : taskRuns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Timer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No executions yet</h3>
                <p className="text-gray-600">
                  This task hasn't been executed yet. Run it manually or wait for the scheduled execution.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {taskRuns.map((run) => (
                <Card key={run.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getStatusColor(run.status)} flex items-center gap-1`}>
                            {getStatusIcon(run.status)}
                            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(run.startTime)}
                          </span>
                          {run.duration && (
                            <span className="text-sm text-gray-600">
                              Duration: {formatDuration(run.duration)}
                            </span>
                          )}
                        </div>
                        
                        {run.output && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <h4 className="font-medium text-gray-900 mb-1">Output</h4>
                            <p className="text-gray-700 text-sm line-clamp-3">{run.output}</p>
                          </div>
                        )}
                        
                        {run.errorMessage && (
                          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <h4 className="font-medium text-red-900 mb-1">Error</h4>
                            <p className="text-red-700 text-sm">{run.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </TwitterStyleLayout>
  );
}