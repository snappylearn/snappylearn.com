import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Shield, Github, Mail } from "lucide-react";
import { SiGoogle, SiFacebook, SiX } from "react-icons/si";
const snappyLearnLogo = "/snappylearn-transparent-logo.png";
const snappyLearnIcon = "/snappylearn-icon.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include'
      });

      if (response.ok) {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        const data = await response.json();
        toast({
          title: "Registration Failed",
          description: data.message || "Something went wrong",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center justify-center mb-6">
            <img src={snappyLearnLogo} alt="SnappyLearn" className="h-20 w-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900">SnappyLearn</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent document management and AI chat platform. 
            Upload documents, create collections, and chat with AI about your content.
          </p>
        </div>

        {/* Authentication Section */}
        <div className="max-w-md mx-auto mb-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Sign in to access your AI-powered workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="oauth" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="oauth">Quick Sign In</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>
                
                <TabsContent value="oauth" className="space-y-4">
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleOAuthLogin('replit')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      size="lg"
                    >
                      <img src={snappyLearnIcon} alt="SnappyLearn" className="w-5 h-5 mr-2" />
                      Continue with Replit
                    </Button>
                    
                    <Button 
                      onClick={() => handleOAuthLogin('google')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <SiGoogle className="w-5 h-5 mr-2" />
                      Continue with Google
                    </Button>
                    
                    <Button 
                      onClick={() => handleOAuthLogin('github')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Github className="w-5 h-5 mr-2" />
                      Continue with GitHub
                    </Button>
                    
                    <Button 
                      onClick={() => handleOAuthLogin('facebook')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <SiFacebook className="w-5 h-5 mr-2" />
                      Continue with Facebook
                    </Button>
                    
                    <Button 
                      onClick={() => handleOAuthLogin('twitter')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <SiX className="w-5 h-5 mr-2" />
                      Continue with Twitter
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="email" className="space-y-4">
                  <Tabs defaultValue="login">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="register">Sign Up</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          <Mail className="w-4 h-4 mr-2" />
                          {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register">
                      <form onSubmit={handleEmailRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            minLength={8}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          <Mail className="w-4 h-4 mr-2" />
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and organize your documents into smart collections. 
                Support for PDFs, text files, and more.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>AI Chat Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with AI about your documents. Get summaries, 
                ask questions, and discover insights from your content.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is secure and private. All conversations 
                and documents are protected with enterprise-grade security.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p>© 2025 SnappyLearn. Your intelligent knowledge companion.</p>
        </div>
      </div>
    </div>
  );
}