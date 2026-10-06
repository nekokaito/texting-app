const rawUrl = process.env.EXPO_PUBLIC_API_URL || "";
export const API_URL = rawUrl.replace(/\/$/, "");