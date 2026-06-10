import './App.css'
import { AuthProvider } from './AuthContext';
import WeatherWidget from './WeatherWidget';

function App() {
  return (
    <AuthProvider>
      <WeatherWidget />
    </AuthProvider>
  );
}

export default App;
