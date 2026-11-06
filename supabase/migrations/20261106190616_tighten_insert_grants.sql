-- Registration timestamps, deletion metadata and generated IDs cannot be forged by clients.
revoke insert on public.profiles, public.spaces, public.space_members,
  public.categories, public.locations, public.people, public.events,
  public.event_participants, public.media, public.comments, public.memories
  from authenticated;

grant insert (id, display_name, avatar_storage_path) on public.profiles to authenticated;
grant insert (name, description, created_by) on public.spaces to authenticated;
grant insert (space_id, user_id, role) on public.space_members to authenticated;
grant insert (space_id, name, icon, created_by) on public.categories to authenticated;
grant insert (space_id, name, city, state, country, latitude, longitude, created_by)
  on public.locations to authenticated;
grant insert (space_id, name, nickname, description, avatar_storage_path, created_by)
  on public.people to authenticated;
grant insert (space_id, parent_event_id, title, description, moment_type, timeline_position,
  date_precision, start_year, start_month, start_day, end_year, end_month, end_day,
  approximate_date_label, location_id, category_id, created_by) on public.events to authenticated;
grant insert (space_id, event_id, person_id, created_by) on public.event_participants to authenticated;
grant insert (id, space_id, event_id, uploaded_by, storage_path, media_type, mime_type,
  file_size_bytes, original_filename, description, taken_at, width, height)
  on public.media to authenticated;
grant insert (space_id, event_id, user_id, content) on public.comments to authenticated;
grant insert (space_id, event_id, created_by, content) on public.memories to authenticated;
