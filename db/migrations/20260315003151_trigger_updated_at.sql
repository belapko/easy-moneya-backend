-- migrate:up
create or replace function set_updated_at()
    returns trigger
as
$$
begin
    if new is distinct from old then
        new.updated_at = now();
    end if;

    return new;
end;
$$ language plpgsql;

create trigger users_set_updated_at
    before update
    on users
    for each row
execute function set_updated_at();

create trigger categories_set_updated_at
    before update
    on categories
    for each row
execute function set_updated_at();

create or replace function protect_reserved_categories()
    returns trigger
as
$$
begin
    if old.code = 'uncategorized' then
        if tg_op = 'DELETE' then
            raise exception 'Reserved category "uncategorized" cannot be deleted'
                using errcode = 'check_violation';
        end if;

        if new.user_id is distinct from old.user_id
            or new.kind is distinct from old.kind
            or new.code is distinct from old.code
            or new.is_system is distinct from old.is_system
            or new.is_archived is distinct from old.is_archived then
            raise exception 'Reserved category "uncategorized" cannot change protected fields'
                using errcode = 'check_violation';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger categories_protect_reserved
    before update or delete
    on categories
    for each row
execute function protect_reserved_categories();

create trigger transactions_set_updated_at
    before update
    on transactions
    for each row
execute function set_updated_at();


-- migrate:down
drop trigger if exists transactions_set_updated_at on transactions;

drop trigger if exists categories_protect_reserved on categories;

drop trigger if exists categories_set_updated_at on categories;

drop trigger if exists users_set_updated_at on users;

drop function if exists protect_reserved_categories();

drop function if exists set_updated_at();
