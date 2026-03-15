-- migrate:up
create type transaction_kind as enum ('income', 'expense');

create table categories
(
    id          uuid primary key     default gen_random_uuid(),
    user_id     uuid        not null references users (id) on delete cascade,
    kind        transaction_kind not null,
    code        text,
    name        text        not null,
    icon_key    text        not null,
    color       text,
    is_system   boolean     not null default false,
    is_archived boolean     not null default false,
    sort_order  integer     not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    constraint categories_code_not_blank check (code is null or btrim(code) <> ''),
    constraint categories_name_not_blank check (btrim(name) <> ''),
    constraint categories_icon_key_not_blank check (btrim(icon_key) <> ''),
    constraint categories_color_not_blank check (color is null or btrim(color) <> ''),
    constraint categories_reserved_code_requires_system check (code is null or is_system),
    constraint categories_id_user_kind_uq unique (id, user_id, kind),
    constraint categories_user_kind_code_uq unique (user_id, kind, code)
);

create unique index categories_user_kind_name_uq
    on categories (user_id, kind, lower(name))
    where is_archived = false;

create index categories_user_kind_sort_idx
    on categories (user_id, kind, sort_order, created_at);

create table transactions
(
    id           uuid primary key     default gen_random_uuid(),
    user_id      uuid        not null references users (id) on delete cascade,
    kind         transaction_kind not null,
    category_id  uuid        not null,
    amount_minor bigint      not null,
    description  text        not null default '',
    occurred_at  timestamptz not null default now(),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    constraint transactions_amount_minor_positive check (amount_minor > 0),
    constraint transactions_category_fk
        foreign key (category_id, user_id, kind)
            references categories (id, user_id, kind)
            on delete restrict
);

create index transactions_user_occurred_at_idx
    on transactions (user_id, occurred_at desc);

create index transactions_user_kind_occurred_at_idx
    on transactions (user_id, kind, occurred_at desc);

create index transactions_user_category_occurred_at_idx
    on transactions (user_id, category_id, occurred_at desc);


-- migrate:down
drop table if exists transactions;

drop table if exists categories;

drop type if exists transaction_kind;
