import type { Express } from "express";
import Stripe from "stripe";
import { jwtAuth, getJwtUserId } from "./auth";
import { storage } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

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

      // Create Stripe customer if doesn't exist
      const user = await storage.getUser(userId);
      let stripeCustomerId = await storage.getStripeCustomerId(userId);
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateStripeCustomerId(userId, stripeCustomerId);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: stripeCustomerId,
        metadata: {
          userId,
          planId,
          isYearly: isYearly.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
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

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      const { planId, isYearly } = paymentIntent.metadata;
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Create or update subscription
      const subscription = await storage.createOrUpdateSubscription(userId, {
        planId,
        status: "active",
        stripeCustomerId: paymentIntent.customer as string,
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

      const priceInCents = amount * 1; // 1 credit = 1 cent for now
      
      // Create Stripe customer if doesn't exist
      const user = await storage.getUser(userId);
      let stripeCustomerId = await storage.getStripeCustomerId(userId);
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateStripeCustomerId(userId, stripeCustomerId);
      }

      // Create payment intent for credit purchase
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: "usd",
        customer: stripeCustomerId,
        metadata: {
          userId,
          type: "credit_purchase",
          creditAmount: amount.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating credit purchase:", error);
      res.status(500).json({ error: "Failed to create credit purchase" });
    }
  });
}