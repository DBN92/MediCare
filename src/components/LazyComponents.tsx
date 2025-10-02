import { lazy } from 'react'

// Lazy loading dos componentes principais
export const LazyPatients = lazy(() => import('../pages/Patients'))
export const LazyCare = lazy(() => import('../pages/Care'))
export const LazyReports = lazy(() => import('../pages/Reports'))
export const LazySettings = lazy(() => import('../pages/Settings'))
export const LazyMedicalRecords = lazy(() => import('../pages/MedicalRecords'))
export const LazyAssetManager = lazy(() => import('../pages/AssetManager'))

// Componente de loading
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
)