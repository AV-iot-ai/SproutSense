/**
 * SensorCard.jsx — components/widgets/
 * Re-export of the full SensorCard widget from the main components folder.
 *
 * Keeping the original implementation at components/SensorCard.jsx avoids
 * breaking existing imports inside App.jsx. This re-export lets new code
 * import from the organised widgets/ path.
 *
 * Usage:
 *   import { SensorCard } from '../components/widgets/SensorCard';
 */
export { SensorCard } from '../SensorCard';
