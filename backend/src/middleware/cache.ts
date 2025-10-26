// backend/src/middleware/cache.ts
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express'; // Import Express types

// Create and configure the Redis client
const client = createClient({
  url: 'redis://localhost:6379' // Specify your Redis server URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Initialize the connection (you might want to call this elsewhere in your app)
(async () => {
  await client.connect();
})();

// Your middleware
export const cache = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Your cache implementation here
    next();
  };
};