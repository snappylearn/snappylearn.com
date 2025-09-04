import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  Bot, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  BarChart3, 
  Sparkles,
  Plus,
  History,
  MessageSquare,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Position {
  x: number;
  y: number;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function FloatingChatWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Initialize position at bottom center
  useEffect(() => {
    const updatePosition = () => {
      if (typeof window !== "undefined") {
        const centerX = window.innerWidth / 2 - (isExpanded ? 200 : 150);
        const bottomY = window.innerHeight - (isExpanded ? 400 : 80) - 20;
        setPosition({ x: centerX, y: bottomY });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isExpanded]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current?.contains(e.target as Node)) return;
    
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - (isExpanded ? 400 : 300);
    const maxY = window.innerHeight - (isExpanded ? 500 : 120);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I received your message: "${userMessage.text}". This is a simulated response. In the full version, this would connect to your AI service.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    const prompts = {
      "insights": "Analyze my task performance and provide insights on productivity patterns",
      "summary": "Summarize my current task status, priorities, and what I should focus on today"
    };

    const prompt = prompts[action as keyof typeof prompts];
    if (prompt) {
      setMessage(prompt);
      handleSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 transition-all duration-300 ${
        isDragging ? "cursor-move" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded ? "400px" : "320px",
        height: isExpanded ? "500px" : "auto"
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200">
        {isExpanded && (
          <CardHeader 
            ref={dragRef}
            className="bg-gradient-to-r from-blue-50 to-purple-50 cursor-move p-4 flex-row items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500">
                <AvatarFallback>
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-600">{messages.length} messages</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4" />
              </Button>
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        )}

        <CardContent className="p-4">
          {isExpanded && (
            <ScrollArea className="h-80 mb-4">
              <div className="space-y-4 pr-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isUser ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full"></div>
                        <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full delay-75"></div>
                        <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full delay-150"></div>
                        <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Command Bar */}
          <div className="space-y-3">
            {!isExpanded && (
              <div 
                ref={dragRef}
                className="flex items-center space-x-3 cursor-move p-2 rounded-lg hover:bg-gray-50"
              >
                <Avatar className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500">
                  <AvatarFallback>
                    <Bot className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">AI Assistant</h3>
                  <p className="text-xs text-gray-600">Ready to help</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Ask your AI assistant anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("insights")}
                disabled={isLoading}
                className="flex-1"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Give Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("summary")}
                disabled={isLoading}
                className="flex-1"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Summarize Tasks
              </Button>
            </div>

            {!isExpanded && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="text-gray-500"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Chat History
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}