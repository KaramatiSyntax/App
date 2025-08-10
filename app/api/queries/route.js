import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Query from "@/lib/models/query";
import Subscription from "@/lib/models/subscription";

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, subject, message, status = 'unread' } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create new query
    const query = new Query({
      name,
      email,
      subject,
      message,
      status,
      createdAt: new Date()
    });

    await query.save();

    // Send confirmation notification to user
    try {
      const notification = {
        title: "Query Submitted Successfully",
        body: `Your query "${subject}" has been received. We'll get back to you soon.`,
        createdAt: new Date(),
        read: false,
        type: 'notification'
      };

      // Find or create subscription for the user
      let subscription = await Subscription.findOne({ userEmail: email });
      if (!subscription) {
        subscription = new Subscription({
          userEmail: email,
          notifications: [],
          endpoint: null,
          keys: {
            auth: null,
            p256dh: null
          }
        });
      }

      // Add the notification
      subscription.notifications.push(notification);
      await subscription.save();
    } catch (error) {
      console.error("Error sending confirmation notification:", error);
    }

    return NextResponse.json(
      { message: "Query submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting query:", error);
    return NextResponse.json(
      { error: "Failed to submit query" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const queries = await Query.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedQuery) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedQuery);
  } catch (error) {
    console.error("Error updating query:", error);
    return NextResponse.json(
      { error: "Failed to update query" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    const deletedQuery = await Query.findByIdAndDelete(id);

    if (!deletedQuery) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Query deleted successfully" });
  } catch (error) {
    console.error("Error deleting query:", error);
    return NextResponse.json(
      { error: "Failed to delete query" },
      { status: 500 }
    );
  }
} 