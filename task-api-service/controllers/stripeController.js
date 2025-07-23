import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_DEV, { apiVersion: '2025-06-30' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  basic: 'prod_SWSNSGtKXHpOqQ', // Basic plan price ID
  premium: 'prod_SWSOmJJ9ow6EpS', // Turbo plan price ID
  plaid: 'prod_SWSPrfNOZuTVJe' // Plaid plan price ID
};

const getTierFromPriceId = (priceId) => {
  if (priceId === PRICE_IDS.basic) return 'basic';
  if (priceId === PRICE_IDS.premium) return 'premium';
  if (priceId === PRICE_IDS.plaid) return 'plaid';
  throw new Error('Unknown priceId');
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, userId } = req.body;
    if (![PRICE_IDS.premium, PRICE_IDS.plaid].includes(priceId)) {
      return res.status(400).json({ error: 'Invalid priceId. Only Turbo or Plaid plans are supported.' });
    }

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      // Create Stripe customer if none exists
      const customer = await stripe.customers.create({
        metadata: { userId }
      });
      customerId = customer.id;
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://your-app.com/cancel',
      metadata: { userId }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (error || !user || !user.stripe_customer_id) {
      return res.status(404).json({ error: 'User or Stripe customer not found' });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: 'https://your-app.com/account'
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const userId = session.metadata.userId;
        if (!userId) {
          console.log('No userId in metadata');
          break;
        }
        const subscriptionId = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const tier = getTierFromPriceId(priceId);

        await supabase
          .from('users')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription: tier,
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        if (!userId) {
          console.log('No userId in metadata');
          break;
        }
        let updateData = {
          subscription_updated_at: new Date().toISOString()
        };
        if (subscription.status === 'active') {
          const priceId = subscription.items.data[0].price.id;
          const tier = getTierFromPriceId(priceId);
          updateData.subscription = tier;
          updateData.stripe_subscription_id = subscription.id;
        } else {
          updateData.subscription = 'basic';
          updateData.stripe_subscription_id = null;
        }

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        if (!userId) {
          console.log('No userId in metadata');
          break;
        }

        await supabase
          .from('users')
          .update({
            stripe_subscription_id: null,
            subscription: 'basic',
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const assignBasicPlan = async (userId, email) => {
  try {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    });

    // Update Supabase with customer details and basic subscription
    await supabase
      .from('users')
      .update({
        stripe_customer_id: customer.id,
        subscription: 'basic',
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Basic plan assignment error:', error);
    throw new Error('Failed to assign basic plan');
  }
};