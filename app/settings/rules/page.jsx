import React from "react";

export const metadata = {
  title: "Rules | Turrani Esports",
  description: "Official rules and guidelines for participating in Turrani Esports tournaments and matches.",
  keywords: [
    "Turrani Esports rules",
    "tournament rules",
    "esports guidelines",
    "fair play",
    "eligibility",
    "dispute resolution",
    "match participation"
  ],
  openGraph: {
    title: "Rules | Turrani Esports",
    description: "Official rules and guidelines for participating in Turrani Esports tournaments and matches.",
    url: "https://turrani-esports.vercel.app/settings/rules",
    siteName: "Turrani Esports",
    images: [
      {
                  url: "https://turrani-esports.vercel.app/logo.png",
        width: 512,
        height: 512,
        alt: "Turrani Esports Logo"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Rules | Turrani Esports",
    description: "Official rules and guidelines for participating in Turrani Esports tournaments and matches.",
    site: "@turrani_esports",
    images: ["https://turrani-esports.vercel.app/logo.png"]
  },
  alternates: {
    canonical: "https://turrani-esports.vercel.app/settings/rules"
  }
};

export default function RulesPage() {
  return (
    <div className="pt-16 pb-20 px-2 bg-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-center text-white">📜 Rules & Guidelines</h1>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl p-6 md:p-10 text-white overflow-auto">
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>Browse available tournaments and matches on the Events page.</li>
            <li>Ensure your profile is complete and your age is at least 14.</li>
            <li>Check if your state allows participation (see Legal & Compliance tab).</li>
            <li>Join a match by clicking 'Join' and pay the entry fee if required.</li>
            <li>Be present and ready 10 minutes before the match start time.</li>
            <li>Follow match instructions and report results promptly.</li>
            <li>Withdraw winnings from your wallet (KYC may be required).</li>
          </ul>
          <h2 className="text-2xl font-bold mb-4 mt-8">Eligibility</h2>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>You must be at least 14 years old to participate.</li>
            <li>Participation is not allowed from restricted states (Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, Sikkim, Tamil Nadu, etc.).</li>
            <li>By joining, you confirm you meet all legal requirements.</li>
          </ul>
          <h2 className="text-2xl font-bold mb-4 mt-8">General Rules & Fair Play</h2>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>All players must be registered with accurate details.</li>
            <li>Respect all participants and maintain sportsmanship.</li>
            <li>No abusive language, harassment, or discrimination.</li>
            <li>No cheating, hacking, or use of unauthorized software.</li>
            <li>Collusion or match-fixing is strictly prohibited.</li>
            <li>Accounts found violating fair play will be suspended or banned.</li>
          </ul>
          <h2 className="text-2xl font-bold mb-4 mt-8">Match Participation</h2>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>Be present 10 minutes before match start time.</li>
            <li>Use your registered game ID for all matches.</li>
            <li>Screenshots or video proof may be required for result verification.</li>
            <li>Report match results promptly and honestly.</li>
            <li>Disconnections may result in match forfeiture unless otherwise decided by organizers.</li>
          </ul>
          <h2 className="text-2xl font-bold mb-4 mt-8">Dispute Resolution</h2>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>All disputes must be reported within 24 hours of the match.</li>
            <li>Organizers' decisions are final and binding.</li>
            <li>Provide clear evidence (screenshots, chat logs) for any dispute.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 