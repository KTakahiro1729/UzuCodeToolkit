/** Client entry: the shared read-through with this sample's script and fonts. */

import { startReader } from '@uzu-toolkit/reader';
import script from '../script/script.json';
import './fonts.css';
import logic from './logic';

startReader(script, logic, 'landscape');
