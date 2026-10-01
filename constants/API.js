const rawUrl = process.env.EXPO_PUBLIC_API_URL || "";

// Removes trailing slash if present to avoid double-slash issues in requests
export const API_URL = rawUrl.replace(/\/$/, "");