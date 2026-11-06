-- CHECK constraints run as the writer; this pure validator must be executable.
grant execute on function private.valid_date_parts(smallint, smallint, smallint) to authenticated;
