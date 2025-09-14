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
  Settings, 
  Plus,
  LogOut,
  User,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

const snappyLearnLogo = "/snappylearn-transparent-logo.png";

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "My Collections", href: "/my-collections", icon: FolderOpen },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Subscriptions", href: "/billing", icon: CreditCard },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center justify-center">
            <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActiveRoute(item.href) ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left ${
                      isActiveRoute(item.href) 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Create Collection Button */}
          <div className="p-4">
            <Link href="/collections">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </Link>
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user as any)?.profileImageUrl} />
              <AvatarFallback>
                {((user as any)?.firstName?.[0] || (user as any)?.lastName?.[0] || user?.email?.[0] || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(user as any)?.firstName && (user as any)?.lastName 
                  ? `${(user as any)?.firstName} ${(user as any)?.lastName}`
                  : user?.email
                }
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex-1">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="flex-1" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}