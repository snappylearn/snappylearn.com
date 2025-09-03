import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Compass, 
  FolderOpen, 
  MessageSquare, 
  Sparkles,
  User,
  CreditCard,
  LogOut,
  Plus,
  Users,
  BookOpen,
  TrendingUp,
  CheckSquare,
  Bot,
  Search,
  Bell,
  Settings,
  LogOut as LogOutIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface TwitterStyleLayoutProps {
  children: ReactNode;
  currentCollectionId?: number;
}

const snappyLearnLogo = "/snappylearn-new-logo.png";

export function TwitterStyleLayout({ children, currentCollectionId }: TwitterStyleLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch collections data for the sidebar
  const { data: collections = [] } = useQuery({
    queryKey: ['/api/collections'],
    enabled: !!user,
  });


  // Left sidebar navigation items
  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Notebooks", href: "/collections", icon: FolderOpen },
    { name: "Communities", href: "/communities", icon: Users },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Profile", href: "/profile", icon: User },
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

  // Fetch data for right sidebar
  const { data: topics = [] } = useQuery({
    queryKey: ['/api/topics'],
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['/api/posts'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: location === '/chat' || location.startsWith('/conversations/'),
  });

  return (
    <>
      {/* Full-width Header - placed outside any container */}
      <header className="fixed top-0 left-0 right-0 w-screen bg-white border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
            </Link>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search SnappyLearn"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-100 border-none rounded-full focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-600 rounded-full text-xs text-white flex items-center justify-center">
                  1
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 ring-2 ring-gray-200 hover:ring-purple-400 transition-all cursor-pointer">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Manage Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container with top padding for fixed header */}
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto flex">
          {/* Left Sidebar - Navigation */}
          <div className="w-64 min-w-[16rem] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-16">
          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActiveRoute(item.href) ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left h-12 text-base ${
                        isActiveRoute(item.href) 
                          ? "bg-purple-50 text-purple-700 border border-purple-200 font-medium" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Create Button */}
            <div className="p-4">
              <Link href={currentCollectionId ? `/chat?collectionId=${currentCollectionId}` : "/chat"}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-medium rounded-full">
                  <Plus className="h-5 w-5 mr-2" />
                  Start Chat
                </Button>
              </Link>
            </div>
          </ScrollArea>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500">SnappyLearn Member</p>
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

        {/* Main Content Area */}
        <div className="flex-1">
          <main className="py-6 px-4">
            {children}
          </main>
        </div>

        {/* Right Sidebar - Social Features */}
        <div className="w-80 min-w-[20rem] bg-white border-l border-gray-200 h-screen sticky top-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              
              {/* Recent Chats - show on chat page and conversation detail pages */}
              {(location === '/chat' || location.startsWith('/conversations/')) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Recent Chats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conversations.length > 0 ? (
                      conversations.slice(0, 3).map((conversation: any) => (
                        <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                          <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                              {conversation.title?.replace(/"/g, '') || 'Untitled Conversation'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conversation.type === 'collection' ? 'Collection Chat' : 'Independent Chat'} • {new Date(conversation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No conversations yet. Start a new chat!
                      </p>
                    )}
                    <Link href={currentCollectionId ? `/chat?collectionId=${currentCollectionId}` : "/chat"}>
                      <Button variant="link" className="w-full text-purple-600 text-sm">
                        Start new chat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Trending Posts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Trending Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {posts.slice(0, 3).map((post: any, index: number) => (
                    <Link key={post.id || index} href={`/posts/${post.id}`}>
                      <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {post.title || "Interesting discussion about the future of AI"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {post.viewCount || 0} views • {post.stats?.commentCount || 0} comments
                        </p>
                      </div>
                    </Link>
                  ))}
                  {posts.length === 0 && (
                    <>
                      <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          The Future of AI in Education
                        </p>
                        <p className="text-xs text-gray-500">42 likes • 8 comments</p>
                      </div>
                      <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          Building Better Learning Experiences
                        </p>
                        <p className="text-xs text-gray-500">28 likes • 5 comments</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Notebooks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Recent Notebooks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {collections.length > 0 ? (
                    collections.slice(0, 3).map((collection: any) => (
                      <div key={collection.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {collection.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {collection.documentCount || 0} documents
                            </p>
                          </div>
                        </div>
                        <Link href={`/collections/${collection.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No notebooks yet. Create your first notebook!
                    </p>
                  )}
                  <Link href="/collections">
                    <Button variant="link" className="w-full text-purple-600 text-sm">
                      View All Collections
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Who to Follow */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Who to follow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mock users - replace with real data */}
                  {[
                    { name: "Dr. Sarah Chen", handle: "@sarahchen", avatar: "/avatars/sarah.jpg", followers: "2.4K followers" },
                    { name: "Mark Rodriguez", handle: "@markrod", avatar: "/avatars/mark.jpg", followers: "1.8K followers" },
                    { name: "Alex Kim", handle: "@alexkim", avatar: "/avatars/alex.jpg", followers: "3.1K followers" }
                  ].map((person, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {person.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.followers}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full">
                        Follow
                      </Button>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-purple-600 text-sm">
                    Show more
                  </Button>
                </CardContent>
              </Card>

              {/* Recommended Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Recommended Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {topics.slice(0, 6).map((topic: any) => (
                      <Badge 
                        key={topic.id} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-purple-100 hover:text-purple-700"
                      >
                        {topic.name}
                      </Badge>
                    ))}
                    {topics.length === 0 && (
                      <>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">AI & Machine Learning</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">Startups</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">Design</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">Philosophy</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">Science</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">Education</Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Your Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Your Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Real user topics from database */}
                    {topics.slice(0, 3).map((topic: any) => (
                      <Link key={topic.id} href={`/topics/${topic.id}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                              <p className="text-xs text-gray-500">{topic.postCount || 0} posts</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Button variant="link" className="w-full text-purple-600 text-sm">
                      Explore more topics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Community</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Topics</span>
                    <span className="font-semibold">{topics.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active Today</span>
                    <span className="font-semibold">1</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        </div>
        </div>
      </div>
    </>
  );
}