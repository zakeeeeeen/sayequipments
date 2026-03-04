
import { getSiteSettings } from "@/app/actions/settings"
import { AboutContent } from "@/components/about/about-content"

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSiteSettings()

  return <AboutContent settings={settings} />
}
