import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveSafetyCheck, sanitizeTopic } from '@/lib/safety';

export async function POST(request: NextRequest) {
  try {
    const { topic, userId } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize the topic first
    const sanitizedTopic = sanitizeTopic(topic);

    // Perform comprehensive safety check
    const safetyResult = await comprehensiveSafetyCheck(sanitizedTopic, userId);

    if (!safetyResult.isSafe) {
      return NextResponse.json(
        {
          isValid: false,
          reason: safetyResult.reason,
          category: safetyResult.category,
          sanitizedTopic
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isValid: true,
      sanitizedTopic,
      message: 'Topic is safe and appropriate for debate'
    });

  } catch (error) {
    console.error('Topic validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during topic validation' },
      { status: 500 }
    );
  }
} 