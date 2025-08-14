import React from "react";

export const metadata = {
  title: "Legal & Compliance | TurraniX",
  description: "Privacy Policy and Terms of Service for TurraniX, India's skill-based real-money gaming platform.",
  keywords: [
    "TurraniX legal",
    "privacy policy",
    "terms of service",
    "compliance",
    "real-money gaming India",
    "esports law"
  ],
  openGraph: {
    title: "Legal & Compliance | TurraniX",
    description: "Privacy Policy and Terms of Service for TurraniX, India's skill-based real-money gaming platform.",
    url: "https://turrani-esports.vercel.app/settings/legal",
    siteName: "TurraniX",
    images: [
      {
                  url: "https://turrani-esports.vercel.app/logo.png",
        width: 512,
        height: 512,
        alt: "TurraniX Logo"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal & Compliance | TurraniX",
    description: "Privacy Policy and Terms of Service for TurraniX, India's skill-based real-money gaming platform.",
    site: "@turrani_esports",
    images: ["https://turrani-esports.vercel.app/logo.png"]
  },
  alternates: {
    canonical: "https://turrani-esports.vercel.app/settings/legal"
  }
};

export default function LegalPage() {
  return (
    <div className="pt-16 pb-20 px-2 bg-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-center text-white">⚖️ Legal & Compliance</h1>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl p-6 md:p-10 text-white overflow-auto">
          <h2 className="text-2xl font-bold mb-4">📜 Privacy Policy – TurraniX</h2>
          <p className="mb-2"><b>Effective Date:</b> 2024-06-09<br/><b>Last Updated:</b> 2024-06-09</p>
          <p className="mb-4">TurraniX ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our app and services.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">🔐 1. Information We Collect</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><b>Personal Info:</b> Name, email, phone number, UPI ID, device ID</li>
            <li><b>Gameplay Data:</b> Match stats, kills, rewards, screenshots</li>
            <li><b>Transaction Data:</b> Coins purchased, UPI payouts, transaction history</li>
            <li><b>Device Info:</b> OS version, IP address, device type for security</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">📦 2. How We Use Your Data</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Create and manage your account</li>
            <li>Verify match results and payouts</li>
            <li>Provide customer support</li>
            <li>Improve our platform and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">📤 3. Data Sharing</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>We <b>do not sell your data</b>. We only share your data with:</li>
            <li>Payment providers (e.g., UPI systems)</li>
            <li>Customer support & verification tools</li>
            <li>Legal authorities if required by law</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">🔒 4. Data Security</h3>
          <p className="mb-4">Your data is encrypted and stored securely. We use modern tools to protect against unauthorized access, alteration, or disclosure.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">👶 5. Age Restriction</h3>
          <p className="mb-4">TurraniX is intended for users <b>aged 14 and above</b>. If you're under 18, parental guidance is recommended.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">🗑️ 6. Data Deletion</h3>
          <p className="mb-4">You can request account deletion anytime by contacting us at <a href="mailto:support@turraniesports.com" className="text-blue-400 underline">support@turraniesports.com</a> or via Telegram.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">📞 7. Contact Us</h3>
          <p className="mb-4">If you have questions, contact us at:<br/>
            📧 Email: <a href="mailto:support@turraniesports.com" className="text-blue-400 underline">support@turraniesports.com</a><br/>
            📲 Telegram: <a href="https://t.me/turraniEsports" className="text-blue-400 underline">https://t.me/turraniEsports</a>
          </p>
          <hr className="my-8 border-white/20" />
          <h2 className="text-2xl font-bold mb-4">📄 Terms of Service – TurraniX</h2>
          <p className="mb-4"><b>By using the TurraniX app, you agree to the following terms.</b></p>
          <h3 className="text-xl font-semibold mt-6 mb-2">🎮 1. Eligibility</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>You must be <b>14 years or older</b> to use our app. Players under 18 should have parental permission.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">💰 2. Gameplay & Rewards</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>All matches are <b>skill-based</b> (not gambling).</li>
            <li>Entry fees are paid using coins. Winners earn real-money rewards based on performance.</li>
            <li>Results are verified within <b>20 minutes</b> using screenshots and kill data.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">🧾 3. Payments & Withdrawals</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Winnings are transferred via <b>UPI</b>.</li>
            <li>Minimum withdrawal: [Set amount]</li>
            <li>Fake or unclear screenshots can result in rejection or ban.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">🚫 4. Fair Use & Rules</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>You agree not to:</li>
            <li>Use cheats or hacks</li>
            <li>Submit fake screenshots or false kills</li>
            <li>Create multiple fake accounts</li>
            <li>Abuse or harass other users or staff</li>
            <li>Violation will lead to a permanent ban without refund.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">📉 5. Refund Policy</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Entry fees are <b>non-refundable</b> once a match starts.</li>
            <li>In case of technical issues, coins may be refunded after review.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">🛠️ 6. App Downtime</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>We may occasionally perform maintenance. We are not responsible for losses during downtimes or bugs, but will try to resolve them quickly.</li>
          </ul>
          <hr className="my-8 border-white/20" />
          <h2 className="text-xl font-bold mb-4">✅ Final Note</h2>
          <p>By using the app, you confirm that you have read and agree to our <b>Privacy Policy</b> and <b>Terms of Service</b>.</p>
        </div>
      </div>
    </div>
  );
} 