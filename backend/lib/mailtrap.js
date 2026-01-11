import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env is loaded even if the server is started from /backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TOKEN = process.env.MAILTRAP_TOKEN;

export const mailtrapClient = TOKEN ? new MailtrapClient({ token: TOKEN }) : null;

export const sender = {
	email: process.env.EMAIL_FROM,
	name: process.env.EMAIL_FROM_NAME,
};