import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Compass, 
  FolderOpen, 
  MessageSquare, 
  User, 
  Plus,
  Brain,
  BookOpen,
  Zap,
  Users,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommunityLayoutProps {
  children: ReactNode;
}

const snappyLearnLogo = "/snappylearn-transparent-logo.png";

export function CommunityLayout({ children }: CommunityLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      active: location === "/"
    },
    {
      name: "My Notebooks",
      href: "/my-collections",
      icon: FolderOpen,
      active: location === "/my-collections"
    },
    {
      name: "Discover",
      href: "/discover", 
      icon: Compass,
      active: location === "/discover"
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageSquare,
      active: location === "/chat"
    },
    {
      name: "Subscriptions",
      href: "/billing",
      icon: CreditCard,
      active: location === "/billing"
    }
  ];

  const toolsItems = [
    {
      name: "AI Research",
      icon: Brain,
      description: "Research assistant"
    },
    {
      name: "Study Notes",
      icon: BookOpen,
      description: "Smart note taking"
    },
    {
      name: "Quick Learn",
      icon: Zap,
      description: "Rapid learning"
    },
    {
      name: "Study Groups",
      icon: Users,
      description: "Collaborative learning"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Always Persistent */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.active ? "secondary" : "ghost"}
                  className="w-full justify-start h-10"
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Learning Tools Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 mb-3">
              <h3 className="text-sm font-medium text-gray-500">Learning Tools</h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {toolsItems.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <tool.icon className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500 truncate">{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName || user?.email || "User"}
              </div>
              <div className="text-xs text-gray-500">SnappyLearn Member</div>
            </div>
            <Link href="/profile">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <User className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}