alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;
