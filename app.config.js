export default ({ config }) => {
  return {
    ...config,
    extra: {
      authRedirectUrl: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      ...(config.extra || {}),
    },
  };
};
