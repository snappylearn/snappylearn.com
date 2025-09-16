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
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function Chat() {
  const [location, setLocation] = useLocation();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  const [inputValue, setInputValue] = useState("");
  
  // Check for collectionId in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const collectionIdParam = urlParams.get('collectionId');
    if (collectionIdParam) {
      setSelectedCollectionId(parseInt(collectionIdParam));
    }
  }, [location]);
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

  // Dynamic time-based copy that changes throughout the day
  const getTimeBasedContent = () => {
    const hour = new Date().getHours();
    
    const timeBasedCopy = {
      // Early Morning (5-7 AM)
      earlyMorning: {
        headers: [
          "☀️ Rise and learn with me?",
          "🌅 Early bird learning session?",
          "⏰ Morning mind, ready to expand?",
          "🌤️ Dawn of new knowledge?",
          "🐦 Tweet me your questions!",
          "☕ Fresh mind, fresh ideas?"
        ],
        descriptions: [
          "Your brain is at its sharpest - let's tackle something challenging",
          "Perfect time for deep learning and complex topics",
          "Start your day with knowledge that matters",
          "Early hours, endless possibilities",
          "The world is quiet, your mind is clear - let's learn",
          "Morning clarity meets infinite curiosity"
        ]
      },
      // Morning (8-11 AM)
      morning: {
        headers: [
          "☕ Coffee and SnappyLearn time?",
          "🌅 Morning mindset activated!",
          "⚡ Let's energize your brain!",
          "🎯 Focus mode: ON. What's first?",
          "🌟 Start strong, learn stronger!",
          "🚀 Ready to launch into learning?"
        ],
        descriptions: [
          "Peak productivity hours - let's make them count",
          "Your mind is fresh and ready for anything",
          "Time to turn curiosity into knowledge",
          "Morning energy meets learning power",
          "Let's build something amazing together",
          "Fresh start, fresh questions, fresh insights"
        ]
      },
      // Midday (12-2 PM)
      midday: {
        headers: [
          "🍽️ Lunch break learning?",
          "☀️ Midday knowledge boost!",
          "⚡ Recharge with some wisdom?",
          "🎪 Lunch and learn circus!",
          "🌮 Feed your mind too?",
          "📚 Midday mental snack?"
        ],
        descriptions: [
          "Perfect time for a quick knowledge bite",
          "Fuel your brain while you fuel your body",
          "Turn break time into breakthrough time",
          "Quick questions, powerful answers",
          "Digest new ideas with your lunch",
          "Midday motivation coming right up"
        ]
      },
      // Afternoon (3-5 PM)
      afternoon: {
        headers: [
          "🌤️ Afternoon inspiration needed?",
          "⚡ Beat the afternoon slump!",
          "🎨 Creative afternoon vibes?",
          "🌿 Refresh your perspective?",
          "💡 Bright ideas for bright minds?",
          "🔥 Ignite your curiosity?"
        ],
        descriptions: [
          "Let's turn that afternoon lull into learning fuel",
          "Perfect time for creative problem-solving",
          "Shake off the sluggishness with new knowledge",
          "Afternoon adventures in learning await",
          "Reboot your brain with fresh insights",
          "Transform tired thoughts into brilliant ideas"
        ]
      },
      // Evening (6-8 PM)
      evening: {
        headers: [
          "🌆 Evening wind-down wisdom?",
          "🌙 Twilight thoughts and questions?",
          "✨ End the day with enlightenment?",
          "🌃 Golden hour, golden knowledge?",
          "🍷 Unwind with understanding?",
          "🌸 Peaceful learning moments?"
        ],
        descriptions: [
          "Wind down with knowledge that enriches",
          "Gentle learning for a gentle evening",
          "End your day on a high note",
          "Evening reflection meets forward thinking",
          "Calm questions, thoughtful answers",
          "Let's explore ideas as the day settles"
        ]
      },
      // Night (9-11 PM)
      night: {
        headers: [
          "🌙 Night owl session?",
          "✨ Late-night learnings?",
          "🦉 Midnight mind mysteries?",
          "🌟 Starlight study time?",
          "💭 Deep thoughts, deeper answers?",
          "🌌 Explore the universe of ideas?"
        ],
        descriptions: [
          "When the world sleeps, we think deeper",
          "Night time is the right time for big questions",
          "Dark sky, bright minds at work",
          "Late night curiosity deserves great answers",
          "The quiet hours hold the loudest insights",
          "Nocturnal knowledge seekers welcome"
        ]
      },
      // Late Night (12-4 AM)
      lateNight: {
        headers: [
          "🌚 Burning the midnight oil?",
          "🦉 Extreme night owl mode?",
          "💫 3 AM epiphanies incoming?",
          "🌌 When the world sleeps, we learn?",
          "⭐ Insomniac insights?",
          "🔮 Midnight magic questions?"
        ],
        descriptions: [
          "The dedication is real - let's make it count",
          "Deep night, deeper thoughts, deepest learning",
          "Your commitment to knowledge is inspiring",
          "When everyone sleeps, the best ideas wake up",
          "Late night learning hits different",
          "The darkness holds the brightest insights"
        ]
      }
    };

    // Determine which time period we're in
    if (hour >= 5 && hour < 8) return timeBasedCopy.earlyMorning;
    if (hour >= 8 && hour < 12) return timeBasedCopy.morning;
    if (hour >= 12 && hour < 15) return timeBasedCopy.midday;
    if (hour >= 15 && hour < 18) return timeBasedCopy.afternoon;
    if (hour >= 18 && hour < 21) return timeBasedCopy.evening;
    if (hour >= 21 && hour < 24) return timeBasedCopy.night;
    return timeBasedCopy.lateNight; // 12-4 AM
  };

  // Get random header and description for current time - only calculate once on mount
  const [timeBasedContent] = useState(() => {
    const currentTimeCopy = getTimeBasedContent();
    const randomHeaderIndex = Math.floor(Math.random() * currentTimeCopy.headers.length);
    const randomDescIndex = Math.floor(Math.random() * currentTimeCopy.descriptions.length);
    
    return {
      header: currentTimeCopy.headers[randomHeaderIndex],
      description: currentTimeCopy.descriptions[randomDescIndex]
    };
  });
  
  const dynamicHeader = timeBasedContent.header;
  const dynamicDescription = timeBasedContent.description;

  // Example prompts for new chats
  const examplePrompts = [
    "Explain quantum computing in simple terms",
    "Help me write a professional email",
    "What are the latest trends in AI?", 
    "Create a study plan for learning Python",
    "Summarize the key points of project management",
    "Give me creative ideas for a birthday party"
  ];

  const handlePromptClick = (prompt: string) => {
    // Set the prompt in the chat input for user to review and edit before sending
    setInputValue(prompt);
  };

  // Always show example prompts on the main chat page since this is the starting point
  const isNewChat = true;

  return (
    <TwitterStyleLayout>
      <div className="flex flex-col min-h-[80vh]">
        
        {/* Collection Context */}
        {selectedCollection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col justify-end">
          
          {/* Example Prompts - Only show for new chats */}
          {isNewChat && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{dynamicHeader}</h2>
                <p className="text-gray-600">{dynamicDescription}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {examplePrompts.map((prompt, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-purple-300"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700">{prompt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input - Now at bottom */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <ChatInput 
              onSend={handleSendMessage}
              value={inputValue}
              onChange={setInputValue}
              placeholder={
                selectedCollection 
                  ? `Ask a question about ${selectedCollection.name}...`
                  : "Ask me anything..."
              }
            />
          </div>
        </div>

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
    </TwitterStyleLayout>
  );
}