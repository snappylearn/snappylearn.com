import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string, isYearly: boolean) => void;
}

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    credits: 50,
    features: [
      "1 Collection",
      "1 Task", 
      "1 Assistant",
      "1 Community",
      "50 Monthly Credits"
    ],
    limits: true,
    popular: false,
    color: "text-gray-600"
  },
  {
    id: "pro", 
    name: "Pro",
    icon: Crown,
    price: { monthly: 999, yearly: 9588 }, // $9.99 monthly, $95.88 yearly (20% off)
    credits: 1500,
    features: [
      "5 Collections",
      "10 Tasks",
      "5 Assistants", 
      "5 Communities",
      "1,500 Monthly Credits",
      "Transfer & Gift Credits"
    ],
    limits: false,
    popular: true,
    color: "text-purple-600"
  },
  {
    id: "premium",
    name: "Premium", 
    icon: Sparkles,
    price: { monthly: 2900, yearly: 27840 }, // $29 monthly, $278.40 yearly (20% off)
    credits: 6000,
    features: [
      "Unlimited Collections",
      "Unlimited Tasks", 
      "Unlimited Assistants",
      "Unlimited Communities",
      "6,000 Monthly Credits",
      "Transfer & Gift Credits",
      "Early Access to New Features"
    ],
    limits: false,
    popular: false,
    color: "text-amber-600"
  }
];

export function SubscribeModal({ isOpen, onClose, onSelectPlan }: SubscribeModalProps) {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlySavings = (monthly * 12) - yearly;
    return Math.round((monthlySavings / (monthly * 12)) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
          <p className="text-gray-600 mt-2">Unlock more power, flexibility, and perks.</p>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <span className={cn("text-sm", !isYearly && "font-semibold")}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-purple-600"
          />
          <span className={cn("text-sm", isYearly && "font-semibold")}>
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const displayPrice = isYearly ? price / 12 : price; // Show monthly equivalent for yearly
            const savings = getYearlySavings(plan.price.monthly, plan.price.yearly);
            
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-200 hover:shadow-lg",
                  plan.popular && "ring-2 ring-purple-600 shadow-lg"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className={cn("h-8 w-8", plan.color)} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {price === 0 ? "Free" : formatPrice(displayPrice)}
                      {price > 0 && <span className="text-lg font-normal text-gray-500">/month</span>}
                    </div>
                    {isYearly && price > 0 && savings > 0 && (
                      <div className="text-sm text-green-600 font-medium">
                        Save {savings}% annually
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button
                    className={cn(
                      "w-full",
                      plan.id === "free" 
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                        : plan.popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-900 hover:bg-gray-800"
                    )}
                    variant={plan.id === "free" ? "outline" : "default"}
                    onClick={() => onSelectPlan(plan.id, isYearly)}
                    disabled={plan.id === "free"}
                  >
                    {plan.id === "free" ? "Current Plan" : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-3 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Need more credits? You can always top up or pay-as-you-go.
          </p>
          <p className="text-xs text-gray-500">
            Credits auto-renew monthly. Unused credits roll over for 1 month.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}