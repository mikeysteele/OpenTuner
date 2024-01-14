FROM denoland/deno:2.0.0

WORKDIR /app

# Prefer not to run as root.
# USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts or deno.json changes).
# Ideally we would copy only package.json/deno.json files first, but given the monorepo structure,
# we need to exercise care. For simplicity, we copy everything.
COPY . .

# Compile the main app so that it doesn't need to be compiled each startup/entry.
# "deno cache" is the standard command for this.
RUN deno cache apps/api/main.ts
# Also cache web dependencies if needed, or build the web app
# If the web app is static (Vite), we should build it. 
# But "deno task dev:web" runs a dev server.
# For production, we usually want "deno task build" and serve static.
# However, the user's "deno task start" runs "dev:api" and "dev:web".
# To match the user's dev experience exactly in Docker (as requested "to build this thing"),
# we will stick to the dev commands or the unified start command.
# For a production image, we would build the vite app and serve it via the API.
# Let's assume we want to run the provided "deno task start".

# Expose ports
EXPOSE 8000
EXPOSE 5173

CMD ["deno", "task", "start"]
