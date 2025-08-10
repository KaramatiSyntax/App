import React from "react";

export const metadata = {
  title: "About Us | Turrani Esports",
  description: "Learn about Turrani Esports, India’s fastest growing competitive gaming platform. Discover our mission, vision, and what makes us different.",
  keywords: [
    "Turrani Esports",
    "About Turrani Esports",
    "Indian esports",
    "Free Fire tournaments",
    "Skill-based gaming",
    "Esports India",
    "Competitive gaming platform",
    "Earn money gaming",
    "Telegram esports India",
    "Turrani founders",
    "Mobile esports platform"
  ],
  openGraph: {
    title: "About Us | Turrani Esports",
    description: "Turrani Esports is India’s fastest growing competitive gaming platform. Learn about our mission, vision, and what makes us different.",
    url: "https://turrani-esports.vercel.app/settings/about-us",
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
    title: "About Us | Turrani Esports",
    description: "Turrani Esports is India’s fastest growing competitive gaming platform. Learn about our mission, vision, and what makes us different.",
    site: "@turrani_esports",
    images: ["https://turrani-esports.vercel.app/logo.png"]
  },
  alternates: {
    canonical: "https://turrani-esports.vercel.app/settings/about-us"
  }
};

export default function AboutUsPage() {
  return (
    <div className="pt-16 pb-20 px-2 bg-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-center text-white">🎮 About Turrani Esports</h1>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl p-6 md:p-10 text-white overflow-auto">
          <h2 className="text-2xl font-bold mb-4">India’s Fastest Growing Competitive Gaming Platform</h2>
          <h3 className="text-xl font-semibold mt-6 mb-2">🔥 What is Turrani Esports?</h3>
          <p>Turrani Esports is a next-gen mobile gaming platform where players can join paid competitive matches, earn real cash rewards, and grow their gaming career. Focused primarily on Free Fire, the platform hosts custom matches daily – including Lone Wolf, Clash Squad, and Battle Royale formats.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">🎯 Our Mission</h3>
          <p>We aim to provide every Indian gamer with a fair and transparent platform to monetize their skills and experience real competition. No luck, no gambling – just pure skill-based gaming.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">👨‍💻 What Makes Us Different?</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>🔹 Telegram-integrated screenshot and result system</li>
            <li>🔹 Profit-sharing model for match managers</li>
            <li>🔹 Instant match updates</li>
            <li>🔹 Events with stage wise tournaments</li>
            <li>🔹 100% skill-based earning, no luck or gambling</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">📲 How to Get Started?</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>👉 Install the App from our landing page: <a href="https://turrani-esports.vercel.app/" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://turrani-esports.vercel.app/</a></li>
            <li>Choose a match and pay the entry fee</li>
            <li>Play your match and submit the screenshot</li>
            <li>👉 <b>Join our Telegram</b>: <a href="https://t.me/turraniEsports" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">Turrani eSports</a></li>
            <li>💸 Match results will be processed within 20 minutes, and winnings will be credited to your account!</li>
          </ol>
          <h3 className="text-xl font-semibold mt-6 mb-2">🌟 Join the Revolution</h3>
          <p>Whether you're a casual gamer or a competitive beast, Turrani Esports gives you the platform to compete, earn, and grow. Be part of India’s fastest-growing esports movement today.</p>
          <h4 className="text-lg font-semibold mt-6 mb-2">🔗 Useful Links</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>📲 Telegram: <a href="https://t.me/turraniEsports" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://t.me/turraniEsports</a></li>
            <li>📥 Download App: <a href="https://turrani-esports.vercel.app/" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://turrani-esports.vercel.app/</a></li>
            <li>📸 Instagram: <a href="https://instagram.com/turrani_esports" className="text-pink-400 underline" target="_blank" rel="noopener noreferrer">@turrani_esports</a></li>
          </ul>
          <p className="mt-2">💬 Want to become a match manager or have questions? DM us on Telegram!</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">🧠 About Turrani Esports</h3>
          <p>Turrani Esports is a Made-in-India mobile esports platform built to provide fair, transparent, and skill-based competitive gaming for Free Fire players. From entry-level 1v1 Lone Wolf duels to 4v4 Clash Squad and Battle Royale matches, Turrani Esports enables gamers to earn real money while doing what they love.</p>
          <h3 className="text-xl font-semibold mt-6 mb-2">👨‍💼 Founder’s Vision</h3>
          <p>The idea of Turrani Esports was born from two student entrepreneur from Bihar, Vinayak Shukla and Manas Shukla. They are just 16 and 14 years old boys — developed for someone who understood both the struggles of low-trust gaming platforms and the potential of competitive gaming in India. The founder’s vision is simple but powerful:</p>
          <blockquote className="bg-white/10 border-l-4 border-blue-400 p-4 my-4 text-white">
            “Give every skilled gamer in India a chance to earn, grow, and shine—without hacks, gambling, or fake promises.”
          </blockquote>
          <ul className="list-disc pl-6 space-y-1">
            <li>Skill should be rewarded fairly</li>
            <li>Young gamers deserve a legit platform to grow</li>
            <li>Transparency and fast payouts are non-negotiable</li>
            <li>Esports should be accessible, not elite</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">🌍 Long-Term Mission</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>💼 Create job opportunities via manager recruitment</li>
            <li>🎓 Launch Free Esports campaigns.</li>
            <li>🧩 Build a full-stack Esports Ecosystem including coaching, leaderboard sponsorships, and merchandise</li>
            <li>🚀 Expand to more games & host monthly tournaments with ₹10K+ prize pools</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">📲 Join Us</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Telegram Community: <a href="https://t.me/turraniEsports" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://t.me/turraniEsports</a></li>
            <li>Download & Play: <a href="https://turrani-esports.vercel.app/" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">https://turrani-esports.vercel.app</a></li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-2">✅ Conclusion</h3>
          <p>Turrani Esports is more than just a gaming platform — it’s a movement to empower the next generation of Indian gamers. Built by passionate youth, for passionate youth, we stand for fair play, fast growth, and financial freedom through gaming.</p>
          <p>Whether you're a casual player looking to earn from your skills or a serious competitor ready to dominate the leaderboard, Turrani Esports welcomes you.</p>
          <h2 className="text-2xl font-bold mt-8 mb-2">🎮 Compete with skill. Earn with pride. Rise with Turrani.</h2>
          <p className="font-semibold text-lg">The future of Indian esports starts here. Are you in?</p>
        </div>
      </div>
    </div>
  );
} 