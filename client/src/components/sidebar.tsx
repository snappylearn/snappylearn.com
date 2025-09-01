import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Folder, MessageSquare, User, Settings, LogOut, Code, Calculator, Shield } from "lucide-react";
const snappyLearnIcon = "/favicon.png";
import { useCollections } from "@/hooks/use-collections";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/contexts/AuthContext";
import { CreateCollectionModal } from "./create-collection-modal";

interface SidebarProps {
  selectedCollectionId?: number;
  onSelectCollection?: (id: number | undefined) => void;
  onNewChat?: () => void;
}

export function Sidebar({ selectedCollectionId, onSelectCollection, onNewChat }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: collections = [] } = useCollections();
  const { data: conversations = [] } = useConversations();
  const { user, signOut, isAdmin } = useAuth();

  const recentConversations = conversations.slice(0, 5);

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      // Navigate to home/dashboard to start fresh
      setLocation("/");
    }
  };

  const handleLogout = async () => {
    await signOut();
  };



  const getCollectionColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600", 
      "bg-purple-100 text-purple-600",
      "bg-orange-100 text-orange-600",
      "bg-pink-100 text-pink-600",
      "bg-cyan-100 text-cyan-600"
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center justify-center">
            <img src="/snappylearn-sidebar-logo.png" alt="SnappyLearn" className="h-10 w-auto" />
          </Link>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          {/* Collections Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/collections"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Folder className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Collections
                </h3>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-white hover:bg-blue-500 rounded-full transition-all duration-200 cursor-pointer"
                title="Create new collection"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {collections.map((collection, index) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left ${
                    location === `/collections/${collection.id}` ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${getCollectionColor(index)}`}>
                    <Folder className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {collection.documentCount} documents
                    </p>
                  </div>
                </Link>
              ))}
              
              {collections.length === 0 && (
                <p className="text-xs text-gray-500 italic">No collections yet</p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Recent Chats Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/conversations"
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Recent Chats
                </h3>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="h-6 w-6 p-0 text-gray-500 hover:text-white hover:bg-green-500 rounded-full transition-all duration-200 cursor-pointer"
                title="Start new conversation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {recentConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    location === `/conversations/${conversation.id}` ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    conversation.type === 'collection' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {conversation.type === 'collection' ? (
                      <Folder className="w-3 h-3 text-blue-600" />
                    ) : (
                      <MessageSquare className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const date = new Date(conversation.updatedAt);
                        return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'No messages';
                      })()}
                    </p>
                  </div>
                </Link>
              ))}
              
              {recentConversations.length === 0 && (
                <p className="text-xs text-gray-500 italic">No recent chats</p>
              )}
            </div>
          </div>

          {/* Artifacts Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Link
                href="/artifacts"
                className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full ${
                  location === '/artifacts' ? 'bg-purple-50 border border-purple-200 text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Code className="w-5 h-5" />
                <span className="text-sm font-medium">Artifacts</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/artifacts")}
                className="h-6 w-6 p-0 text-gray-500 hover:text-white hover:bg-purple-500 ml-2 rounded-full transition-all duration-200 cursor-pointer"
                title="Create new artifact"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Admin Section */}
        {isAdmin && (
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/admin"
              className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full ${
                location === '/admin' ? 'bg-red-50 border border-red-200 text-red-600' : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Dashboard</span>
            </Link>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">SnappyLearn</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <CreateCollectionModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </>
  );
}
