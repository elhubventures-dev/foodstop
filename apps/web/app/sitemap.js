export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foodstop.com.ng';

  // In a real scenario, you'd fetch dynamic items from Supabase
  // For demo, we just map the static routes
  const routes = [
    '',
    '/menu',
    '/auth/login',
    '/auth/signup'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
