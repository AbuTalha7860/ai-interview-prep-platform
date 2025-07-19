// import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './utils/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_kdNAwOxlJ6Z3@ep-silent-hill-aemjor6w-pooler.c-2.us-east-2.aws.neon.tech/ai-interview-mocker?sslmode=require&channel_binding=require',
  },
});