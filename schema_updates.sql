-- Schema updates for SaaS features (tables and indexes only)

-- Update users table with subscription fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to transactions and invoices
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add new columns for multi-currency support
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS incoming_amount_thb DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS exchange_rate_mmk DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_destination JSONB,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2);

-- Update existing rows
UPDATE public.transactions t
SET user_id = c.user_id
FROM public.clients c
WHERE t.client_id = c.id
AND t.user_id IS NULL;

UPDATE public.invoices i
SET user_id = c.user_id
FROM public.clients c
WHERE i.client_id = c.id
AND i.user_id IS NULL;

-- Add constraints after data migration
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);