import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all contestants across all categories (for selecting existing ones)
export async function GET() {
  try {
    const contestants = await prisma.contestant.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        picture: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' },
      ],
    });

    // Group by name+surname to avoid duplicates
    const uniqueContestants = contestants.reduce((acc: any[], contestant) => {
      const key = `${contestant.name}_${contestant.surname}`;
      const exists = acc.find(c => 
        c.name.toLowerCase() === contestant.name.toLowerCase() && 
        c.surname.toLowerCase() === contestant.surname.toLowerCase()
      );
      if (!exists) {
        acc.push({
          id: contestant.id,
          name: contestant.name,
          surname: contestant.surname,
          picture: contestant.picture,
          categories: [contestant.category.name],
        });
      } else {
        // If already exists, add category to the list
        if (!exists.categories.includes(contestant.category.name)) {
          exists.categories.push(contestant.category.name);
        }
      }
      return acc;
    }, []);

    return NextResponse.json(uniqueContestants);
  } catch (error) {
    console.error('Error fetching all contestants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

