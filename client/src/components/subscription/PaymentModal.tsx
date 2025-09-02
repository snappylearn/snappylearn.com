import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Coins, ExternalLink, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Add Paystack script to window if not already loaded
declare global {
  interface Window {
    PaystackPop: any;
  }
}

if (typeof window !== 'undefined' && !window.PaystackPop) {
  const script = document.createElement('script');
  script.src = 'https://js.paystack.co/v1/inline.js';
  document.head.appendChild(script);
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
  isYearly: boolean;
  credits: number;
}

function PaymentForm({ planId, planName, price, isYearly, credits, onClose }: Omit<PaymentModalProps, "isOpen">) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "credits">("card");

  const handlePaystackPayment = async () => {
    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/subscription/create-payment-intent", {
        planId,
        isYearly
      });
      
      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }
      
      const { authorization_url, reference } = await response.json();

      // Initialize Paystack popup
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: 'user@example.com', // This will be set by backend
        amount: price, // Amount in cents for USD
        currency: 'USD',
        ref: reference,
        onClose: function() {
          setIsProcessing(false);
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process",
            variant: "destructive"
          });
        },
        callback: async function(response: any) {
          try {
            // Confirm payment on backend
            const confirmResponse = await apiRequest("POST", "/api/subscription/confirm-payment", {
              paymentIntentId: response.reference
            });
            
            if (confirmResponse.ok) {
              toast({
                title: "Payment Successful!",
                description: `You've successfully subscribed to ${planName}`,
              });
              onClose();
              // Refresh the page to update subscription status
              window.location.reload();
            } else {
              toast({
                title: "Payment Confirmation Failed",
                description: "Please contact support if this issue persists",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error("Payment confirmation error:", error);
            toast({
              title: "Payment Confirmation Failed",
              description: "Please contact support if this issue persists",
              variant: "destructive"
            });
          } finally {
            setIsProcessing(false);
          }
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleCreditPayment = async () => {
    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/subscription/pay-with-credits", {
        planId,
        isYearly
      });

      if (response.ok) {
        toast({
          title: "Subscription Updated",
          description: "Successfully upgraded using credits!",
        });
        onClose();
        window.location.href = "/dashboard?subscription=success";
      } else {
        const error = await response.json();
        toast({
          title: "Payment Failed",
          description: error.message || "Insufficient credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === "card") {
      await handlePaystackPayment();
    } else {
      await handleCreditPayment();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h3 className="font-medium">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className={`cursor-pointer transition-all ${
              paymentMethod === "card" ? "ring-2 ring-purple-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setPaymentMethod("card")}
          >
            <CardContent className="p-4 flex items-center space-x-3">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Credit Card</span>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${
              paymentMethod === "credits" ? "ring-2 ring-purple-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setPaymentMethod("credits")}
          >
            <CardContent className="p-4 flex items-center space-x-3">
              <Coins className="h-5 w-5" />
              <span className="font-medium">Credits</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Info */}
      {paymentMethod === "card" && (
        <div className="space-y-3">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>Pay securely with Paystack</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Supports cards, bank transfers, and mobile money (USD only)
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Payments processed securely via Paystack in USD</span>
          </div>
        </div>
      )}

      {/* Credit Payment Info */}
      {paymentMethod === "credits" && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            This will deduct <strong>{price / 100} credits</strong> from your balance.
          </p>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium">{planName} Plan</span>
          <span className="font-medium">${(price / 100).toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Billing {isYearly ? "Yearly" : "Monthly"}</span>
          <span>{credits} monthly credits</span>
        </div>
        {isYearly && (
          <div className="flex justify-between items-center text-sm text-green-600">
            <span>Annual Savings</span>
            <span>20% off</span>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-purple-600 hover:bg-purple-700" 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : paymentMethod === "card" ? (
            <div className="flex items-center space-x-2">
              <span>Pay ${(price / 100).toFixed(2)} USD</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          ) : (
            `Subscribe with Credits`
          )}
        </Button>
      </div>
    </form>
  );
}

export function PaymentModal(props: PaymentModalProps) {
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);

  useEffect(() => {
    // Check if Paystack is loaded
    const checkPaystack = () => {
      if (window.PaystackPop) {
        setIsPaystackLoaded(true);
      } else {
        setTimeout(checkPaystack, 100);
      }
    };
    checkPaystack();
  }, []);

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Subscribe to {props.planName}</span>
            <Badge>{props.isYearly ? "Yearly" : "Monthly"}</Badge>
          </DialogTitle>
        </DialogHeader>

        {!isPaystackLoaded && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2">Loading payment processor...</span>
          </div>
        )}

        {isPaystackLoaded && (
          <PaymentForm {...props} />
        )}
      </DialogContent>
    </Dialog>
  );
}