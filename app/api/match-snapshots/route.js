import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Match from '@/lib/models/Match'; // Assuming you have a Match model
import MatchSnapshot from '@/lib/models/matchSnapshot';

export async function PUT(request) {
  try {
    await dbConnect();

    // 1. Get the match ID from the URL (e.g., /api/matches?id=...)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // 2. Get the updated match data from the request body
    const updatedData = await request.json();

    // 3. Update the original match document in the 'matches' collection
    const updatedMatch = await Match.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 4. --- UPSERT LOGIC FOR THE SNAPSHOT ---
    // Prepare the data for the snapshot, removing the original _id
    const { _id, ...snapshotData } = updatedMatch.toObject();

    const snapshot = await MatchSnapshot.findOneAndUpdate(
      { originalMatchId: id }, // The query: find a snapshot with this ID
      { ...snapshotData, originalMatchId: id }, // The update data
      {
        upsert: true, // <-- This is the key: if it doesn't exist, create it.
        new: true     // <-- Return the new/updated document.
      }
    );

    // 5. Return a success response
    return NextResponse.json({
      message: 'Match updated and snapshot saved successfully',
      updatedMatch,
      snapshot
    });

  } catch (error) {
    console.error('Error updating match:', error);
    // Handle potential duplicate key errors if the user changes a unique field
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A field has a duplicate value that must be unique.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error while updating match' }, { status: 500 });
  }
}