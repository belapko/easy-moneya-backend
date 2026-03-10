`docker compose -f .\docker-compose.dev.yml up -d`

`pnpm dbmate --url "postgresql://stepan:stepan@localhost:5432/easy-moneya?sslmode=disable" migrate`
