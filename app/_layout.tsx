import '../global.css';
import '../src/config/firebase';
import { AppNavigator } from '../src/presentation';
import { ThemeProvider } from '../src/presentation/context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
