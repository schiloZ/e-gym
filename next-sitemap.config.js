/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://e-gym.top", // Replace with your actual domain
  generateRobotsTxt: true, // Generates robots.txt
  sitemapSize: 7000, // Max URLs per sitemap file
  changefreq: "daily", // Update frequency for pages
  priority: 0.7, // Default priority for pages
  exclude: ["/dashboardAdmin/*", "/api/*"], // Exclude admin or API routes
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboardAdmin", "/api"],
      },
    ],
  },
};
