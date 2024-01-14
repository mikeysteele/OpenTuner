FROM denoland/deno:2.0.0

# Install FFMPEG for transcoding/stream management
# The denoland/deno image is typically based on Debian/Ubuntu
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire monorepo to ensure shared packages are available
COPY . .

# Cache dependencies for the API
RUN deno cache apps/api/main.ts

# Expose API port
EXPOSE 8000

# Run the API directly (using the task shortcut defined in root or running main directly)
# Assuming 'deno task dev:api' runs 'deno run -A --unstable-net main.ts' inside apps/api
# We can just run the command directly to be explicit and avoid task overhead if desired, 
# but tasks are convenient.
CMD ["deno", "task", "dev:api"]
