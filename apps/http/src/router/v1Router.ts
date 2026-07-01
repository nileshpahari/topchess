import { Router } from "express";
import db from "../db";

const v1Router = Router();

v1Router.get('/', (_req, res) => {
	res.send('Hello World!');
})

v1Router.get('/games/ongoing', async (_req, res) => {
  try {
    const games = await db.game.findMany({
      where: { status: 'IN_PROGRESS' },
      orderBy: { startAt: 'desc' },
      take: 20,
      select: {
        id: true,
        timeControl: true,
        startAt: true,
        whitePlayer: { select: { username: true, provider: true } },
        blackPlayer: { select: { username: true, provider: true } },
        _count: { select: { moves: true } },
      },
    });

    res.json(games.map((game) => ({
      id: game.id,
      timeControl: game.timeControl,
      startAt: game.startAt,
      moveCount: game._count.moves,
      whitePlayer: {
        username: game.whitePlayer.username,
        isGuest: game.whitePlayer.provider === 'GUEST',
      },
      blackPlayer: {
        username: game.blackPlayer.username,
        isGuest: game.blackPlayer.provider === 'GUEST',
      },
    })));
  } catch (error) {
    console.error('Failed to list ongoing games', error);
    res.status(500).json({ message: 'Failed to list ongoing games' });
  }
});


export default v1Router;
