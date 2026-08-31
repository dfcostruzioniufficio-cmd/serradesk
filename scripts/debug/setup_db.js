import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

// Usually connection string is not exposed in .env, but let's check
const sql = postgres(process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:PASSWORD@db.') + '.supabase.co:5432/postgres');
// I don't have the password, I can't use postgres client.
