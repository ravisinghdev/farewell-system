-- Fix notification triggers to use valid enum values
-- Valid values: 'message', 'mention', 'system', 'request', 'finance', 'duty'

-- 1. Drop conflicting check constraint if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Update triggers
CREATE OR REPLACE FUNCTION public.notify_contribution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Approved', 'Your contribution of ' || NEW.amount || ' has been approved.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Rejected', 'Your contribution has been rejected. Please check details.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'mismatch_error' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Issue', 'There is a mismatch issue with your contribution.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'paid_pending_admin_verification' AND OLD.status != 'paid_pending_admin_verification' THEN
       -- Optional: Notify user that payment is received and pending
       INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
       VALUES (NEW.user_id, NEW.farewell_id, 'Payment Received', 'We received your payment. Waiting for admin verification.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_new_content()
RETURNS TRIGGER AS $$
DECLARE
  _title TEXT;
  _msg TEXT;
  _link TEXT;
  _type notif_type;
BEGIN
  IF TG_TABLE_NAME = 'announcements' THEN
    _title := 'New Announcement';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/announcements';
    _type := 'system'; -- Changed from 'announcement'
  ELSIF TG_TABLE_NAME = 'timeline_events' THEN
    _title := 'Timeline Updated';
    _msg := 'New event: ' || substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/timeline';
    _type := 'system'; -- Changed from 'info'
  ELSIF TG_TABLE_NAME = 'highlights' THEN
    _title := 'New Highlight';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/highlights';
    _type := 'system'; -- Changed from 'info'
  END IF;

  -- Insert for all active members except the creator
  INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
  SELECT user_id, NEW.farewell_id, _title, _msg, _type, _link
  FROM public.farewell_members
  WHERE farewell_id = NEW.farewell_id
  AND user_id != auth.uid(); -- Don't notify self

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
