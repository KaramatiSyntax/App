import { NextResponse } from 'next/server';
import { readTransitionLogs } from '@/lib/utils/transitionLogFile';

export async function GET() {
  try {
    const logContent = readTransitionLogs();
    
    if (!logContent) {
      return NextResponse.json(
        { error: 'No transition logs found' },
        { status: 404 }
      );
    }

    return new NextResponse(logContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="transition-logs-${new Date().toISOString().split('T')[0]}.txt"`
      }
    });

  } catch (error) {
    console.error('Error downloading transition logs:', error);
    return NextResponse.json(
      { error: 'Failed to download transition logs' },
      { status: 500 }
    );
  }
} 