import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    try {
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } catch (verifyError: any) {
      console.error('Password verification error:', verifyError);
      return NextResponse.json(
        { error: 'Error verifying password. Please try again.' },
        { status: 500 }
      );
    }

    // Return user data (in production, use proper session management)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { message: 'Login successful', user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', error?.message, error?.stack);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError || error?.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Check for specific Prisma errors
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please try again later.',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : 'An error occurred during login. Please try again.',
        code: error?.code || 'UNKNOWN',
        details: process.env.NODE_ENV === 'development' ? (error?.stack ? error.stack.substring(0, 500) : undefined) : undefined
      },
      { status: 500 }
    );
  }
}




