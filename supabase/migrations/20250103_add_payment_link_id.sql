-- Add payment_link_id to contributions
alter table public.contributions
add column if not exists payment_link_id uuid references public.payment_links(id);

-- Add index for performance
create index if not exists idx_contributions_payment_link_id on public.contributions(payment_link_id);
