import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CropList } from './components/CropList';
import { CropForm } from './components/CropForm';
import { CropDetails } from './components/CropDetails';
import { EditCropForm } from './components/EditCropForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReportsDashboard } from './components/ReportsDashboard';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LivestockPage } from '../src/livestock/pages/LivestockPage'; // Direct import

// ✅ Import the new authentication components
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserProfile } from './components/UserProfile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
<Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={
  <ProtectedRoute>
    <Layout>
      <UserProfile />
    </Layout>
  </ProtectedRoute>
} />
              {/* Protected routes */}
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/crops" element={
                <ProtectedRoute>
                  <Layout>
                    <CropList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/crops/new" element={
                <ProtectedRoute>
                  <Layout>
                    <CropForm />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/crops/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <CropDetails />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/crops/:id/edit" element={
                <ProtectedRoute>
                  <Layout>
                    <EditCropForm />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <ReportsDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route 
        path="/livestock/*" 
        element={
          <ProtectedRoute>
            <Layout>
              <LivestockPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
          </ErrorBoundary>
        </Router>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;