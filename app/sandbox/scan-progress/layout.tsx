import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Scan progress sandbox | Subtext",
  description: "Simulated scan progress for demos and UI testing. No API calls.",
  robots: { index: false, follow: false },
}

export default function SandboxScanProgressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
