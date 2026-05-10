import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import GlobalStyle from './styles/global';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalStyle />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
