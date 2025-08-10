import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Matches from "@/lib/models/matches";
import User from "@/lib/models/users";
import mongoose from "mongoose";

function getTeamAndSlot(matchFormat, slotNo) {
  // Returns { team, teamSlot } for a given global slotNo
  let slotsPerTeam;
  switch (matchFormat) {
    case "Solo":
      slotsPerTeam = 1;
      break;
    case "Duo":
      slotsPerTeam = 2;
      break;
    case "Squad":
      slotsPerTeam = 4;
      break;
    default:
      slotsPerTeam = 1;
  }
  if (slotNo <= slotsPerTeam) {
    return { team: "Team 1", teamSlot: slotNo };
  } else {
    return { team: "Team 2", teamSlot: slotNo - slotsPerTeam };
  }
}

function getAvailableSlots(match) {
  const isTeamBased = ["CS", "LW"].includes(match.matchFormat);
  let slotsPerTeam;
  switch (match.matchFormat) {
    case "Solo":
      slotsPerTeam = 1;
      break;
    case "Duo":
      slotsPerTeam = 2;
      break;
    case "Squad":
      slotsPerTeam = 4;
      break;
    default:
      slotsPerTeam = 1;
  }
  const totalSlots = isTeamBased ? slotsPerTeam * 2 : match.maxParticipants;
  const takenSlots = new Set();
  match.players.forEach(player => {
    if (player.slotNo) takenSlots.add(Number(player.slotNo));
  });
  const available = [];
  for (let slot = 1; slot <= totalSlots; slot++) {
    if (!takenSlots.has(slot)) {
      if (isTeamBased) {
        const { team, teamSlot } = getTeamAndSlot(match.matchFormat, slot);
        available.push({ slotNo: slot, team, teamSlot });
      } else {
        available.push({ slotNo: slot });
      }
    }
  }
  return available;
}

export async function POST(req) {
  try {
    // Authenticate user by auth cookie
    const cookie = req.headers.get('cookie') || '';
    const matchCookie = cookie.match(/auth=([^;]+)/);
    if (!matchCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = matchCookie[1];
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID in cookie' }, { status: 400 });
    }
    const { matchId, slotNo, inGameName } = await req.json();
    if (!matchId || slotNo === undefined || slotNo === null || !inGameName) {
      return NextResponse.json({ error: "Match ID, slot number, and in-game name are required" }, { status: 400 });
    }
    const requestedSlotNo = Number(slotNo);
    if (requestedSlotNo <= 0 || !Number.isInteger(requestedSlotNo)) {
      return NextResponse.json({ error: "Slot number must be a positive integer" }, { status: 400 });
    }
    await dbConnect();
    const match = await Matches.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    let slotsPerTeam;
    switch (match.matchFormat) {
      case "Solo": slotsPerTeam = 1; break;
      case "Duo": slotsPerTeam = 2; break;
      case "Squad": slotsPerTeam = 4; break;
      default: slotsPerTeam = 1;
    }
    const isTeamBased = ["CS", "LW"].includes(match.matchFormat);
    const totalSlots = isTeamBased ? slotsPerTeam * 2 : match.maxParticipants;
    if (requestedSlotNo > totalSlots) {
      return NextResponse.json({ error: `Slot number must be between 1 and ${totalSlots}` }, { status: 400 });
    }
    if (match.players.length >= totalSlots) {
      return NextResponse.json({ error: "Match is full" }, { status: 400 });
    }
    if (match.status !== "upcoming") {
      return NextResponse.json({ error: "Match is not available for joining" }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.coins < match.entry) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }
    if (match.players.some(player => player.username === user.username)) {
      return NextResponse.json({ error: "Already joined this match" }, { status: 400 });
    }
    if (match.players.some(player => Number(player.slotNo) === requestedSlotNo)) {
      const availableSlots = getAvailableSlots(match);
      return NextResponse.json({ error: "This slot is already taken", availableSlots, message: `Available slots: ${availableSlots.map(s => s.slotNo).join(', ')}` }, { status: 400 });
    }
    // Deduct coins first
    user.coins -= match.entry;
    await user.save();
    // Prepare player data
    const playerData = {
      userId: user._id,
      username: user.username,
      points: 0,
      slotNo: requestedSlotNo,
      inGameName,
    };
    if (isTeamBased) {
      const { team, teamSlot } = getTeamAndSlot(match.matchFormat, requestedSlotNo);
      playerData.team = team;
      playerData.teamSlot = teamSlot;
    }
    // Add player to match atomically
    const updatedMatch = await Matches.findByIdAndUpdate(
      matchId,
      { $push: { players: playerData } },
      { new: true, runValidators: true }
    );
    if (!updatedMatch) {
      user.coins += match.entry;
      await user.save();
      return NextResponse.json({ error: "Failed to join match" }, { status: 500 });
    }
    // Get the newly added player to verify team data was saved
    const newPlayer = updatedMatch.players.find(p => p.userId.toString() === user._id.toString());
    return NextResponse.json({ 
      success: true, 
      message: `Successfully joined ${match.name}`, 
      playerData,
      savedPlayer: newPlayer 
    });
  } catch (error) {
    console.error("Error joining match:", error);
    return NextResponse.json({ error: "Failed to join match" }, { status: 500 });
  }
} 