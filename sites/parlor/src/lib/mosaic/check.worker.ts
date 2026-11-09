/* Mosaic's live check in the editor, in its own worker: see shared/editor/worker.ts. */
import { serveChecks } from '../shared/editor/worker';
import { rules } from './rules';

serveChecks(rules);
