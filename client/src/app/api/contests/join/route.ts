import { API_BASE } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

// const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${API_BASE}/contests/join`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error joining contest:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join contest' },
      { status: 500 }
    );
  }
}
