import { API_BASE } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

// const API_BASE_URL = process.env.API_BASE || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = `${API_BASE}/api/contests/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contest' },
      { status: 500 }
    );
  }
}
