-- Allow users to update their own payment orders (needed for manual verification)
create policy "Users can update their own orders"
  on public.payment_orders
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Explicitly grant update permission just in case
grant update on public.payment_orders to authenticated;
