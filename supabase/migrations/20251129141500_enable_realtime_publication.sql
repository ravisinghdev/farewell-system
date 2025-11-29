-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";
