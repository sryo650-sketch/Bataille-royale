# Home Components

This directory contains all the specialized components used in the HomeScreen.

## Architecture

Each component is:
- ✅ **Memoized** with `React.memo` for optimal performance
- ✅ **Self-contained** - extracts its own theme colors and translations
- ✅ **Testable** - can be tested in isolation
- ✅ **Reusable** - no tight coupling to parent

## Components

### RecentOpponentRow
Displays a recent opponent with:
- Player name and country flag
- Match date (formatted)
- Win/Loss indicator
- Challenge button

**Props:**
```typescript
{
  item: {
    matchId: string;
    name: string;
    countryCode: string;
    result: 'WIN' | 'LOSS';
    date: string;
    onChallenge: () => void;
  };
  index: number;
  formatDate: (date: string) => string;
}
```

### FriendRow
Displays a friend with:
- Avatar image
- Name and online status
- Duel and Challenge buttons

**Props:**
```typescript
{
  item: {
    id: string;
    name: string;
    status: 'In Game' | 'Online' | 'Offline';
    avatar?: string;
    onChallenge: () => void;
    onDuel: () => void;
  };
  index: number;
  getAvatarSource: (avatar?: string) => any;
}
```

### RandomPlayerRow
Displays a random player with:
- Avatar image
- Name, country flag, and ELO
- Mode and time ago
- Duel and Challenge buttons

**Props:**
```typescript
{
  item: {
    id: string;
    name: string;
    mode: string;
    timeAgo: string;
    elo: number;
    avatar?: string;
    countryCode: string;
    onChallenge: () => void;
    onDuel: () => void;
  };
  index: number;
  getAvatarSource: (avatar?: string) => any;
}
```

## Performance Optimizations

1. **React.memo**: Prevents re-renders when props haven't changed
2. **useThemeColor()**: Each component extracts colors directly from context (no prop drilling)
3. **useLanguage()**: Each component extracts translations directly from context
4. **Animated.View**: Uses `entering` prop for staggered animations

## Usage Example

```typescript
import { RecentOpponentRow, FriendRow, RandomPlayerRow } from '../components/home';

// In your component:
{recentOpponents.map((item, index) => (
  <RecentOpponentRow
    key={`recent-${item.matchId}-${item.date}`}
    item={item}
    index={index}
    formatDate={formatMatchDate}
  />
))}
```

## Testing

Each component can be tested independently:

```typescript
import { render } from '@testing-library/react-native';
import { RecentOpponentRow } from './RecentOpponentRow';

test('renders opponent name', () => {
  const mockItem = {
    matchId: '123',
    name: 'John Doe',
    countryCode: 'US',
    result: 'WIN',
    date: '2024-01-01',
    onChallenge: jest.fn(),
  };
  
  const { getByText } = render(
    <RecentOpponentRow 
      item={mockItem} 
      index={0} 
      formatDate={(d) => d}
    />
  );
  
  expect(getByText('John Doe')).toBeTruthy();
});
```

## Future Improvements

- Add skeleton loading states
- Add error boundaries
- Add accessibility labels
- Add haptic feedback on button press
