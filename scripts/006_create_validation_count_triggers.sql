-- Create function to update helpful/not_helpful counts on content_warnings
create or replace function public.update_warning_validation_counts()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_helpful then
      update public.content_warnings
      set helpful_count = helpful_count + 1
      where id = new.warning_id;
    else
      update public.content_warnings
      set not_helpful_count = not_helpful_count + 1
      where id = new.warning_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.is_helpful and not new.is_helpful then
      update public.content_warnings
      set helpful_count = helpful_count - 1,
          not_helpful_count = not_helpful_count + 1
      where id = new.warning_id;
    elsif not old.is_helpful and new.is_helpful then
      update public.content_warnings
      set helpful_count = helpful_count + 1,
          not_helpful_count = not_helpful_count - 1
      where id = new.warning_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.is_helpful then
      update public.content_warnings
      set helpful_count = helpful_count - 1
      where id = old.warning_id;
    else
      update public.content_warnings
      set not_helpful_count = not_helpful_count - 1
      where id = old.warning_id;
    end if;
  end if;
  return new;
end;
$$;

-- Add trigger to update validation counts
drop trigger if exists update_validation_counts on public.warning_validations;
create trigger update_validation_counts
  after insert or update or delete on public.warning_validations
  for each row
  execute function public.update_warning_validation_counts();
