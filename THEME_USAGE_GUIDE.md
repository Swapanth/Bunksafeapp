# Global Theme System - Usage Guide

## Overview
A comprehensive light/dark theme system has been implemented globally using React Context. The theme persists across app restarts using AsyncStorage.

## Features
✅ Light and Dark themes with professional color palettes
✅ Automatic persistence - theme choice saved between sessions
✅ Global state management - change theme anywhere, updates everywhere
✅ Easy to use hook-based API
✅ Comprehensive color system optimized for both themes

## Quick Start

### 1. Using the Theme in Any Component

```typescript
import { useTheme } from '../../../presentation/context/ThemeContext';

const MyComponent = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Hello World
      </Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
};
```

### 2. Available Theme Properties

**`theme.mode`** - Current mode: `'light'` or `'dark'`
**`theme.colors`** - All color values (see below)
**`isDarkMode`** - Boolean: `true` if dark mode is active
**`toggleTheme()`** - Function: Switch between light/dark
**`setTheme(mode)`** - Function: Set specific theme mode

## Color Palette

### Backgrounds
- `theme.colors.background` - Main app background
- `theme.colors.surface` - Cards, modals, elevated surfaces
- `theme.colors.card` - Card backgrounds

### Text Colors
- `theme.colors.text` - Primary text color
- `theme.colors.textSecondary` - Secondary/muted text
- `theme.colors.textTertiary` - Tertiary/placeholder-like text

### Borders
- `theme.colors.border` - Standard borders
- `theme.colors.borderLight` - Lighter borders/dividers

### Primary Colors
- `theme.colors.primary` - Primary brand color (green)
- `theme.colors.primaryLight` - Light variant
- `theme.colors.primaryDark` - Dark variant

### Status Colors
- `theme.colors.success` - Success state (green)
- `theme.colors.warning` - Warning state (amber)
- `theme.colors.error` - Error state (red)
- `theme.colors.info` - Info state (blue)

### Chat Specific
- `theme.colors.chatBubbleReceived` - Received message bubble
- `theme.colors.chatBubbleSent` - Sent message bubble
- `theme.colors.chatBubbleText` - Text in received bubbles
- `theme.colors.chatInputBackground` - Message input background

### UI Elements
- `theme.colors.iconColor` - Primary icon color
- `theme.colors.iconColorSecondary` - Secondary icon color
- `theme.colors.placeholder` - Input placeholder text
- `theme.colors.shadow` - Shadow color

### Status Indicators
- `theme.colors.online` - Online status
- `theme.colors.offline` - Offline status
- `theme.colors.away` - Away status
- `theme.colors.studying` - Studying status

## Example: Converting a Screen to Use Theme

### Before (Hardcoded Colors):
```typescript
const MyScreen = () => (
  <View className="flex-1 bg-white">
    <Text className="text-gray-900 text-lg">
      Hello
    </Text>
  </View>
);
```

### After (Theme-Based):
```typescript
import { useTheme } from '../../../presentation/context/ThemeContext';

const MyScreen = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text, fontSize: 18 }}>
        Hello
      </Text>
    </View>
  );
};
```

## Best Practices

### ✅ DO:
- Use `theme.colors` for all color values
- Use inline `style` prop with theme colors
- Keep color logic simple and readable
- Use semantic color names (e.g., `text`, `surface`)

### ❌ DON'T:
- Don't hardcode hex colors like `#ffffff`
- Don't use Tailwind color classes for dynamic colors
- Don't check `isDarkMode` manually to pick colors (use `theme.colors` instead)

## Adding Theme Toggle to Any Screen

```typescript
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/context/ThemeContext';

const Header = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <TouchableOpacity onPress={toggleTheme}>
      <Ionicons 
        name={isDarkMode ? "sunny" : "moon"} 
        size={24} 
        color={theme.colors.iconColor} 
      />
    </TouchableOpacity>
  );
};
```

## Theme Architecture

```
ThemeContext.tsx
├── ThemeProvider (Context Provider)
├── useTheme() hook
├── lightTheme colors
├── darkTheme colors
└── AsyncStorage persistence

app/_layout.tsx
└── Wraps <AppNavigator /> with <ThemeProvider>

Any Component
└── const { theme } = useTheme()
    └── Access all theme properties
```

## Current Implementation Status

✅ **Fully Themed:**
- ChatScreen - Complete dark/light mode support

🎯 **To Be Themed:**
- DashboardScreen
- TasksScreen
- ProfileScreen
- LoginScreen
- SignupScreen
- All other screens

## Updating Other Screens

To theme other screens, simply:
1. Import `useTheme` hook
2. Replace hardcoded colors with `theme.colors.*`
3. Test both light and dark modes
4. Ensure text remains readable in both themes

The theme system is designed to be gradually adopted - you can update screens one at a time without breaking existing functionality.
