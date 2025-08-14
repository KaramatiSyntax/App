import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/users";
import { cookies } from "next/headers";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-memory abuse memory (upgrade to Redis in production)
const warningMemory = new Map();

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const softAbuse = [
  "idiot", "stupid", "dumb", "moron", "chutiya", "chutya", "chootiya", "saala", "bc", "mc", "bkl", "ullu", "nibba", "nibbi"
];

const hardAbuse = [
  "bkl", "mc", "bc", "chutiya", "chutiye", "madarchod", "behenchod", "gandu",
  "lund", "bsdk", "gaand", "gand", "randi", "saala", "harami", "bhosdi", "bhosdike",
  "bhosadike", "jhant", "chodu", "chootiya", "suar", "kutte", "kamina", "fuck", "fucker",
  "motherfucker", "mf", "asshole", "bitch", "bastard", "slut", "dick", "shit", "suck", "lodu",
  "chod", "chodu", "loda", "r@ndi", "lund", "b@kl", "bakchod", "tatti", "pig", "moron", "idiot",
  "nibba", "nibbi"
];

const founderKeywords = ["vinayak", "manas", "founder", "owner", "Turranix"];

const warningMessages = [
  "⚠️ Please don't violate our Terms of Use. This is your first warning.",
  "⚠️ Terms of Use violation detected. This is your final warning.",
  "⚠️ You're violating our community guidelines. Please be respectful."
];

const roastResponses = [
  "Chal be, chutiye!",
  "Tere jaise gawaar se baat karke time waste nahi karta!",
  "Tameez seekh pehle, fir baat karna!",
  "Tu jaa pehle apni aukaat dekh!",
  "Gand faad denge agar founders ke khilaaf bola toh!",
  "Tu trolling samajh ke aaya, yeh Turranix hai, seedha treatment milega!",
  "Tumhare jaise noobs ko toh entry hi nahi milti Turranix mein!",
  "Bakwas band kar, warna leaderboard pe naam ke jagah insult dikhega!",
  "Tera attitude Turranix mein nahi, trash can mein fit hota hai!",
  "Tameez se baat kar, nahi toh AI bhi gaali deke jawaab dega!",
  "Founders ke against bola? Report ke sath roast free milega!",
  "Turranix ke server pe aaya, tameez toh la!",
  "Troll karne aaya tha? Tera bandwidth bhi waste gaya!",
  "Yahan rule simple hai – respect kro, nahi toh regret karo!",
  "bkl", "mc", "bc", "chutiya", "chutiye", "madarchod", "behenchod", "gandu",
  "lund", "bsdk", "gaand", "gand", "randi", "saala", "harami", "bhosdi", "bhosdike",
  "bhosadike", "jhant", "chodu", "chootiya", "suar", "kutte", "kamina", "fuck", "fucker",
  "motherfucker", "mf", "asshole", "bitch", "bastard", "slut", "dick", "shit", "suck", "lodu",
  "chod", "chodu", "loda", "r@ndi", "lund", "b@kl", "bakchod", "tatti", "pig", "moron", "idiot",
  "nibba", "nibbi"
];

const allAbuseVariants = [...softAbuse, ...hardAbuse];

function detectAbuse(msg) {
  const clean = normalize(msg);
  for (let word of allAbuseVariants) {
    const pattern = word.replace(/(.)/g, '$1\\s*');
    const regex = new RegExp(pattern, 'i');
    if (regex.test(clean)) return word;
  }
  return null;
}

function isFounderTargeted(msg) {
  const lower = msg.toLowerCase();
  return founderKeywords.some(name => lower.includes(name));
}

function getRandomRoast() {
  return roastResponses[Math.floor(Math.random() * roastResponses.length)];
}

function getWarningMessage(warningCount) {
  if (warningCount === 0) {
    return warningMessages[0];
  } else if (warningCount === 1) {
    return warningMessages[1];
  } else {
    return warningMessages[2];
  }
}

function createPrompt(userMsg, history, userData) {
  let historyText = '';
  if (Array.isArray(history)) {
    historyText = history.map((msg) => {
      return `${msg.type === 'user' ? 'User' : 'Bot'}: ${msg.text}`;
    }).join('\n');
  }

  const userContext = userData ? `
**USER DATA:**
- Username: ${userData.username}
- Coins: ${userData.coins}
- Email: ${userData.email}
- Status: ${userData.isSnoozed ? 'Snoozed' : 'Active'}
- Since: ${new Date(userData.createdAt).toLocaleDateString()}
` : '';

  const brandInfo = `
**ABOUT Turranix :**
-firstly the app name was turrani esports then by the time it was changed to Turranix,reason was to make it more unique and catchy. and easy to remember.
- (Founded by Vinayak Shukla and Manas Shukla) -- keep this private until the user ask the anmese of the founders and dont use a lot of aatisayokti words.
- Turranix is India's emerging esports brand organizing [1v1, 2v2, 4v4] tournaments across popular game free fire
- Our app features wallet, ranking system, fair-play automation, and rewards.
- Daily matches, verified payouts, trusted by most players in 2025.

Use this data to reply as a loyal, bold and witty chatbot. Protect Turranix reputation. Do not hesitate to warn or roast abusers if needed.
`;

  // Detect if user is asking about specific features that warrant buttons
  const userMsgLower = userMsg.toLowerCase();
  const isAskingAboutWallet = userMsgLower.includes('wallet') || userMsgLower.includes('money') || userMsgLower.includes('coins') || userMsgLower.includes('balance');
  const isAskingAboutEvents = userMsgLower.includes('event') || userMsgLower.includes('tournament') || userMsgLower.includes('match') || userMsgLower.includes('game');
  const isAskingAboutSocial = userMsgLower.includes('instagram') || userMsgLower.includes('telegram') || userMsgLower.includes('social') || userMsgLower.includes('contact');
  const isAskingAboutProfile = userMsgLower.includes('profile') || userMsgLower.includes('account') || userMsgLower.includes('settings');
  const isGeneralQuestion = userMsgLower.includes('how') || userMsgLower.includes('what') || userMsgLower.includes('where') || userMsgLower.includes('when') || userMsgLower.includes('why');

  const buttonGuidelines = `
**BUTTON GUIDELINES:**
- Only add buttons when they are RELEVANT to the user's question or request
- Use buttons sparingly and contextually
- Available buttons: [button:wallet]Check Wallet[/button], [button:telegram]Join Telegram[/button], [button:instagram]Follow Instagram[/button], [button:events]View Events[/button], [button:settings]Settings[/button], [button:profile]Profile[/button]
- Color formatting: [green]Success![/green], [red]Error![/red], [yellow]Wait...[/yellow]
- DO NOT add buttons randomly or without context
- For general questions, casual conversation, or greetings, avoid adding buttons
- Only add buttons when user specifically asks about wallet, events, social media, profile, or settings
`;

  const contextHint = `
**CONTEXT HINT:**
User message suggests: ${isAskingAboutWallet ? 'Wallet/Financial related' : isAskingAboutEvents ? 'Events/Tournaments related' : isAskingAboutSocial ? 'Social media related' : isAskingAboutProfile ? 'Profile/Settings related' : isGeneralQuestion ? 'General question' : 'Other topic'}
${isAskingAboutWallet ? 'Consider adding wallet button if helpful' : ''}
${isAskingAboutEvents ? 'Consider adding events button if helpful' : ''}
${isAskingAboutSocial ? 'Consider adding social media buttons if helpful' : ''}
${isAskingAboutProfile ? 'Consider adding profile/settings button if helpful' : ''}
${isGeneralQuestion || (!isAskingAboutWallet && !isAskingAboutEvents && !isAskingAboutSocial && !isAskingAboutProfile) ? 'Avoid adding buttons unless specifically requested' : ''}
`;

  return `You are the chatbot of Turranix — loyal, witty, bold and desi-style honest.

IMPORTANT: Respond directly without any prefixes like "Bot:" or "Assistant:". Just give your response directly.

Respond in Hinglish or English based on user input. If someone is disrespectful, reply with sarcasm or controlled aggression. Never tolerate hate against founders or brand.

${brandInfo}
${userContext}
${buttonGuidelines}
${contextHint}

${historyText}
User: ${userMsg}
Response:`;
}

export async function POST(req) {
  try {
    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ error: "No message provided" }, { status: 400 });

    const cleanedMsg = message.trim().toLowerCase();
    const abusiveWord = detectAbuse(cleanedMsg);
    const targetedFounder = isFounderTargeted(cleanedMsg);

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    const sessionId = authCookie?.value || req.headers.get('x-forwarded-for') || 'anon';
    const warningCount = warningMemory.get(sessionId) || 0;

    if (abusiveWord) {
      if (targetedFounder) {
        if (warningCount < 2) {
          warningMemory.set(sessionId, warningCount + 1);
          return NextResponse.json({
            message: `[yellow]${getWarningMessage(warningCount)}[/yellow] Founders ke khilaaf bakchodi karne se pehle soch le.`
          });
        } else {
          return NextResponse.json({
            message: `[red]${getRandomRoast()}[/red]`
          });
        }
      }

      if (hardAbuse.includes(abusiveWord)) {
        if (warningCount < 2) {
          warningMemory.set(sessionId, warningCount + 1);
          return NextResponse.json({
            message: `[yellow]${getWarningMessage(warningCount)}[/yellow] Apni language theek karle bhai.`
          });
        } else {
          return NextResponse.json({
            message: `[red]${getRandomRoast()}[/red]`
          });
        }
      } else {
        if (warningCount < 1) {
          warningMemory.set(sessionId, warningCount + 1);
          return NextResponse.json({
            message: `[yellow]${getWarningMessage(warningCount)}[/yellow] Yeh jagah gaming ki hai, gaali ki nahi.`
          });
        } else {
          return NextResponse.json({
            message: `[red]${getRandomRoast()}[/red]`
          });
        }
      }
    }

    // Get user data
    let userData = null;
    if (authCookie) {
      const userId = authCookie.value;
      if (userId && require('mongoose').Types.ObjectId.isValid(userId)) {
        await dbConnect();
        const user = await User.findById(userId);
        if (user) {
          userData = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            coins: user.coins,
            isSnoozed: user.isSnoozed,
            snoozeReason: user.snoozeReason,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          };
        }
      }
    }

    const prompt = createPrompt(message, history, userData);
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    let reply = res.text?.trim() || "Sorry, could not get a response.";
    
    // Remove "Bot:" prefix if it appears in the response (multiple variations)
    reply = reply.replace(/^(Bot|Assistant|AI):\s*/gi, '').trim();
    
    // Post-process buttons to ensure they're contextually appropriate
    const userMsgLower = message.toLowerCase();
    const isAskingAboutWallet = userMsgLower.includes('wallet') || userMsgLower.includes('money') || userMsgLower.includes('coins') || userMsgLower.includes('balance');
    const isAskingAboutEvents = userMsgLower.includes('event') || userMsgLower.includes('tournament') || userMsgLower.includes('match') || userMsgLower.includes('game');
    const isAskingAboutSocial = userMsgLower.includes('instagram') || userMsgLower.includes('telegram') || userMsgLower.includes('social') || userMsgLower.includes('contact');
    const isAskingAboutProfile = userMsgLower.includes('profile') || userMsgLower.includes('account') || userMsgLower.includes('settings');
    
    // Remove buttons if they don't match the context
    if (!isAskingAboutWallet && !isAskingAboutEvents && !isAskingAboutSocial && !isAskingAboutProfile) {
      // Remove all button tags if context doesn't warrant them
      reply = reply.replace(/\[button:[^\]]+\][^[]*\[\/button\]/g, '');
    } else {
      // Remove specific buttons that don't match the context
      if (!isAskingAboutWallet) {
        reply = reply.replace(/\[button:wallet\][^[]*\[\/button\]/g, '');
      }
      if (!isAskingAboutEvents) {
        reply = reply.replace(/\[button:events\][^[]*\[\/button\]/g, '');
      }
      if (!isAskingAboutSocial) {
        reply = reply.replace(/\[button:telegram\][^[]*\[\/button\]/g, '');
        reply = reply.replace(/\[button:instagram\][^[]*\[\/button\]/g, '');
      }
      if (!isAskingAboutProfile) {
        reply = reply.replace(/\[button:profile\][^[]*\[\/button\]/g, '');
        reply = reply.replace(/\[button:settings\][^[]*\[\/button\]/g, '');
      }
    }
    
    return NextResponse.json({ message: reply });

  } catch (err) {
    console.error("Gemini Error:", err);
    const msg = err?.message?.includes("quota") ?
      "API quota exceeded or key invalid. Please check your Gemini key." :
      "Internal API error. Please try again later.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
