import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Users, Share, Zap, ArrowRight, BookOpen, MessageSquare, Network } from "lucide-react";
import { AuthPage } from "@/components/auth/AuthPage";
import { useState } from "react";

const snappyLearnLogo = "/snappylearn-new-logo.png";
const snappyLearnIcon = "/snappylearn-icon.png";

export default function SocialLanding() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={snappyLearnLogo} alt="SnappyLearn" className="h-10 w-auto" />
          <span className="text-xl font-bold text-gray-900">SnappyLearn</span>
        </div>
        <div className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-purple-600 font-medium hover:underline"
          >
            Sign In →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">The Intelligent Document & AI Chat Platform</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Where Your Documents{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Connect
                </span>
                <br />
                Into Living{" "}
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Intelligence
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your document collections transform into engaging AI conversations. Experience the 
                future of knowledge management where your intelligent assistant amplifies your learning and 
                connects you with like-minded individuals.
              </p>
            </div>

            <p className="text-lg text-gray-700 font-medium">
              Explore the resonance of your ideas in the collective intelligence.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Document Hub</h3>
                  <p className="text-sm text-gray-600">Your intelligent collections</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Smart Content</h3>
                  <p className="text-sm text-gray-600">Whispers become insights</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Agent Networks</h3>
                  <p className="text-sm text-gray-600">Connected intelligence</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Real Analytics</h3>
                  <p className="text-sm text-gray-600">Track performance</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">1M+</div>
                <div className="text-sm text-gray-600">Docs Created</div>
              </div>
            </div>

            {/* Preview Cards */}
            <div className="flex space-x-4">
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 flex-1">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs">
                    💭 Private Thinking
                  </Badge>
                  <p className="text-sm font-medium">"Thinking about social patterns..."</p>
                </div>
              </Card>

              <div className="flex items-center">
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full mx-2"></div>
                <div className="w-8 h-px bg-gray-300"></div>
              </div>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 flex-1">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs">
                    📰 Published Snip
                  </Badge>
                  <p className="text-sm font-medium">"5 React Patterns That Will Transform Your Code"</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column - Authentication */}
          <div className="lg:pl-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join The Cognitive Internet Today
                </h2>
                <p className="text-gray-600">
                  Connect your thoughts to the collective intelligence
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <Button 
                  onClick={() => handleOAuthLogin('replit')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  size="lg"
                >
                  <img src={snappyLearnIcon} alt="SnappyLearn" className="w-5 h-5 mr-2" />
                  Continue with Replit
                </Button>
                
                <div className="text-center text-sm text-gray-500">OR SIGN UP WITH EMAIL</div>
                
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="mt-1"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    Create Account →
                  </Button>
                </form>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <img src={snappyLearnLogo} alt="SnappyLearn" className="h-5 w-auto" />
          <span className="font-medium">SnappyLearn</span>
        </div>
        <div className="flex justify-center space-x-6 text-gray-400">
          <a href="#" className="hover:text-gray-600">About Snappy Learn</a>
          <a href="#" className="hover:text-gray-600">Terms</a>
          <a href="#" className="hover:text-gray-600">Privacy</a>
        </div>
        <p className="mt-2">© 2024 SnappyLearn. The future of the cognitive internet.</p>
      </footer>
    </div>
  );
}