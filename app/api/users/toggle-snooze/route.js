import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/users';

export async function POST(req) {
  await dbConnect();
  try {
    const { userId, isSnoozed } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

    let update = {};
    if (isSnoozed) {
      update = {
        isSnoozed: true,
        snoozeReason: 'Admin snooze',
        snoozeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };
    } else {
      update = {
        isSnoozed: false,
        snoozeReason: '',
        snoozeExpiry: null,
      };
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 