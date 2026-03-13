`docker compose -f .\docker-compose.dev.yml up -d`

`pnpm dbmate --url "postgresql://stepan:stepan@localhost:5432/easy-moneya?sslmode=disable" migrate`

For local development, the backend runs on the host machine, so `.env` should use `localhost` in `POSTGRES_URL` and `REDIS_URL`. Use Docker service names like `db` and `redis` only when the backend itself is running inside Docker.
