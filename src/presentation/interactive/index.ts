/**
 * Presentation Interactive
 * すべての対話型UI機能をエクスポート
 */

// Prompts
export {
  createInterface,
  question,
  password,
  numberInput,
  textInput,
} from './prompts.js';

// Confirmation
export {
  confirm,
  confirmDangerous,
  confirmMultiple,
  confirmAll,
} from './confirmation.js';

// Selection
export {
  select,
  multiSelect,
  searchableSelect,
  paginatedSelect,
  type Choice,
} from './selection.js';
