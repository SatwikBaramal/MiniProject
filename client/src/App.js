import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LeaveApplication from './components/LeaveApplication';
import AttendanceHistory from './components/AttendanceHistory';
import ManagerDashboard from './components/ManagerDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/leave-application"
            element={
              <PrivateRoute>
                <LeaveApplication />
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance-history"
            element={
              <PrivateRoute>
                <AttendanceHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <PrivateRoute>
                <ManagerDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
