import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lightbulb, Search, FileText, Code, Calculator, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInput } from "@/components/chat-input";
import { ConversationCard } from "@/components/conversation-card";
import { useConversations, useCreateConversation } from "@/hooks/use-conversations";
import { useCollections } from "@/hooks/use-collections";
import { useArtifacts } from "@/hooks/use-artifacts";
import { Analytics } from "@/lib/analytics";
import { usePageView, useTrackAction } from "@/hooks/usePostHog";
import { AdminTestButton } from "@/components/admin/AdminTestButton";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  const { data: conversations = [] } = useConversations();
  const { data: collections = [] } = useCollections();
  const { data: artifacts = [] } = useArtifacts();
  const createConversation = useCreateConversation();
  const trackAction = useTrackAction();

  // Track page view using PostHog React SDK
  usePageView('chat');

  // Also track using the Analytics service for compatibility
  useEffect(() => {
    Analytics.trackPageView('chat');
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
    trackAction('quick_action_clicked', { action });
    
    const prompt = prompts[action as keyof typeof prompts];
    if (prompt) {
      handleSendMessage(prompt);
    }
  };

  const quickActions = [
    { label: "Get Ideas", icon: Lightbulb, color: "text-yellow-600" },
    { label: "Search Knowledge", icon: Search, color: "text-blue-600" },
    { label: "Analyze Document", icon: FileText, color: "text-green-600" }
  ];

  return (
    <UnifiedLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation History Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Conversations</h3>
              <div className="space-y-3">
                {recentConversations.length > 0 ? (
                  recentConversations.map((conversation) => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No conversations yet. Start a new chat below!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Section */}
        <div className="lg:col-span-2 space-y-6">

          {/* Collection Context */}
          {selectedCollection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Chatting with: {selectedCollection.name}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Your questions will be answered using documents from this collection
                  </p>
                </div>
                <Button variant="outline" onClick={handleNewChat} size="sm">
                  Switch to General Chat
                </Button>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <ChatInput 
              onSend={handleSendMessage}
              placeholder={
                selectedCollection 
                  ? `Ask a question about ${selectedCollection.name}...`
                  : "Ask me anything..."
              }
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50"
                  onClick={() => handleQuickAction(action.label)}
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          {recentConversations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/conversations")}
                  className="text-sm"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Educational Artifacts */}
          {artifacts.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Artifacts</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/artifacts")}
                  className="text-sm"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {artifacts.slice(0, 3).map((artifact: any) => (
                  <div key={artifact.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-2">
                      {artifact.type === 'code' && <Code className="h-4 w-4 text-blue-600" />}
                      {artifact.type === 'math' && <Calculator className="h-4 w-4 text-green-600" />}
                      {artifact.type === 'quiz' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                      <span className="text-sm font-medium text-gray-900">{artifact.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{artifact.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}