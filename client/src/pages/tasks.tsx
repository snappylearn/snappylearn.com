import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings as SettingsIcon,
  Mail,
  Search,
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
    emailNotifications: false,
    useDeepSearch: false
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: tasksApi.getAll,
  });

  // Sample tasks data for demo
  const sampleTasks = [
    {
      id: 1,
      title: "Daily Market Summary",
      description: "Generate a daily summary of AI and tech market trends",
      prompt: "Analyze the latest AI and technology market trends from the past 24 hours. Include key developments, funding news, and breakthrough announcements. Format as a concise summary with bullet points.",
      schedule: "daily",
      isActive: true,
      emailNotifications: true,
      useDeepSearch: true,
      lastRun: "2024-01-15T08:00:00Z",
      nextRun: "2024-01-16T08:00:00Z",
      createdAt: "2024-01-10T10:00:00Z"
    },
    {
      id: 2,
      title: "Weekly Research Digest",
      description: "Compile top AI research papers from the week",
      prompt: "Create a weekly digest of the most important AI research papers published in the last 7 days. Include paper titles, authors, key findings, and potential implications. Focus on breakthrough results.",
      schedule: "weekly",
      isActive: true,
      emailNotifications: false,
      useDeepSearch: true,
      lastRun: "2024-01-14T09:00:00Z",
      nextRun: "2024-01-21T09:00:00Z",
      createdAt: "2024-01-01T09:00:00Z"
    },
    {
      id: 3,
      title: "Content Ideas Generator",
      description: "Generate content ideas for social media posts",
      prompt: "Generate 5 engaging content ideas for social media posts about AI, technology, and innovation. Include suggested hashtags and posting times. Make them educational yet accessible.",
      schedule: "twice-weekly",
      isActive: false,
      emailNotifications: true,
      useDeepSearch: false,
      lastRun: "2024-01-12T14:00:00Z",
      nextRun: "2024-01-16T14:00:00Z",
      createdAt: "2024-01-05T14:00:00Z"
    }
  ];

  const scheduleOptions = [
    { value: "hourly", label: "Every Hour" },
    { value: "daily", label: "Daily" },
    { value: "twice-weekly", label: "Twice Weekly" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      setCreateDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        prompt: "",
        schedule: "daily",
        isActive: true,
        emailNotifications: false,
        useDeepSearch: false
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
      setEditingTask(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle task mutation
  const toggleTaskMutation = useMutation({
    mutationFn: tasksApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task status updated!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to toggle task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }
    if (!newTask.prompt.trim()) {
      toast({
        title: "Error",
        description: "AI prompt is required",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      title: newTask.title,
      description: newTask.description,
      prompt: newTask.prompt,
      schedule: newTask.schedule,
      isActive: newTask.isActive,
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    
    updateTaskMutation.mutate({
      id: editingTask.id,
      data: {
        title: editingTask.title,
        description: editingTask.description,
        prompt: editingTask.prompt,
        schedule: editingTask.schedule,
        isActive: editingTask.isActive,
      }
    });
  };

  const handleToggleTask = (taskId: number) => {
    toggleTaskMutation.mutate(taskId);
  };

  const handleRunTask = (taskId: number) => {
    // TODO: API call to manually run task
    console.log("Running task:", taskId);
    toast({
      title: "Task Running",
      description: "Task has been queued for execution.",
    });
  };


  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getScheduleBadgeColor = (schedule: string) => {
    switch (schedule) {
      case "hourly": return "bg-red-100 text-red-800";
      case "daily": return "bg-blue-100 text-blue-800";
      case "weekly": return "bg-green-100 text-green-800";
      case "monthly": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
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

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Tasks</h1>
            <p className="text-gray-600 mb-4">Automate AI prompts that run on schedule and deliver results via email or in-app notifications</p>
            
            {/* Usage Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                <strong>3</strong> active tasks
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <strong>2/3</strong> daily runs used
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <strong>8/10</strong> scheduled slots
              </span>
              <Badge variant="outline" className="text-xs">Free Plan</Badge>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
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
                    placeholder="Describe what this task does"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={newTask.prompt}
                    onChange={(e) => setNewTask(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter the prompt for the AI to execute"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select 
                    value={newTask.schedule} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, schedule: value }))}
                  >
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newTask.isActive}
                      onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="active">Start task immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={newTask.emailNotifications}
                      onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                    <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useDeepSearch"
                      checked={newTask.useDeepSearch}
                      onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, useDeepSearch: checked }))}
                    />
                    <Label htmlFor="useDeepSearch" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Use DeepSearch for enhanced results
                    </Label>
                  </div>
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

        {/* Edit Task Dialog */}
        <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
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

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
                      <Badge className={getScheduleBadgeColor(task.schedule)}>
                        <Clock className="h-3 w-3 mr-1" />
                        {scheduleOptions.find(opt => opt.value === task.schedule)?.label}
                      </Badge>
                      <Badge variant={task.isActive ? "default" : "secondary"}>
                        {task.isActive ? "Active" : "Paused"}
                      </Badge>
                      {task.emailNotifications && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {task.useDeepSearch && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <Search className="h-3 w-3 mr-1" />
                          DeepSearch
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base mb-3">
                      {task.description}
                    </CardDescription>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <Label className="text-xs font-medium text-gray-600 mb-1 block">AI Prompt</Label>
                      <p className="text-sm text-gray-700 line-clamp-2">{task.prompt}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last run: {formatDateTime(task.lastRun)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Next run: {formatDateTime(task.nextRun)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunTask(task.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      {task.isActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No tasks created yet</h3>
            <p className="text-gray-500 mb-4">Create your first automated AI task to get started</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </div>
        )}
      </div>
    </TwitterStyleLayout>
  );
}