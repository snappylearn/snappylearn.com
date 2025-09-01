import { MessageSquare, Folder, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ConversationWithPreview } from "@shared/schema";
import { Link } from "wouter";

interface ConversationCardProps {
  conversation: ConversationWithPreview;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const isCollectionBased = conversation.type === "collection";

  return (
    <Link href={`/conversations/${conversation.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isCollectionBased ? "bg-blue-500" : "bg-gray-400"
              }`} />
              <span className={`text-xs font-medium uppercase ${
                isCollectionBased ? "text-blue-600" : "text-gray-500"
              }`}>
                {isCollectionBased ? "Collection" : "Independent"}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {(() => {
                if (!conversation.updatedAt) return "Just now";
                const date = new Date(conversation.updatedAt);
                if (isNaN(date.getTime())) return "Just now";
                
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) return "Yesterday";
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
                return date.toLocaleDateString();
              })()}
            </span>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {conversation.title}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {conversation.preview}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {conversation.messageCount} messages
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
