export const demoAccount = {
  email: process.env.DEMO_EMAIL || 'demo@teamhub.dev',
  password: process.env.DEMO_PASSWORD || 'Demo1234!',
};

export const newMemberEmail = process.env.NEW_MEMBER_EMAIL || `newmember${Date.now()}@example.com`;
