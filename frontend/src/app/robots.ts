import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const adminPath = (process.env.ADMIN_PATH || "/admin").replace(/\/+$/, "");
  const blockedPaths = [...new Set(["/admin", "/admin/", adminPath, `${adminPath}/`])];
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: blockedPaths,
    },
  };
}
