import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Design baseline (standard phone: ~390pt wide, ~844pt tall) ---
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// --- Device type breakpoints ---
export type DeviceType = 'compact' | 'phone' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const { width } = useWindowDimensions();
  if (width < 380) return 'compact';
  if (width < 600) return 'phone';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// --- Pure scaling functions (non-hook, for use outside components) ---
// These take explicit width/height so they can be called from hooks.

/** Scale a value linearly based on screen width vs baseline */
export const scale = (size: number, screenWidth: number): number =>
  (screenWidth / BASE_WIDTH) * size;

/** Scale a value linearly based on screen height vs baseline */
export const verticalScale = (size: number, screenHeight: number): number =>
  (screenHeight / BASE_HEIGHT) * size;

/**
 * Moderate scale — partially scales based on a factor (0–1).
 * factor = 0 → no scaling, factor = 1 → full linear scale.
 * Default factor 0.5 gives a balanced middle ground.
 */
export const moderateScale = (
  size: number,
  screenWidth: number,
  factor: number = 0.5,
): number => size + (scale(size, screenWidth) - size) * factor;

// --- Responsive value picker ---
type ResponsiveMap<T> = {
  compact?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
};

/**
 * Pick the right value for the current device type.
 * Falls back through: desktop → tablet → phone → compact.
 */
export const responsiveValue = <T>(
  deviceType: DeviceType,
  values: ResponsiveMap<T>,
): T => {
  const fallbackOrder: DeviceType[] = ['desktop', 'tablet', 'phone', 'compact'];
  const startIdx = fallbackOrder.indexOf(deviceType);

  // Try the requested type first, then fall back to smaller types
  for (let i = startIdx; i < fallbackOrder.length; i++) {
    const val = values[fallbackOrder[i]];
    if (val !== undefined) return val;
  }

  // If nothing found falling back to smaller, try larger
  for (let i = startIdx - 1; i >= 0; i--) {
    const val = values[fallbackOrder[i]];
    if (val !== undefined) return val;
  }

  // Should never happen if at least one value is provided
  throw new Error('responsiveValue: at least one breakpoint value must be provided');
};

// --- Bundled hook ---
export type ResponsiveInfo = {
  deviceType: DeviceType;
  isTablet: boolean;
  isCompact: boolean;
  width: number;
  height: number;
  insets: { top: number; bottom: number; left: number; right: number };
  /** Scale by screen width (linear) */
  s: (size: number) => number;
  /** Scale by screen height (linear) */
  vs: (size: number) => number;
  /** Moderate scale (default factor 0.5) */
  ms: (size: number, factor?: number) => number;
  /** Pick a value per breakpoint */
  rv: <T>(values: ResponsiveMap<T>) => T;
};

/**
 * All-in-one responsive hook.
 * Returns device info, scaling functions, and safe area insets.
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const deviceType = useDeviceType();

  return {
    deviceType,
    isTablet: deviceType === 'tablet' || deviceType === 'desktop',
    isCompact: deviceType === 'compact',
    width,
    height,
    insets,
    s: (size: number) => moderateScale(size, width, 0.3), // Responsive: width-based, gentle
    vs: (size: number) => verticalScale(size, height),
    ms: (size: number, factor?: number) => moderateScale(size, width, factor),
    rv: <T>(values: ResponsiveMap<T>) => responsiveValue(deviceType, values),
  };
};
