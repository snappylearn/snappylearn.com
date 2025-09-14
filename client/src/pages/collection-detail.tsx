import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { File, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddDocumentDropdown } from "@/components/add-document-dropdown";
import { ChatInput } from "@/components/chat-input";
import { ConversationCard } from "@/components/conversation-card";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { useCollection } from "@/hooks/use-collections";
import { useCreateConversation, useConversations } from "@/hooks/use-conversations";
import { documentsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithPreview } from "@shared/schema";

export default function CollectionDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();

  const collectionId = parseInt(params.id!);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  // Only redirect if we're definitely not authenticated after loading
  if (!isLoading && !isAuthenticated) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-sm text-gray-500 mb-4">Please sign in to view this collection.</p>
            <Button onClick={() => setLocation("/")} className="bg-purple-600 hover:bg-purple-700">
              Go to Home
            </Button>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }
  
  const { data: collection, isLoading: collectionLoading, error: collectionError } = useCollection(collectionId);
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/collections", collectionId, "documents"],
    queryFn: () => documentsApi.getByCollection(collectionId),
    enabled: !!collectionId && isAuthenticated,
  });
  
  const { data: conversations = [] } = useConversations();
  const createConversation = useCreateConversation();

  // Filter conversations to only show those belonging to this specific collection
  const collectionConversations = conversations.filter(
    (conv) => conv.collectionId === collectionId
  );

  const handleSendMessage = async (message: string) => {
    createConversation.mutate(
      {
        message,
        type: "collection",
        collectionId,
      },
      {
        onSuccess: (data) => {
          setLocation(`/conversations/${data.conversation.id}`);
        },
      }
    );
  };

  const handleDeleteDocument = async (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await documentsApi.delete(docId);
        queryClient.invalidateQueries({ 
          queryKey: ["/api/collections", collectionId, "documents"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/collections"] 
        });
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewChat = () => {
    setSelectedCollectionId(undefined);
    setLocation("/");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show loading state
  if (isLoading || collectionLoading) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading collection...</p>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  // Handle authentication errors or collection not found
  if (collectionError || !collection) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {collectionError ? "Access denied" : "Collection not found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {collectionError ? "You don't have permission to view this collection." : "This collection may have been deleted or doesn't exist."}
            </p>
            <Button onClick={() => setLocation("/collections")} variant="outline">
              Back to Collections
            </Button>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  return (
    <TwitterStyleLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-gray-600">{collection.description}</p>
          )}
        </div>

        {/* Chat Input */}
        <div className="mb-4">
          <ChatInput
            onSend={handleSendMessage}
            disabled={createConversation.isPending}
            placeholder={`Start a conversation in this workspace`}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="conversations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="conversations" className="data-[state=active]:bg-white">
              Conversations
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-white">
              Documents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations" className="mt-6">
            {collectionConversations.length > 0 ? (
              <div className="space-y-6">
                {collectionConversations.map((conversation) => (
                  <ConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Start by attaching files to your collection. They will be used in all chats in this collection.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6 space-y-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              <AddDocumentDropdown 
                collectionId={collectionId} 
                onComplete={() => {}}
              />
            </div>

            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {document.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteDocument(document.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Start by attaching files to your collection. They will be used in all chats in this collection.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TwitterStyleLayout>
  );
}