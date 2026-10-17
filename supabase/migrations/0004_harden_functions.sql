-- 0004: harden SECURITY DEFINER functions per security advisors (lint 0028/0029).
-- handle_new_user is only invoked by the trigger: no role needs EXECUTE.
-- user_daycare_id must stay executable by authenticated: the "member can read
-- own daycare" policy on daycares calls it as the invoking role.

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.user_daycare_id() from anon, public;
