import { NextRequest, NextResponse } from 'next/server';
import { getGames, getGamesByIds } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const searchQuery = searchParams.get('search');

    // If ids provided, fetch only those games (optimized for bookmarks)
    if (idsParam) {
      const ids = idsParam.split(',').map(Number).filter(Boolean);
      const games = await getGamesByIds(ids);
      return NextResponse.json(games);
    }

    // Fetch all games
    let games = await getGames();

    // If search query provided, filter by name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      games = games.filter((game) =>
        game.name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json(games);
  } catch (error) {
    console.error('Failed to get games:', error);
    return NextResponse.json(
      { error: 'Failed to get games' },
      { status: 500 }
    );
  }
}
