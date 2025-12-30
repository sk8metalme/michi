/**
 * Interactive Helpers - Entry Point
 * The actual logic has been moved to src/presentation/interactive/
 */

export {
  createInterface,
  question,
  password,
  numberInput,
  textInput,
} from '../../src/presentation/interactive/prompts.js';

export {
  confirm,
  confirmDangerous,
  confirmMultiple,
  confirmAll,
} from '../../src/presentation/interactive/confirmation.js';

export {
  select,
  multiSelect,
  searchableSelect,
  paginatedSelect,
  type Choice,
} from '../../src/presentation/interactive/selection.js';
