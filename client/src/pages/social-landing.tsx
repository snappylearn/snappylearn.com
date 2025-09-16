import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Users, Share, Zap, ArrowRight, BookOpen, MessageSquare, Network, Search, Target, Globe, Heart, Lightbulb, Camera, UserCheck } from "lucide-react";
import { AuthPage } from "@/components/auth/AuthPage";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const snappyLearnLogo = "/snappylearn-new-logo.png";
const snappyLearnIcon = "/snappylearn-icon.png";

export default function SocialLanding() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        window.location.href = '/';
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Account Created!",
          description: "Please sign in with your new account.",
          variant: "default",
        });
        // Switch to sign in tab after successful registration
        const signInTab = document.querySelector('[data-value="login"]') as HTMLElement;
        if (signInTab) {
          signInTab.click();
        }
      } else {
        const data = await response.json();
        toast({
          title: "Registration Failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <img src={snappyLearnLogo} alt="SnappyLearn" className="h-10 w-auto" />
        </div>
        <div className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-purple-600 font-medium hover:underline"
            data-testid="button-signin"
          >
            Sign In →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Content */}
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-800 border-purple-200" data-testid="badge-tagline">
                  ✨ Ignite Your Curiosity. Inspire Your Journey.
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight" data-testid="heading-main">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Ignite Your Curiosity. 
                </span>
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Inspire Your Journey.
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed" data-testid="text-subheading">
                A community of lifelong learners, guided by AI companions, curiosity, and collective wisdom.
              </p>
              
              <p className="text-base text-gray-700 font-medium italic" data-testid="text-purpose">
                "Learning is not about what you know. It's about the excitement of what you can discover."
              </p>
              
              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-600" data-testid="section-stats">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-purple-600">10K+</span>
                  <span>active learners</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-blue-600">50K+</span>
                  <span>documents shared</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-green-600">100K+</span>
                  <span>AI conversations</span>
                </div>
              </div>
            </div>

            {/* Core Experiences */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900" data-testid="heading-core-experiences">Core Experiences</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid="card-discover-knowledge">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">🔍 Discover Knowledge in Everyday Life</h3>
                        <p className="text-xs text-gray-600 lg:hidden">Snap a photo, ask a question, or explore insights.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid="card-chat-minds">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">💬 Chat With Great Minds</h3>
                        <p className="text-xs text-gray-600 lg:hidden">Converse with Aristotle, Einstein, or AI mentors.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid="card-learn-together">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">🤝 Learn Together, Grow Together</h3>
                        <p className="text-xs text-gray-600 lg:hidden">Join dynamic communities and challenges.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid="card-your-path">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">🎯 Your Path, Your Way</h3>
                        <p className="text-xs text-gray-600 lg:hidden">Personalized journeys that adapt to your curiosity.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tools & Purpose Section - 2x2 Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Document Hub */}
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-purple-100 text-purple-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Document Hub</h4>
                    <p className="text-xs text-gray-600">Your intelligent collections</p>
                  </div>
                </div>

                {/* Agent Networks */}
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-green-100 text-green-600">
                    <Network className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Agent Networks</h4>
                    <p className="text-xs text-gray-600">Connected intelligence</p>
                  </div>
                </div>

                {/* Lifelong Curiosity */}
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-pink-100 text-pink-600">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">🧠 Lifelong Curiosity</h4>
                    <p className="text-xs text-gray-600">Ignite joy in learning daily.</p>
                  </div>
                </div>

                {/* Community of Explorers */}
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-600">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">🤝 Community of Explorers</h4>
                    <p className="text-xs text-gray-600">Learn with others, not alone.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Original Authentication Design */}
          <div className="lg:pl-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="heading-signup">
                  Chat Your Way to Knowledge.
                </h2>
                <p className="text-gray-600" data-testid="text-signup-description">
                  Learning is a conversation.
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="text-center text-sm text-gray-700 font-medium mb-4">Join with Email</div>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" data-testid="tab-signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email address</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="mt-1"
                          required
                          data-testid="input-login-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="mt-1"
                          required
                          data-testid="input-login-password"
                        />
                      </div>
                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        size="lg"
                        disabled={isLoading}
                        data-testid="button-login-submit"
                      >
                        {isLoading ? 'Signing In...' : 'Sign In →'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="mt-4">
                    <form onSubmit={handleEmailRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="First name"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="mt-1"
                            required
                            data-testid="input-firstname"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Last name"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="mt-1"
                            required
                            data-testid="input-lastname"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email address</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="mt-1"
                          required
                          data-testid="input-signup-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="mt-1"
                          required
                          minLength={8}
                          data-testid="input-signup-password"
                        />
                      </div>
                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        size="lg"
                        disabled={isLoading}
                        data-testid="button-signup-submit"
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account →'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="hidden lg:block text-center py-2 text-xs text-gray-400">
        © 2025 SnappyLearn. Ignite Your Curiosity.
      </footer>
    </div>
  );
}