import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { SubscribeModal } from "./SubscribeModal";
import { PaymentModal } from "./PaymentModal";

interface SubscribeButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function SubscribeButton({ variant = "default", size = "default", className }: SubscribeButtonProps) {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: number;
    credits: number;
    isYearly: boolean;
  } | null>(null);

  const planData = {
    pro: { name: "Pro", price: { monthly: 999, yearly: 9588 }, credits: 1500 },
    premium: { name: "Premium", price: { monthly: 2900, yearly: 27840 }, credits: 6000 }
  };

  const handleSelectPlan = (planId: string, isYearly: boolean) => {
    if (planId === "free") {
      // Close modal - user is already on free plan
      setIsSubscribeModalOpen(false);
      return;
    }

    const plan = planData[planId as keyof typeof planData];
    if (plan) {
      const price = isYearly ? plan.price.yearly : plan.price.monthly;
      setSelectedPlan({
        id: planId,
        name: plan.name,
        price,
        credits: plan.credits,
        isYearly
      });
      setIsSubscribeModalOpen(false);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsSubscribeModalOpen(true)}
      >
        <Crown className="h-4 w-4 mr-2" />
        Subscribe
      </Button>

      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        onSelectPlan={handleSelectPlan}
      />

      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          isYearly={selectedPlan.isYearly}
          credits={selectedPlan.credits}
        />
      )}
    </>
  );
}