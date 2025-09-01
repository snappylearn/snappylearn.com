import { useState } from "react";
import { Heart, Share, Bookmark, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollections } from "@/hooks/use-collections";
import { useAuth } from "@/contexts/AuthContext";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function Community() {
  const { user } = useAuth();
  const { data: collections = [] } = useCollections();
  const [activeTab, setActiveTab] = useState("Following");

  // Filter public collections for community feed
  const publicCollections = collections.filter(c => c.privateStatusTypeId === "public");
  const myCollections = collections.filter(c => c.userId === user?.id);

  // Mock data for community features - in real app, this would come from API
  const communityHighlights = [
    {
      id: 1,
      user: { name: "Kei Watanabe", avatar: "", verified: true },
      text: "ChatGPT processes multiple result types - webpage - webpage_extended - grouped_webpages - image_inline",
      collection: "AI Research Notes",
      timestamp: "2 hours ago",
      likes: 42,
      comments: 8,
      bookmarks: 15
    },
    {
      id: 2,
      user: { name: "Alex Johnson", avatar: "", verified: false },
      text: "Instead of manually typing out notes while watching the video (painful), use a tool like Glasp or YouTube's built-in transcript feature to extract the full transcript in seconds.",
      collection: "Productivity Hacks",
      timestamp: "4 hours ago",
      likes: 28,
      comments: 5,
      bookmarks: 9
    }
  ];

  return (
    <TwitterStyleLayout>
      {/* Feed Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {["Following", "Trending", "Recent"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Community Highlights */}
        <div className="p-6 space-y-6">
          {communityHighlights.map((highlight) => (
            <div key={highlight.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={highlight.user.avatar} />
                  <AvatarFallback>
                    {highlight.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{highlight.user.name}</span>
                    {highlight.user.verified && (
                      <span className="text-blue-500 text-sm">✓</span>
                    )}
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{highlight.timestamp}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    from <span className="font-medium">{highlight.collection}</span>
                  </div>
                </div>
              </div>

              {/* Highlight Content */}
              <div className="mb-4">
                <p className="text-gray-900 leading-relaxed">{highlight.text}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-6 text-gray-500">
                <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{highlight.likes}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{highlight.comments}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-yellow-500 transition-colors">
                  <Bookmark className="h-4 w-4" />
                  <span className="text-sm">{highlight.bookmarks}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                  <Share className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TwitterStyleLayout>
  );
}