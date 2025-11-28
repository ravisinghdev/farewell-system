-- 1. Create 'General' channels for farewells that don't have one
INSERT INTO public.chat_channels (id, scope_id, type, name, created_by)
SELECT 
  uuid_generate_v4(), -- Generate new ID
  f.id,               -- Farewell ID
  'group',            -- Type
  'General',          -- Name
  f.created_by        -- Creator (owner of farewell)
FROM public.farewells f
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_channels cc 
  WHERE cc.scope_id = f.id AND cc.name = 'General'
);

-- 2. Add ALL farewell members to the 'General' channel of their farewell
INSERT INTO public.chat_members (channel_id, user_id, status, role)
SELECT 
  cc.id,              -- Channel ID (The General channel)
  fm.user_id,         -- User ID (From farewell members)
  'active',           -- Status
  'member'            -- Role
FROM public.farewell_members fm
JOIN public.chat_channels cc ON cc.scope_id = fm.farewell_id
WHERE cc.name = 'General' -- Only target General channels
AND NOT EXISTS (
  SELECT 1 FROM public.chat_members cm 
  WHERE cm.channel_id = cc.id AND cm.user_id = fm.user_id
);

-- 3. Also add the Farewell Creators (Admins) if they are not in farewell_members
INSERT INTO public.chat_members (channel_id, user_id, status, role)
SELECT 
  cc.id,
  f.created_by,
  'active',
  'admin'
FROM public.farewells f
JOIN public.chat_channels cc ON cc.scope_id = f.id
WHERE cc.name = 'General'
AND f.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.chat_members cm 
  WHERE cm.channel_id = cc.id AND cm.user_id = f.created_by
);
