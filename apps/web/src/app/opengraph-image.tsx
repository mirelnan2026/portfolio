import { ImageResponse } from "next/og";
import { sentences } from "@/features/portfolio/format";
import { getProfile } from "@/features/portfolio/queries";

const size = { width: 1200, height: 630 };
const contentType = "image/png";

/** The share card's alt text comes from the profile, like the card itself. */
export async function generateImageMetadata() {
  const profile = await getProfile();
  const [role = profile.headline] = profile.headline.split(" · ");
  return [{ id: "card", alt: `${profile.name}, ${role}`, size, contentType }];
}

/**
 * The image LinkedIn, Slack and search show for a shared link, drawn at build time from the profile, in the light
 * theme's colours (hex, because the image renderer has no OKLCH) and Geist, the font next/og ships with.
 */
export default async function OpengraphImage() {
  const profile = await getProfile();
  const [role = profile.headline, ...focus] = profile.headline.split(" · ");
  const [firstSentence = profile.intro] = sentences(profile.intro);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#ffffff",
        color: "#0a0a0a",
        borderLeft: "16px solid #00786f",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 96, letterSpacing: "-0.035em", lineHeight: 1 }}>{profile.name}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 40, lineHeight: 1.3 }}>
          <span>{role}</span>
          {focus.length > 0 && <span style={{ color: "#00786f" }}>{focus.join(" · ")}</span>}
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.45, color: "#6c6c6c", maxWidth: 980 }}>
          {firstSentence}
        </div>
      </div>
      <div style={{ fontSize: 28, color: "#6c6c6c" }}>mirelnan.dev</div>
    </div>,
    size,
  );
}
