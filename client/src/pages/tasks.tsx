import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { tasksApi } from "@/lib/api";
import { 
  CheckSquare,
  Clock,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Zap,
  MoreHorizontal,
  Activity,
  TrendingUp
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import type { Task } from "@shared/schema";

export default function Tasks() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    prompt: "",
    schedule: "daily",
    isActive: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: tasksApi.getAll,
  });

  // Schedule options
  const scheduleOptions = [
    { value: "hourly", label: "Every Hour" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom" },
  ];

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setCreateDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        prompt: "",
        schedule: "daily",
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Task>) => 
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setEditingTask(null);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: tasksApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle task",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateTask = () => {
    if (!newTask.title.trim() || !newTask.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const handleUpdateTask = () => {
    if (!editingTask?.title.trim() || !editingTask?.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateTaskMutation.mutate(editingTask);
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleToggleTask = (taskId: number) => {
    toggleTaskMutation.mutate(taskId);
  };

  const handleRunTask = (taskId: number) => {
    toast({
      title: "Task Running",
      description: "Task has been queued for execution.",
    });
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScheduleDisplayText = (schedule: string | null) => {
    const option = scheduleOptions.find(opt => opt.value === schedule);
    return option?.label || 'Manual';
  };

  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  const activeTasks = tasks.filter(task => task.isActive).length;
  const totalRuns = 0; // This would come from task runs data
  const scheduledSlots = tasks.length;

  return (
    <TwitterStyleLayout>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Scheduled Tasks</h1>
            <p className="text-gray-600">
              Automate AI prompts that run on schedule and deliver results via email or in-app notifications
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Set up an automated AI task that runs on a schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={newTask.prompt}
                    onChange={(e) => setNewTask(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter the AI prompt to execute"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select value={newTask.schedule} onValueChange={(value) => setNewTask(prev => ({ ...prev, schedule: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title.trim() || !newTask.prompt.trim()}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{activeTasks}</p>
                  <p className="text-sm text-gray-600">active tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{totalRuns}/3</p>
                  <p className="text-sm text-gray-600">daily runs used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{scheduledSlots}/10</p>
                  <p className="text-sm text-gray-600">scheduled slots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                  Free Plan
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
              <Link href={`/tasks/${task.id}`} className="block">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-1 ${
                              task.isActive 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            {getScheduleDisplayText(task.schedule)}
                          </Badge>
                          <Badge 
                            className={`text-xs px-2 py-1 ${
                              task.isActive 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-300 text-gray-600'
                            }`}
                          >
                            {task.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-1">{task.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>Last run: {formatDateTime(task.lastRun)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Next run: {formatDateTime(task.nextRun)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRunTask(task.id);
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleTask(task.id);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        {task.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-16">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks created yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first automated AI task to get started with scheduled prompts and notifications.
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update your automated AI task settings.
              </DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Task Title</Label>
                  <Input
                    id="edit-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter task description"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-prompt">AI Prompt</Label>
                  <Textarea
                    id="edit-prompt"
                    value={editingTask.prompt}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                    placeholder="Enter the AI prompt to execute"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Select value={editingTask.schedule} onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, schedule: value } : null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isActive"
                      checked={editingTask.isActive}
                      onCheckedChange={(checked) => setEditingTask(prev => prev ? { ...prev, isActive: checked } : null)}
                    />
                    <Label htmlFor="edit-isActive" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Task is active
                    </Label>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} disabled={!editingTask?.title.trim() || !editingTask?.prompt.trim()}>
                Update Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TwitterStyleLayout>
  );
}