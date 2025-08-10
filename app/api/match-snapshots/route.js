import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MatchSnapshot from '@/lib/models/matchSnapshot';

export async function GET() {
  await dbConnect();
  const snapshots = await MatchSnapshot.find({}).sort({ time: -1 });
  return NextResponse.json(snapshots);
}

export async function POST(request) {
  await dbConnect();
  const data = await request.json();
  // Save all fields, plus originalMatchId if present
  const snapshot = new MatchSnapshot({
    ...data,
    originalMatchId: data._id || data.originalMatchId,
    snapshotAt: new Date(),
    extra: data.extra || {},
  });
  await snapshot.save();
  return NextResponse.json(snapshot, { status: 201 });
} 