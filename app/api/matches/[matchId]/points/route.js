import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Matches from "@/lib/models/matches";
import User from "@/lib/models/users";
import NotificationService from "@/lib/notificationService";
import mongoose from "mongoose";

export async function PUT(request, context) {
  const { params } = context;
  try {
    // Read request body first, then access params as required by Next.js
    const { playerId, points, updatedBy = "Admin" } = await request.json();
    const { matchId } = params;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    if (points === undefined || points === null) {
      return NextResponse.json(
        { error: "Points value is required" },
        { status: 400 }
      );
    }

    if (points < 0) {
      return NextResponse.json(
        { error: "Points cannot be negative" },
        { status: 400 }
      );
    }

    await dbConnect();

    const match = await Matches.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Find the player in the match - try multiple ways to identify the player
    let playerIndex = -1;
    let matchedBy = null;

    // First try exact userId match, but only if playerId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(playerId)) {
      playerIndex = match.players.findIndex(player => player.userId?.toString() === playerId);
      if (playerIndex !== -1) matchedBy = 'userId';
    }

    // If not found, try by username
    if (playerIndex === -1) {
      playerIndex = match.players.findIndex(player => player.username === playerId);
      if (playerIndex !== -1) matchedBy = 'username';
    }

    // If still not found, try by email
    if (playerIndex === -1) {
      playerIndex = match.players.findIndex(player => player.email === playerId);
      if (playerIndex !== -1) matchedBy = 'email';
    }

    if (playerIndex === -1) {
      console.log('Available players:', match.players.map(p => ({ userId: p.userId, username: p.username, email: p.email })));
      console.log('Looking for playerId:', playerId);
      return NextResponse.json(
        { error: "Player not found in this match. Available players: " + match.players.map(p => p.username || p.email).join(', ') },
        { status: 404 }
      );
    }

    const player = match.players[playerIndex];
    const oldPoints = player.points || 0;
    const newPoints = points;
    const pointsDifference = newPoints - oldPoints;

    // Update the player's points
    player.points = newPoints;
    // Never update player.userId with a string (username/email)
    if (matchedBy === 'userId' && mongoose.Types.ObjectId.isValid(playerId)) {
      player.userId = new mongoose.Types.ObjectId(playerId);
    }
    await match.save();

    // Quick operations: Update user's coins and send notification if points changed
    if (pointsDifference !== 0) {
      try {
        // Find the user by multiple methods since email might be undefined
        let user = null;
        
        if (player.email) {
          // Try to find by email first
          user = await User.findOne({ email: player.email });
        }
        
        if (!user && player.username) {
          // Try to find by username if email not found
          user = await User.findOne({ username: player.username });
        }
        
        if (!user && player.userId) {
          // Try to find by userId if username not found
          user = await User.findOne({ userId: player.userId.toString() });
        }
        
        if (user) {
          // Convert points to coins (1 point = 1 coin)
          const coinsToAdd = pointsDifference;
          const oldCoins = user.coins || 0;
          user.coins = oldCoins + coinsToAdd;
          
          // Ensure coins don't go negative
          if (user.coins < 0) {
            user.coins = 0;
          }
          
          // Save user coins update
          await user.save();
          console.log(`[POINTS_UPDATE] Coins updated for ${user.email}: ${oldCoins} -> ${user.coins} (${coinsToAdd > 0 ? '+' : ''}${coinsToAdd})`);

          // Send notification to user (only if we have an email)
          if (user.email) {
            // Send notification asynchronously to avoid blocking the response
            // Remove NotificationService.notifyPointsAdded and notifyPointsDeducted calls
          }
        } else {
          console.warn(`[POINTS_UPDATE] User not found for player: ${player.email || player.username || player.userId}`);
        }
      } catch (userError) {
        console.error("[POINTS_UPDATE] Error updating user coins:", userError);
        // Don't fail the entire request if user update fails
      }
    }

    return NextResponse.json({
      match,
      pointsDifference,
      message: pointsDifference > 0 
        ? `${pointsDifference} points added` 
        : pointsDifference < 0 
        ? `${Math.abs(pointsDifference)} points deducted`
        : "Points unchanged"
    });
  } catch (error) {
    console.error("Error updating player points:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update player points" },
      { status: 500 }
    );
  }
} 