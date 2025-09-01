import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Compass, 
  FolderOpen, 
  MessageSquare, 
  Sparkles,
  User,
  Settings,
  LogOut,
  Plus,
  Users,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface TwitterStyleLayoutProps {
  children: ReactNode;
}

const snappyLearnLogo = "/snappylearn-transparent-logo.png";

export function TwitterStyleLayout({ children }: TwitterStyleLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  // Left sidebar navigation items
  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "My Collections", href: "/collections", icon: FolderOpen },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
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

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: location === '/chat' || location.startsWith('/conversations/'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto flex">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
            </Link>
          </div>

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
              <Link href="/chat">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-medium rounded-full">
                  <Plus className="h-5 w-5 mr-2" />
                  Start Chat
                </Button>
              </Link>
            </div>
          </ScrollArea>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10">
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
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-2xl">
          <main className="py-6 px-4">
            {children}
          </main>
        </div>

        {/* Right Sidebar - Social Features */}
        <div className="w-80 bg-white border-l border-gray-200 h-screen sticky top-0">
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
                    <Link href="/chat">
                      <Button variant="link" className="w-full text-purple-600 text-sm">
                        Start new chat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

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
                    {/* Mock user topics - replace with real data */}
                    {[
                      { name: "AI Research", posts: 15, icon: TrendingUp },
                      { name: "Product Design", posts: 8, icon: BookOpen },
                      { name: "Leadership", posts: 12, icon: Users }
                    ].map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <topic.icon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                            <p className="text-xs text-gray-500">{topic.posts} posts</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="link" className="w-full text-purple-600 text-sm">
                      Explore more topics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topics.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Topics will appear here as content is created.
                    </p>
                  ) : (
                    topics.slice(0, 6).map((topic: any) => (
                      <div key={topic.id} className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-2 cursor-pointer hover:bg-purple-50"
                          style={{ 
                            borderColor: topic.color || '#6366f1',
                            color: topic.color || '#6366f1'
                          }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: topic.color || '#6366f1' }}
                          />
                          {topic.name}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          New
                        </span>
                      </div>
                    ))
                  )}
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

              {/* Trending Posts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Trending Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {posts.slice(0, 3).map((post: any, index: number) => (
                    <div key={post.id || index} className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {post.title || "Interesting discussion about the future of AI"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {post.stats?.likeCount || Math.floor(Math.random() * 100)} likes • {post.stats?.commentCount || Math.floor(Math.random() * 20)} comments
                      </p>
                    </div>
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

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}