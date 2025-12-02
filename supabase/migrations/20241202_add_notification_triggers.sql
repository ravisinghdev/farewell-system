-- Function to notify user on contribution status change
CREATE OR REPLACE FUNCTION public.notify_contribution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Approved', 'Your contribution of ' || NEW.amount || ' has been approved.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Rejected', 'Your contribution has been rejected. Please check details.', 'error', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'mismatch_error' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Issue', 'There is a mismatch issue with your contribution.', 'warning', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'paid_pending_admin_verification' AND OLD.status != 'paid_pending_admin_verification' THEN
       -- Optional: Notify user that payment is received and pending
       INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
       VALUES (NEW.user_id, NEW.farewell_id, 'Payment Received', 'We received your payment. Waiting for admin verification.', 'info', '/dashboard/' || NEW.farewell_id || '/contributions');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contribution_status_change ON public.contributions;
CREATE TRIGGER on_contribution_status_change
AFTER UPDATE ON public.contributions
FOR EACH ROW
EXECUTE PROCEDURE public.notify_contribution_update();

-- Function to notify all members on new content
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
    _type := 'announcement';
  ELSIF TG_TABLE_NAME = 'timeline_events' THEN
    _title := 'Timeline Updated';
    _msg := 'New event: ' || substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/timeline';
    _type := 'info';
  ELSIF TG_TABLE_NAME = 'highlights' THEN
    _title := 'New Highlight';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/highlights';
    _type := 'info';
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

DROP TRIGGER IF EXISTS on_new_announcement ON public.announcements;
CREATE TRIGGER on_new_announcement
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();

DROP TRIGGER IF EXISTS on_new_timeline_event ON public.timeline_events;
CREATE TRIGGER on_new_timeline_event
AFTER INSERT ON public.timeline_events
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();

DROP TRIGGER IF EXISTS on_new_highlight ON public.highlights;
CREATE TRIGGER on_new_highlight
AFTER INSERT ON public.highlights
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();
