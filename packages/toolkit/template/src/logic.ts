/** Server-authoritative logic (manifest.json serverActionLogicPath): the shared read-through. */
import { readThroughLogic } from '@uzu-toolkit/reader/logic';
import script from '../script/script.json';

export type { State } from '@uzu-toolkit/reader/logic';
export default readThroughLogic(script);
