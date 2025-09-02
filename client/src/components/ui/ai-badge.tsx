import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface AIBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function AIBadge({ className = "", size = "sm" }: AIBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1"
  };

  return (
    <Badge 
      variant="secondary" 
      className={`bg-purple-100 text-purple-700 border-purple-200 ${sizeClasses[size]} ${className}`}
    >
      <Bot className="w-3 h-3 mr-1" />
      AI
    </Badge>
  );
}