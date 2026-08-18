const CLINIC = "360 Physio Clinic ALREHAB";

/** Small helper so each route ships its own unique head metadata. */
export const createFileRouteHead = (page: string, description: string) => () => ({
  meta: [
    { title: `${page} — ${CLINIC}` },
    { name: "description", content: description },
    { property: "og:title", content: `${page} — ${CLINIC}` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ],
});
