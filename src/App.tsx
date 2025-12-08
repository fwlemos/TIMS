import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/shared/Toast'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Database from '@/pages/Database'
import CRM from '@/pages/CRM'
import OpportunityDetail from '@/pages/OpportunityDetail'
import Settings from '@/pages/Settings'
import ObjectVisualizationPage from '@/pages/ObjectVisualizationPage'

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <ToastProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected routes */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <AppShell />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/database" element={<Database />} />
                                <Route path="/crm" element={<CRM />} />
                                <Route path="/database/:objectType/:id" element={<ObjectVisualizationPage />} />
                                <Route path="/crm/opportunities/:opportunityId" element={<OpportunityDetail />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ToastProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App

