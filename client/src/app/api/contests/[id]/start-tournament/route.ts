import { API_BASE } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

// const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = `${API_BASE}/contests/${id}/start-tournament`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to start tournament' },
      { status: 500 }
    );
  }
}
