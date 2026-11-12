import { babel } from './babel.ts';
import { bayeux } from './bayeux.ts';
import { bestiary } from './bestiary.ts';
import { carta } from './carta.ts';
import { dering } from './dering.ts';
import { games } from './games.ts';
import { garden } from './garden.ts';
import { lascaux } from './lascaux.ts';
import { marsh } from './marsh.ts';
import type { Mural } from '../mural.ts';
import { sea } from './sea.ts';
import { vase } from './vase.ts';

export const MURALS: Mural[] = [
	lascaux,
	dering,
	bestiary,
	vase,
	sea,
	babel,
	carta,
	bayeux,
	garden,
	games,
	marsh
];
