import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lightbulb, Search, FileText, Code, Calculator, MessageSquare } from "lucide-react";
const snappyLearnLogo = "/snappylearn-transparent-logo.png";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { ChatInput } from "@/components/chat-input";
import { ConversationCard } from "@/components/conversation-card";
import { useConversations, useCreateConversation } from "@/hooks/use-conversations";
import { useCollections } from "@/hooks/use-collections";
import { useArtifacts } from "@/hooks/use-artifacts";
import { Analytics } from "@/lib/analytics";
import { usePageView, useTrackAction } from "@/hooks/usePostHog";
import { AdminTestButton } from "@/components/admin/AdminTestButton";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  const { data: conversations = [] } = useConversations();
  const { data: collections = [] } = useCollections();
  const { data: artifacts = [] } = useArtifacts();
  const createConversation = useCreateConversation();
  const trackAction = useTrackAction();

  // Track page view using PostHog React SDK
  usePageView('dashboard');

  // Also track using the Analytics service for compatibility
  useEffect(() => {
    Analytics.trackPageView('dashboard');
  }, []);

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);
  const recentConversations = conversations.slice(0, 6);

  const handleCollectionSelect = (collectionId: number | undefined) => {
    setSelectedCollectionId(collectionId);
    if (collectionId) {
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
        Analytics.trackCollectionSelected(collectionId, collection.name);
      }
    }
  };

  const handleSendMessage = async (message: string, attachments?: File[]) => {
    const conversationType = selectedCollectionId ? "collection" : "independent";
    
    createConversation.mutate(
      {
        message,
        type: conversationType,
        collectionId: selectedCollectionId,
        attachments,
      },
      {
        onSuccess: (data) => {
          setLocation(`/conversations/${data.conversation.id}`);
        },
      }
    );
  };

  const handleNewChat = () => {
    setSelectedCollectionId(undefined);
  };

  const handleQuickAction = (action: string) => {
    const prompts = {
      "Get Ideas": "I need some creative ideas and suggestions. Can you help me brainstorm?",
      "Search Knowledge": "Help me search and find information from my knowledge base.",
      "Analyze Document": "I'd like to analyze and get insights from my documents."
    };
    
    // Track with both Analytics service and PostHog hooks
    Analytics.trackQuickAction(action);
    trackAction('quick_action_clicked', {
      action,
      location: 'dashboard'
    });
    
    if (prompts[action as keyof typeof prompts]) {
      handleSendMessage(prompts[action as keyof typeof prompts]);
    }
  };

  const quickActions = [
    { icon: Lightbulb, label: "Get Ideas", color: "text-yellow-500", action: "Get Ideas" },
    { icon: Search, label: "Search Knowledge", color: "text-blue-500", action: "Search Knowledge" },
    { icon: FileText, label: "Analyze Document", color: "text-green-500", action: "Analyze Document" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        selectedCollectionId={selectedCollectionId}
        onSelectCollection={handleCollectionSelect}
        onNewChat={handleNewChat}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full p-6 min-h-full">
          
          {/* Context Indicator */}
          {selectedCollection && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="text-sm font-medium text-blue-900">
                    Chatting with collection:
                  </span>
                  <span className="text-sm text-blue-700">{selectedCollection.name}</span>
                  <Button
                    onClick={() => setSelectedCollectionId(undefined)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 w-6 p-0 text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Welcome/Centered Chat */}
          <div className="flex flex-col items-center space-y-8 py-8">
            
            {/* Welcome Message */}
            <div className="text-center max-w-2xl">
              <img src={snappyLearnLogo} alt="SnappyLearn" className="w-24 h-24 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to SnappyLearn</h1>
              <p className="text-lg text-gray-600 mb-8">
                Your AI-powered knowledge companion. Start a conversation or explore your collections.
              </p>
              <AdminTestButton />
            </div>

            {/* Centered Chat Input */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={createConversation.isPending}
              placeholder={
                selectedCollection
                  ? `Ask about ${selectedCollection.name}...`
                  : "Ask me anything or select a collection for context-specific answers..."
              }
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              {quickActions.map((action, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  className="px-4 py-2"
                  onClick={() => handleQuickAction(action.action)}
                  disabled={createConversation.isPending}
                >
                  <action.icon className={`w-4 h-4 mr-2 ${action.color}`} />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Conversations Grid */}
          {recentConversations.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Conversations</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/conversations")}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentConversations.map((conversation) => (
                  <ConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
