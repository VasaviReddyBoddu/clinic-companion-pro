import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian Clinic — Care Management" },
      {
        name: "description",
        content:
          "Multilingual clinic management for patients, doctors and administrators: voice-assisted booking, video consultations, medical records and billing.",
      },
      { property: "og:title", content: "Meridian Clinic — Care Management" },
      {
        property: "og:description",
        content:
          "Book by voice in English, Telugu or Hindi, consult by video, and manage doctors, records and billing in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** The clinic app is a self-contained DOM application; React only mounts it. */
function ClinicApp() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await import("../legacy/meridian.css");
      await import("../legacy/extra.css");
      const { App } = await import("../legacy/meridian.js");
      await import("../legacy/features.js");
      if (cancelled) return;
      if (!location.hash) location.hash = "#/login";
      App.init();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <div id="app" />;
}

function Index() {
  return <ClientOnly fallback={<div style={{ minHeight: "100vh" }} />}>{<ClinicApp />}</ClientOnly>;
}
