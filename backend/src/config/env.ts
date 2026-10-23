import "dotenv/config";

export const env = {
  apiPort: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  sessionCookie: "intercomms_session",
  sessionDays: 7
};
