import { Ware } from '@prisma/client';

export const wares: Omit<Ware, 'id'>[] = [{ name: 'plate' }];
