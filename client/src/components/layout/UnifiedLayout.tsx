import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  MessageSquare,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/hooks/use-collections";


interface UnifiedLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
}

const snappyLearnLogo = "/snappylearn-new-logo.png";

export function UnifiedLayout({ children, showRightSidebar = false }: UnifiedLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: myCollections = [] } = useCollections();

  const topicTags = [
    "JavaScript", "React", "Machine Learning", "Data Science", 
    "Web Development", "AI", "Python", "Design Systems",
    "Note-taking", "Learning", "Philosophy", "Psychology"
  ];

  const recommendedUsers = [
    { name: "Jack Carney", handle: "@jackcarney", verified: false },
    { name: "Bobby Powers", handle: "@bobpowers", verified: true },
    { name: "Jyotsna Suthar", handle: "@jyotsna", verified: true }
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-40 w-full shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/">
                <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
              </Link>
              
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className={`px-4 py-2 rounded-lg transition-all ${isActiveRoute("/") ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg" : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"}`}>
                  Home
                </Link>
                <Link href="/my-collections" className={`px-4 py-2 rounded-lg transition-all ${isActiveRoute("/my-collections") ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg" : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"}`}>
                  My Collections
                </Link>
                <Link href="/discover" className={`px-4 py-2 rounded-lg transition-all ${isActiveRoute("/discover") ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg" : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"}`}>
                  Discover
                </Link>
                <Link href="/chat" className={`px-4 py-2 rounded-lg transition-all ${isActiveRoute("/chat") ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg" : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"}`}>
                  Chat
                </Link>
              </nav>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search SnappyLearn"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8 ring-2 ring-purple-200 hover:ring-purple-400 transition-all">
                <AvatarImage src={user && 'user_metadata' in user ? user.user_metadata?.avatar_url : (user as any)?.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {user && 'user_metadata' in user 
                    ? (user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U')
                    : ((user as any)?.firstName?.[0] || (user as any)?.lastName?.[0] || user?.email?.[0] || 'U')
                  }
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className={`grid grid-cols-1 gap-6 ${showRightSidebar ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6 w-full">
            {/* Your Topics */}
            <Card className="w-full gradient-card border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Your Topics</h3>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">Edit</Button>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="mr-2 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">All</Badge>
                  {myCollections.slice(0, 3).map(collection => (
                    <Badge key={collection.id} variant="outline" className="mr-2 mb-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                      {collection.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Topics */}
            <Card className="w-full gradient-card border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recommended Topics</h3>
                <div className="space-y-2">
                  {topicTags.slice(0, 6).map(tag => (
                    <Badge key={tag} variant="outline" className="mr-2 mb-2 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Who to Follow */}
            <Card className="w-full gradient-card border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Who to Follow</h3>
                <div className="space-y-3">
                  {recommendedUsers.map((recUser) => (
                    <div key={recUser.handle} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 ring-2 ring-purple-200">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                            {recUser.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-900">{recUser.name}</span>
                            {recUser.verified && (
                              <span className="text-purple-500 text-xs">✓</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{recUser.handle}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className={`space-y-6 ${showRightSidebar ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {children}
          </div>

          {/* Right Sidebar - Only show on home page */}
          {showRightSidebar && (
            <div className="lg:col-span-1 space-y-6 w-full">
              {/* Trending Topics */}
              <Card className="w-full gradient-card border-purple-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Trending Now</h3>
                  <div className="space-y-3">
                    {topicTags.slice(6, 10).map((tag, index) => (
                      <div key={tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                        <div>
                          <div className="font-medium text-gray-900">{tag}</div>
                          <div className="text-sm text-gray-500">{Math.floor(Math.random() * 1000)} highlights</div>
                        </div>
                        <div className="flex items-center text-purple-400">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card className="w-full gradient-card border-purple-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-semibold text-purple-700">12.4K</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <span className="text-gray-600">Active Today</span>
                      <span className="font-semibold text-purple-700">234</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <span className="text-gray-600">Highlights Shared</span>
                      <span className="font-semibold text-purple-700">1.2K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}