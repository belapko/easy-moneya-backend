-- migrate:up
create table users
(
    id            uuid primary key     default gen_random_uuid(),
    email         text        not null unique,
    name          text,
    password_hash text        not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- migrate:down
drop table if exists users;
