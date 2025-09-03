import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Share, Bookmark, MoreVertical, ChevronLeft, X, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "@/components/chat-input";
import { MessageComponent } from "@/components/message";
import { ChatLoading } from "@/components/chat-loading";
import { ArtifactViewer } from "@/components/artifact-viewer";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { useConversation } from "@/hooks/use-conversations";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useCollection } from "@/hooks/use-collections";

export default function Conversation() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const conversationId = parseInt(params.id!);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Artifact state management
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<{html: string, title: string} | null>(null);
  const [showArtifactToggle, setShowArtifactToggle] = useState(false);

  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [] } = useMessages(conversationId);
  
  // Check if we're waiting for AI response (only user messages exist)
  const isWaitingForAI = messages.length > 0 && 
    messages[messages.length - 1]?.role === 'user' && 
    !messages.some(m => m.role === 'assistant');
  const { data: collection } = useCollection(conversation?.collectionId || 0);
  const sendMessage = useSendMessage();

  // Debug logging
  console.log('Conversation data:', conversation);
  console.log('Collection ID:', conversation?.collectionId);
  console.log('Collection data:', collection);

  const handleSendMessage = (content: string) => {
    sendMessage.mutate({ conversationId, content });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewArtifact = (artifactHtml: string, title: string) => {
    setCurrentArtifact({ html: artifactHtml, title });
    setShowArtifactToggle(true);
    setIsArtifactOpen(true);
  };

  const openArtifact = () => {
    if (currentArtifact) {
      setIsArtifactOpen(true);
    }
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
    setCurrentArtifact(null);
    setShowArtifactToggle(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if any messages contain artifacts to show toggle
  useEffect(() => {
    const hasArtifacts = messages.some(message => 
      message.role === 'assistant' && message.content.includes('[ARTIFACT_START]')
    );
    if (hasArtifacts && !showArtifactToggle) {
      setShowArtifactToggle(true);
    }
  }, [messages, showArtifactToggle]);

  if (!conversation) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
            <Button onClick={() => setLocation("/")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  const isCollectionBased = conversation.type === "collection";

  return (
    <TwitterStyleLayout currentCollectionId={conversation?.collectionId}>
      <div className={`flex flex-col h-screen ${isArtifactOpen ? 'md:mr-[50%]' : ''} transition-all duration-300`}>
        {/* Header */}
        <header className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation("/chat")}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{conversation.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isCollectionBased ? "bg-blue-500" : "bg-gray-500"
                  }`} />
                  {isCollectionBased && collection ? (
                    <button
                      onClick={() => setLocation(`/collections/${collection.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {collection.name}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Independent Conversation
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <Share className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6 pb-4">
              {messages.map((message) => (
                <MessageComponent 
                  key={message.id} 
                  message={message} 
                  onViewArtifact={handleViewArtifact}
                />
              ))}
              {(sendMessage.isPending || isWaitingForAI) && <ChatLoading />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white">
          <ChatInput
            onSend={handleSendMessage}
            disabled={sendMessage.isPending}
            placeholder="Continue the conversation..."
          />
        </div>
      </div>

      {/* Artifact Toggle Button */}
      {showArtifactToggle && !isArtifactOpen && (
        <Button
          onClick={openArtifact}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-600 z-40 transition-all duration-300 hover:transform hover:-translate-x-1"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Artifact Viewer */}
      {currentArtifact && (
        <ArtifactViewer
          artifact={currentArtifact}
          onClose={closeArtifact}
          isOpen={isArtifactOpen}
        />
      )}
    </TwitterStyleLayout>
  );
}
