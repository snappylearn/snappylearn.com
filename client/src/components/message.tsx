import { User } from "lucide-react";
const snappyLearnLogo = "/snappylearn-transparent-logo.png";
import type { Message } from "@shared/schema";
import { ArtifactCard } from "./artifact-manager";

interface MessageComponentProps {
  message: Message;
  onViewArtifact?: (artifactHtml: string, title: string) => void;
}

export function MessageComponent({ message, onViewArtifact }: MessageComponentProps) {
  const isUser = message.role === "user";
  const sources = message.sources as Array<{
    documentId: number;
    documentName: string;
    excerpt: string;
  }> | null;

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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-2xl ${isUser ? "ml-12" : "mr-12"}`}>
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2">
            <img src={snappyLearnLogo} alt="SnappyLearn" className="w-6 h-6" />
            <span className="text-sm font-medium text-gray-700">SnappyLearn AI</span>
          </div>
        )}
        
        {/* Main message content */}
        {messageContent && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary text-white rounded-br-md"
                : "bg-gray-100 text-gray-800 rounded-bl-md"
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
                isUser ? "text-indigo-200" : "text-gray-500"
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
    </div>
  );
}
