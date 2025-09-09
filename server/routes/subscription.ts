import type { Express } from "express";
import { jwtAuth, getJwtUserId } from "./auth";
import { storage } from "../storage";

// Use direct API calls instead of the paystack library for better ES6 compatibility
const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Check if Paystack is configured
const isPaystackConfigured = !!PAYSTACK_SECRET_KEY;

async function paystackRequest(endpoint: string, method: string = "GET", data?: any) {
  if (!isPaystackConfigured) {
    throw new Error('Paystack is not configured. Please add PAYSTACK_SECRET_KEY to use payment features.');
  }
  
  const url = `${PAYSTACK_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    credits: 50,
    features: ["1 Notebook", "1 Task", "1 Agent", "1 Community", "50 Monthly Credits"]
  },
  pro: {
    id: "pro", 
    name: "Pro",
    price: { monthly: 999, yearly: 9588 }, // $9.99 monthly, $95.88 yearly (20% off)
    credits: 1500,
    features: ["5 Notebooks", "10 Tasks", "5 Agents", "5 Communities", "1,500 Monthly Credits", "Transfer & Gift Credits"]
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: { monthly: 2900, yearly: 27840 }, // $29 monthly, $278.40 yearly (20% off)
    credits: 6000,
    features: ["Unlimited Notebooks", "Unlimited Tasks", "Unlimited Agents", "Unlimited Communities", "6,000 Monthly Credits", "Transfer & Gift Credits", "Early Access to New Features"]
  }
};

export function registerSubscriptionRoutes(app: Express) {
  
  // Get subscription plans
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      res.json(Object.values(SUBSCRIPTION_PLANS));
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Get user's current subscription and credits
  app.get("/api/subscription/status", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      // Get user's subscription and credits
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserCredits(userId);
      
      res.json({
        subscription: subscription || { planId: "free", status: "active" },
        credits: credits || { balance: 50, monthlyAllowance: 50 }
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // Create payment intent for subscription
  app.post("/api/subscription/create-payment-intent", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { planId, isYearly } = req.body;

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const amount = isYearly ? plan.price.yearly : plan.price.monthly;
      
      if (amount === 0) {
        return res.status(400).json({ error: "Cannot create payment for free plan" });
      }

      const user = await storage.getUser(userId);
      if (!user?.email) {
        return res.status(400).json({ error: "User email required for payment" });
      }

      // Initialize Paystack transaction
      const transaction = await paystackRequest("/transaction/initialize", "POST", {
        email: user.email,
        amount: amount, // Paystack expects amount in kobo for NGN, but we'll use cents for USD
        currency: "USD", // Force USD currency
        metadata: {
          userId,
          planId,
          isYearly: isYearly.toString(),
          custom_fields: [{
            display_name: "User ID",
            variable_name: "user_id",
            value: userId
          }]
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/subscription/cancel`
      });

      if (transaction.status) {
        res.json({ 
          authorization_url: transaction.data.authorization_url,
          access_code: transaction.data.access_code,
          reference: transaction.data.reference
        });
      } else {
        throw new Error(transaction.message || "Failed to initialize transaction");
      }
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Handle successful payment and update subscription
  app.post("/api/subscription/confirm-payment", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { paymentIntentId } = req.body;

      // Verify transaction with Paystack
      const verification = await paystackRequest(`/transaction/verify/${paymentIntentId}`);
      
      if (verification.data.status !== 'success') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      const { planId, isYearly } = verification.data.metadata;
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Create or update subscription
      const subscription = await storage.createOrUpdateSubscription(userId, {
        planId,
        status: "active",
        stripeCustomerId: verification.data.customer?.customer_code || null,
        stripePaymentIntentId: paymentIntentId,
        isYearly: isYearly === "true"
      });

      // Grant credits
      await storage.addCredits(userId, plan.credits, "subscription_grant", "Monthly subscription credits");

      res.json({ subscription, success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Pay with credits
  app.post("/api/subscription/pay-with-credits", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { planId, isYearly } = req.body;

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const amount = isYearly ? plan.price.yearly : plan.price.monthly;
      const creditsRequired = Math.ceil(amount / 100); // 1 credit = 1 cent

      // Check user's credit balance
      const userCredits = await storage.getUserCredits(userId);
      if (!userCredits || (userCredits.balance || 0) < creditsRequired) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      // Deduct credits and update subscription
      await storage.deductCredits(userId, creditsRequired, "subscription_payment", `${plan.name} subscription payment`);
      
      const subscription = await storage.createOrUpdateSubscription(userId, {
        planId,
        status: "active",
        isYearly: isYearly
      });

      // Grant subscription credits
      await storage.addCredits(userId, plan.credits, "subscription_grant", "Monthly subscription credits");

      res.json({ subscription, success: true });
    } catch (error) {
      console.error("Error processing credit payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Get usage dashboard data
  app.get("/api/subscription/dashboard", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      const subscription = await storage.getUserSubscription(userId);
      const credits = await storage.getUserCredits(userId);
      const transactions = await storage.getCreditTransactions(userId, 10); // Last 10 transactions
      const usage = await storage.getMonthlyUsage(userId);

      res.json({
        subscription: subscription || { planId: "free", status: "active" },
        credits: credits || { balance: 50, monthlyAllowance: 50 },
        usage,
        recentTransactions: transactions
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Gift credits to another user
  app.post("/api/subscription/gift-credits", jwtAuth, async (req: any, res) => {
    try {
      const fromUserId = getJwtUserId(req);
      const { toUserId, amount, message } = req.body;

      if (amount <= 0 || amount > 1000) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Check sender's balance
      const senderCredits = await storage.getUserCredits(fromUserId);
      if (!senderCredits || (senderCredits.balance || 0) < amount) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      // Check if recipient exists
      const recipient = await storage.getUser(toUserId);
      if (!recipient) {
        return res.status(400).json({ error: "Recipient not found" });
      }

      // Process the gift
      await storage.giftCredits(fromUserId, toUserId, amount, message);

      res.json({ success: true, message: "Credits gifted successfully" });
    } catch (error) {
      console.error("Error gifting credits:", error);
      res.status(500).json({ error: "Failed to gift credits" });
    }
  });

  // Purchase additional credits
  app.post("/api/subscription/purchase-credits", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { amount } = req.body; // Amount in credits

      const priceInCents = amount * 1; // 1 credit = 1 cent USD
      
      const user = await storage.getUser(userId);
      if (!user?.email) {
        return res.status(400).json({ error: "User email required for payment" });
      }

      // Initialize Paystack transaction for credit purchase
      const transaction = await paystackRequest("/transaction/initialize", "POST", {
        email: user.email,
        amount: priceInCents,
        currency: "USD", // Force USD currency
        metadata: {
          userId,
          type: "credit_purchase",
          creditAmount: amount.toString(),
          custom_fields: [{
            display_name: "Credit Amount",
            variable_name: "credit_amount",
            value: amount.toString()
          }]
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/credits/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/credits/cancel`
      });

      if (transaction.status) {
        res.json({ 
          authorization_url: transaction.data.authorization_url,
          access_code: transaction.data.access_code,
          reference: transaction.data.reference
        });
      } else {
        throw new Error(transaction.message || "Failed to initialize transaction");
      }
    } catch (error) {
      console.error("Error creating credit purchase:", error);
      res.status(500).json({ error: "Failed to create credit purchase" });
    }
  });
}