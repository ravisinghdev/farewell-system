-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';
