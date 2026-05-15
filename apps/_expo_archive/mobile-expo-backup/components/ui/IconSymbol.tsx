// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'fork.knife': 'restaurant',
  'clock.fill': 'schedule',
  'person.fill': 'person',
  'mappin.and.ellipse': 'location-on',
  'chevron.down': 'expand-more',
  checkmark: 'check',
  'face.dashed': 'sentiment-dissatisfied',
  'headphones': 'headset',
  'chevron.left': 'chevron-left',
  xmark: 'close',
  magnifyingglass: 'search',
  'checkmark.seal.fill': 'verified',
  'gift.fill': 'card-giftcard',
  'doc.on.doc': 'content-copy',
  minus: 'remove',
  plus: 'add',
  sparkles: 'auto-awesome',
  'bolt.fill': 'bolt',
  'takeoutbag.and.cup.and.straw.fill': 'fastfood',
  'creditcard.fill': 'credit-card',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'arrow.left.square.fill': 'logout',
  'person.crop.circle.badge.exclamationmark': 'person-off',
  'doc.text.fill': 'description',
  'star.fill': 'star',
  'bag.badge.plus': 'add-shopping-cart',
  'clock.arrow.2.circlepath': 'history',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}


