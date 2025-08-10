import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Matches from "@/lib/models/matches";
import MatchSnapshot from '@/lib/models/matchSnapshot';
import User from '@/lib/models/users';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('matchId');
    const username = searchParams.get('username');
    const status = searchParams.get('status');
    const matchType = searchParams.get('matchType');
    const createdBy = searchParams.get('createdBy');

    await dbConnect();

    if (id) {
      const match = await Matches.findById(id);
      if (!match) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      // Populate isVerified for each player
      const playersWithVerification = await Promise.all(
        match.players.map(async (player) => {
          if (!player.userId) return player;
          const user = await User.findById(player.userId).select('isVerified');
          return { ...player.toObject(), isVerified: user ? user.isVerified : false };
        })
      );
      const matchObj = match.toObject();
      matchObj.players = playersWithVerification;
      return NextResponse.json(matchObj);
    }

    if (username) {
      // Find matches where the user has joined
      const matches = await Matches.find({
        'players.username': username
      }).sort({ time: -1 });
      return NextResponse.json(matches);
    }

    // Build query based on filters
    const query = {};
    if (status) {
      query.status = status;
    }
    if (matchType) {
      query.matchType = matchType;
    }
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const matches = await Matches.find(query).sort({ time: -1 });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error, error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await dbConnect();

    // Validate required fields
    const requiredFields = ['name', 'time','winnings'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate time
    const matchTime = new Date(data.time);
    if (isNaN(matchTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for match time" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (data.entry < 0 || data.winnings < 0) {
      return NextResponse.json(
        { error: "Entry fee and winnings must be non-negative" },
        { status: 400 }
      );
    }

    // Always set roomId and roomPassword, even if empty
    const match = new Matches({
      ...data,
      roomId: data.roomId !== undefined ? data.roomId : '',
      roomPassword: data.roomPassword !== undefined ? data.roomPassword : '',
      status: data.status || 'upcoming',
      matchFormat: data.matchFormat || 'Squad',
      rules: data.rules || 'No PC allowed, default rules apply',
      maxParticipants: data.maxParticipants || 48,
      players: []
    });

    await match.save();
    console.log('POST /api/matches saved match:', match); // Debug log

    // Save snapshot directly
    try {
      console.log('Saving match snapshot:', match.toObject());
      await MatchSnapshot.create({
        ...match.toObject(),
        originalMatchId: match._id,
        snapshotAt: new Date(),
      });
      console.log('Match snapshot saved successfully');
    } catch (e) {
      console.error('Failed to save match snapshot:', e);
    }

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create match" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const match = await Matches.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Explicitly update roomId and roomPassword if present in data
    match.roomId = data.roomId !== undefined ? data.roomId : '';
    match.roomPassword = data.roomPassword !== undefined ? data.roomPassword : '';

    // Update other fields
    Object.keys(data).forEach((key) => {
      if (key !== "roomId" && key !== "roomPassword") {
        match[key] = data[key];
      }
    });

    console.log('PUT /api/matches received data:', data); // Debug log
    await match.save();
    console.log('PUT /api/matches saved match:', match); // Debug log

    // Fetch the latest match from DB for snapshot
    let latestMatch = null;
    try {
      latestMatch = await Matches.findById(match._id);
    } catch (e) {
      console.error('Failed to fetch latest match for snapshot:', e);
    }

    // Save snapshot directly
    try {
      const snapshotData = latestMatch ? latestMatch.toObject() : match.toObject();
      console.log('Saving match snapshot:', snapshotData);
      await MatchSnapshot.create({
        ...snapshotData,
        originalMatchId: match._id,
        snapshotAt: new Date(),
      });
      console.log('Match snapshot saved successfully');
    } catch (e) {
      console.error('Failed to save match snapshot:', e);
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update match" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const match = await Matches.findByIdAndDelete(id);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Match deleted successfully" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete match" },
      { status: 500 }
    );
  }
} 