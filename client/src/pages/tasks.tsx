import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
  Settings as SettingsIcon
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function Tasks() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    prompt: "",
    schedule: "daily",
    isActive: true
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
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

  const handleCreateTask = () => {
    // TODO: API call to create task
    console.log("Creating task:", newTask);
    setCreateDialogOpen(false);
    setNewTask({
      title: "",
      description: "",
      prompt: "",
      schedule: "daily",
      isActive: true
    });
  };

  const handleToggleTask = (taskId: number) => {
    // TODO: API call to toggle task active status
    console.log("Toggling task:", taskId);
  };

  const handleRunTask = (taskId: number) => {
    // TODO: API call to manually run task
    console.log("Running task:", taskId);
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
        <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Tasks</h1>
            <p className="text-gray-600">Create and manage AI-powered automated tasks</p>
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newTask.isActive}
                    onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Start task immediately</Label>
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

        {/* Tasks List */}
        <div className="space-y-4">
          {sampleTasks.map((task) => (
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
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {sampleTasks.length === 0 && (
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