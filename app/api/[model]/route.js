import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { model: modelName } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    await connectDB();

    // Dynamically import the model
    const ModelModule = await import(`@/lib/models/${modelName}`);
    const Model = ModelModule.default;

    if (!Model || typeof Model.find !== 'function') {
      return NextResponse.json(
        { error: `Invalid model: ${modelName}` },
        { status: 400 }
      );
    }

    const data = await Model.find(query);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching ${resolvedParams?.model || 'unknown'}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { model: modelName } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Dynamically import the model
    const ModelModule = await import(`@/lib/models/${modelName}`);
    const Model = ModelModule.default;

    if (!Model || typeof Model.create !== 'function') {
      return NextResponse.json(
        { error: `Invalid model: ${modelName}` },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = Object.entries(Model.schema.paths)
      .filter(([_, path]) => path.isRequired)
      .map(([field]) => field);

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const data = await Model.create(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(`Error creating ${await params.model}:`, error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create data" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { model: modelName } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Dynamically import the model
    let Model;
    try {
      Model = (await import(`@/lib/models/${modelName}`)).default;
    } catch (error) {
      return NextResponse.json(
        { error: `Model '${modelName}' not found` },
        { status: 404 }
      );
    }

    // Validate that the document exists
    const existingDoc = await Model.findById(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update the document
    const data = await Model.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error updating ${await params.model}:`, error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { model: modelName } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Dynamically import the model
    let Model;
    try {
      Model = (await import(`@/lib/models/${modelName}`)).default;
    } catch (error) {
      return NextResponse.json(
        { error: `Model '${modelName}' not found` },
        { status: 404 }
      );
    }

    // Validate that the document exists
    const existingDoc = await Model.findById(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const data = await Model.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(`Error deleting ${await params.model}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete data" },
      { status: 500 }
    );
  }
}