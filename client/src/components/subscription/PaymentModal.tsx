import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "credits">("card");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === "card") {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard?subscription=success`,
          },
        });

        if (error) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Handle credit payment
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

      {/* Payment Element (only show for card payments) */}
      {paymentMethod === "card" && (
        <div className="space-y-3">
          <h3 className="font-medium">Card Details</h3>
          <PaymentElement />
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
          <span className="font-medium">${(price / 100).toFixed(2)}</span>
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

      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : `Subscribe to ${planName}`}
      </Button>
    </form>
  );
}

export function PaymentModal(props: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/subscription/create-payment-intent", {
        planId: props.planId,
        isYearly: props.isYearly
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } else {
        console.error("Failed to create payment intent");
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize payment when modal opens
  if (props.isOpen && !clientSecret && !isLoading) {
    initializePayment();
  }

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  } : undefined;

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Subscribe to {props.planName}</span>
            <Badge>{props.isYearly ? "Yearly" : "Monthly"}</Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {clientSecret && options && (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm {...props} />
          </Elements>
        )}

        {!isLoading && !clientSecret && (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to initialize payment. Please try again.</p>
            <Button onClick={initializePayment} className="mt-4">
              Retry
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}