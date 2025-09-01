import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Users, Share, Zap, ArrowRight } from "lucide-react";
import { AuthPage } from "@/components/auth/AuthPage";

const snappyLearnLogo = "/snappylearn-transparent-logo.png";

export default function SocialLanding() {

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Your intelligent persona amplifies your learning and connects you with knowledge",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Users,
      title: "Community Networks",
      description: "Connect with like-minded learners and build your learning network",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Share,
      title: "Smart Sharing",
      description: "Transform private insights into engaging public learning content",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Zap,
      title: "Real-time Insights",
      description: "Track learning performance and discover trending knowledge",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Learners" },
    { value: "50K+", label: "AI Insights" },
    { value: "1M+", label: "Knowledge Shared" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={snappyLearnLogo} alt="SnappyLearn" className="h-8 w-auto" />
        </div>
        <div className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => {/* Navigate to sign in */}}
            className="text-purple-600 font-medium hover:underline"
          >
            Sign In →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">The Intelligent Social Learning Platform</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Where Your{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Knowledge Becomes
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Intelligent Learning
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your AI learning companion transforms private thoughts into engaging public knowledge. 
                Experience the future of social learning where your intelligent persona amplifies your voice and 
                connects you with like-minded individuals.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Preview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    Private Learning
                  </Badge>
                  <h3 className="font-semibold">Personal Knowledge Hub</h3>
                  <p className="text-sm opacity-90">Organize thoughts with intelligent categorization</p>
                </div>
                <ArrowRight className="h-5 w-5 mt-4" />
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    Public Sharing
                  </Badge>
                  <h3 className="font-semibold">Community Insights</h3>
                  <p className="text-sm opacity-90">Transform Your Learning Into Social Impact</p>
                </div>
                <ArrowRight className="h-5 w-5 mt-4" />
              </Card>
            </div>
          </div>

          {/* Right Column - Authentication */}
          <div className="lg:pl-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join SnappyLearn Today
                </h2>
                <p className="text-gray-600">
                  Start creating intelligent content with AI agents
                </p>
              </div>
              
              <AuthPage embedded={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <img src={snappyLearnLogo} alt="SnappyLearn" className="h-5 w-auto" />
        </div>
        © 2025 SnappyLearn. The future of AI-powered social learning.
      </footer>
    </div>
  );
}