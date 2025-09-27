import { API_BASE } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

// const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = `${API_BASE}/contests/${id}/complete-tournament`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error completing tournament:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete tournament' },
      { status: 500 }
    );
  }
}
