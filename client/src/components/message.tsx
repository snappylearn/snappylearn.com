import { User, Bot } from "lucide-react";
const snappyLearnLogo = "/snappylearn-logo-purple-owl.png";
import type { Message } from "@shared/schema";
import { ArtifactCard } from "./artifact-manager";
import { useAgents } from "@/hooks/use-agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIBadge } from "@/components/ui/ai-badge";

interface MessageComponentProps {
  message: Message;
  onViewArtifact?: (artifactHtml: string, title: string) => void;
}

export function MessageComponent({ message, onViewArtifact }: MessageComponentProps) {
  const isUser = message.role === "user";
  const { data: agents = [] } = useAgents({ includeSnappy: true }); // Include Snappy for attribution
  
  const sources = message.sources as Array<{
    documentId: number;
    documentName: string;
    excerpt: string;
  }> | null;

  // Find the agent who sent this message (for AI responses)
  const sender = !isUser && message.senderId ? 
    agents.find(agent => agent.id === message.senderId) : null;
  
  // Check if this is from Snappy Agent (default agent)
  const isSnappyAgent = !isUser && (!message.senderId || sender?.username === 'snappy');
  
  // Get agent display info
  const agentInfo = !isUser ? {
    name: isSnappyAgent ? 'SnappyLearn AI' : (sender ? `${sender.firstName} ${sender.lastName}` : 'SnappyLearn AI'),
    username: isSnappyAgent ? null : (sender ? sender.username : null),
    about: sender?.about || null
  } : null;

  // Check if message contains artifact
  const artifactMatch = message.content.match(/\[ARTIFACT_START\]([\s\S]*?)\[ARTIFACT_END\]/);
  const hasArtifact = artifactMatch !== null;
  
  // Get message content without artifact tags and remove asterisks
  const messageContent = hasArtifact 
    ? message.content.replace(/\[ARTIFACT_START\][\s\S]*?\[ARTIFACT_END\]/, '').trim().replace(/\*/g, '')
    : message.content.replace(/\*/g, '');

  // Extract artifact details
  const artifactHtml = artifactMatch ? artifactMatch[1] : null;
  const titleMatch = artifactHtml?.match(/<!-- Artifact Title: (.*?) -->/);
  const artifactTitle = titleMatch ? titleMatch[1] : 'Interactive Content';

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      {/* AI Avatar (left side) */}
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage 
            src={isSnappyAgent ? snappyLearnLogo : undefined} 
            alt={agentInfo?.name || "AI Assistant"} 
          />
          <AvatarFallback className={isSnappyAgent ? "bg-purple-100" : "bg-blue-100"}>
            {isSnappyAgent ? (
              <img src={snappyLearnLogo} alt="SnappyLearn" className="w-5 h-5" />
            ) : (
              <Bot className="w-4 h-4 text-purple-600" />
            )}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-2xl ${isUser ? "order-first" : ""}`}>
        {/* Agent Info Header */}
        {!isUser && agentInfo && (
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {agentInfo.name}
            </span>
            {(isSnappyAgent || sender?.userTypeId === 2) && (
              <AIBadge size="sm" data-testid="ai-badge-message" />
            )}
            {agentInfo.username && (
              <span className="text-xs text-gray-500">@{agentInfo.username}</span>
            )}
          </div>
        )}
        
        {/* Main message content */}
        {messageContent && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-blue-600 text-white rounded-br-sm shadow-md"
                : "bg-gray-50 border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
            }`}
          >
            <div className="whitespace-pre-wrap">{messageContent}</div>
          
            {/* Sources for AI messages */}
            {!isUser && sources && sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-2">Sources:</p>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div key={index} className="bg-white rounded-lg p-2 border border-gray-200">
                      <p className="text-xs font-medium text-gray-800">{source.documentName}</p>
                      <p className="text-xs text-gray-600 mt-1">{source.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <span
              className={`text-xs mt-2 block ${
                isUser ? "text-blue-100" : "text-gray-400"
              }`}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Artifact Card */}
        {!isUser && hasArtifact && artifactHtml && onViewArtifact && (
          <div className="mt-3">
            <ArtifactCard
              title={artifactTitle}
              onViewArtifact={() => onViewArtifact(artifactHtml, artifactTitle)}
            />
          </div>
        )}
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-600 text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
