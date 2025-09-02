import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Coins, 
  TrendingUp, 
  Gift, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { SubscribeButton } from "@/components/subscription/SubscribeButton";

export default function UsageDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch user dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/subscription/dashboard'],
  });

  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </TwitterStyleLayout>
    );
  }

  const { subscription, credits, usage, recentTransactions } = dashboardData || {};

  const formatPlanName = (planId: string) => {
    const planNames: Record<string, string> = {
      "free": "Free",
      "pro": "Pro", 
      "premium": "Premium"
    };
    return planNames[planId] || "Unknown";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "active": "bg-green-100 text-green-800",
      "canceled": "bg-red-100 text-red-800",
      "past_due": "bg-yellow-100 text-yellow-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <TwitterStyleLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
          <p className="text-gray-600">Manage your subscription plans and view payment history.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Top Up Credits
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Billing Overview Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Current Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatPlanName(subscription?.planId || "free")}
                  </span>
                  <Badge className={getStatusColor(subscription?.status || "active")}>
                    {subscription?.status || "active"}
                  </Badge>
                </div>
                {subscription?.currentPeriodEnd && (
                  <p className="text-sm text-gray-600">
                    Next billing: {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                  </p>
                )}
                <Button className="w-full" variant="outline">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            {/* Credit Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5" />
                  <span>Credit Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  {credits?.balance || 0} credits
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly allowance</span>
                    <span>{credits?.monthlyAllowance || 0}</span>
                  </div>
                  <Progress 
                    value={credits?.monthlyAllowance > 0 ? (credits.balance / credits.monthlyAllowance) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Gift className="h-4 w-4 mr-2" />
                    Gift Credits
                  </Button>
                  <Button size="sm" className="flex-1">
                    Buy Credits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{usage?.thisMonth?.creditsUsed || 0}</p>
                    <p className="text-xs text-gray-600">Credits Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{usage?.thisMonth?.aiPosts || 0}</p>
                    <p className="text-xs text-gray-600">AI Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{usage?.thisMonth?.agentInteractions || 0}</p>
                    <p className="text-xs text-gray-600">Agent Chats</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold">{usage?.thisMonth?.taskRuns || 0}</p>
                    <p className="text-xs text-gray-600">Task Runs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <Card className={subscription?.planId === "free" ? "ring-2 ring-blue-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Free</span>
                    {subscription?.planId === "free" && (
                      <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-gray-600">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      50 credits/month
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      1 Notebook
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      1 Task
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      1 Agent
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant={subscription?.planId === "free" ? "outline" : "default"}
                    disabled={subscription?.planId === "free"}
                  >
                    {subscription?.planId === "free" ? "Current Plan" : "Downgrade"}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className={subscription?.planId === "pro" ? "ring-2 ring-purple-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pro</span>
                    {subscription?.planId === "pro" && (
                      <Badge className="bg-purple-100 text-purple-800">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-gray-600">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      1,500 credits/month
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      10 Notebooks
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      5 Tasks
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      3 Agents
                    </div>
                  </div>
                  <SubscribeButton 
                    className="w-full"
                    variant={subscription?.planId === "pro" ? "outline" : "default"}
                  />
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className={subscription?.planId === "premium" ? "ring-2 ring-gold-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                      Premium
                    </span>
                    {subscription?.planId === "premium" && (
                      <Badge className="bg-yellow-100 text-yellow-800">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="text-2xl font-bold">$29<span className="text-sm font-normal text-gray-600">/month</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      6,000 credits/month
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      Unlimited Notebooks
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      Unlimited Tasks
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      Unlimited Agents
                    </div>
                  </div>
                  <SubscribeButton 
                    className="w-full"
                    variant={subscription?.planId === "premium" ? "outline" : "default"}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Month's Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {usage?.breakdown?.length > 0 ? (
                <div className="space-y-4">
                  {usage.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{item.feature}</span>
                          <span className="text-sm text-gray-600">
                            {item.creditsUsed} credits ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No usage data for this month</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </p>
                        <p className="text-sm text-gray-600">
                          Balance: {transaction.balance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TwitterStyleLayout>
  );
}