import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Events from "@/lib/models/events";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const eventId = searchParams.get('eventId');

    await dbConnect();

    if (id || eventId) {
      const query = id ? { _id: id } : { eventId };
      const event = await Events.findOne(query);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      return NextResponse.json(event);
    }

    const events = await Events.find({}).sort({ startTime: -1 });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await dbConnect();

    // Validate required fields
    const requiredFields = ['eventName', 'startTime', 'endTime', 'entryFee', 'totalWinnings'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for startTime or endTime" },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Validate stages if provided
    if (data.stages && Array.isArray(data.stages)) {
      for (const stage of data.stages) {
        const stageStartDate = new Date(stage.startDate);
        const stageEndDate = new Date(stage.endDate);
        
        if (isNaN(stageStartDate.getTime()) || isNaN(stageEndDate.getTime())) {
          return NextResponse.json(
            { error: `Invalid date format for stage: ${stage.stageName}` },
            { status: 400 }
          );
        }

        if (stageEndDate <= stageStartDate) {
          return NextResponse.json(
            { error: `End date must be after start date for stage: ${stage.stageName}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate numeric fields
    if (data.entryFee < 0 || data.totalWinnings < 0) {
      return NextResponse.json(
        { error: "Entry fee and total winnings must be non-negative" },
        { status: 400 }
      );
    }

    const event = new Events({
      ...data,
      startTime,
      endTime,
      status: data.status || 'upcoming',
      teams: data.teams || [],
      stages: data.stages || []
    });

    await event.save();
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Event ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const eventId = searchParams.get('eventId');
    const data = await request.json();

    if (!id && !eventId) {
      return NextResponse.json(
        { error: "Event ID or MongoDB ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate dates if provided
    if (data.startTime || data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format for startTime or endTime" },
          { status: 400 }
        );
      }

      if (endTime <= startTime) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    // Validate stages if provided
    if (data.stages && Array.isArray(data.stages)) {
      for (const stage of data.stages) {
        const stageStartDate = new Date(stage.startDate);
        const stageEndDate = new Date(stage.endDate);
        
        if (isNaN(stageStartDate.getTime()) || isNaN(stageEndDate.getTime())) {
          return NextResponse.json(
            { error: `Invalid date format for stage: ${stage.stageName}` },
            { status: 400 }
          );
        }

        if (stageEndDate <= stageStartDate) {
          return NextResponse.json(
            { error: `End date must be after start date for stage: ${stage.stageName}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate numeric fields if provided
    if (data.entryFee !== undefined && data.entryFee < 0) {
      return NextResponse.json(
        { error: "Entry fee must be non-negative" },
        { status: 400 }
      );
    }

    if (data.totalWinnings !== undefined && data.totalWinnings < 0) {
      return NextResponse.json(
        { error: "Total winnings must be non-negative" },
        { status: 400 }
      );
    }

    const query = id ? { _id: id } : { eventId };
    const event = await Events.findOneAndUpdate(
      query,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Event ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const eventId = searchParams.get('eventId');

    if (!id && !eventId) {
      return NextResponse.json(
        { error: "Event ID or MongoDB ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const query = id ? { _id: id } : { eventId };
    const event = await Events.findOneAndDelete(query);
    
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
} 