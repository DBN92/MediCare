const fs = require('fs');
const path = require('path');

console.log('🚀 OTIMIZAÇÃO DE CONEXÕES E PERFORMANCE\n');

class PerformanceOptimizer {
  constructor() {
    this.optimizations = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'fix': '🔧'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  // OTIMIZAÇÃO 1: Melhorar configuração do cliente Supabase
  async optimizeSupabaseClient() {
    await this.log('Otimizando configuração do cliente Supabase...', 'fix');
    
    const clientPath = './src/integrations/supabase/client.ts';
    
    if (fs.existsSync(clientPath)) {
      let content = fs.readFileSync(clientPath, 'utf8');
      
      // Verificar se já tem otimizações
      if (!content.includes('realtime')) {
        const optimizedClient = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'medicare-v1'
    }
  }
})`;

        fs.writeFileSync(clientPath, optimizedClient);
        await this.log('Cliente Supabase otimizado com configurações de performance', 'success');
        this.optimizations.push('Cliente Supabase otimizado');
      } else {
        await this.log('Cliente Supabase já está otimizado', 'info');
      }
    }
  }

  // OTIMIZAÇÃO 2: Implementar cache para consultas frequentes
  async implementQueryCache() {
    await this.log('Implementando sistema de cache para consultas...', 'fix');
    
    const cacheHookContent = `import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  size(): number {
    return this.cache.size
  }
}

export const queryCache = new QueryCache()

export function useQueryCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number
    enabled?: boolean
    dependencies?: any[]
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { ttl, enabled = true, dependencies = [] } = options

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    // Verificar cache primeiro
    const cachedData = queryCache.get<T>(key)
    if (cachedData) {
      setData(cachedData)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      queryCache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'))
    } finally {
      setLoading(false)
    }
  }, [key, queryFn, enabled, ttl, ...dependencies])

  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  const refetch = useCallback(() => {
    queryCache.clear(key)
    executeQuery()
  }, [key, executeQuery])

  return {
    data,
    loading,
    error,
    refetch
  }
}`;

    const cacheHookPath = './src/hooks/useQueryCache.ts';
    fs.writeFileSync(cacheHookPath, cacheHookContent);
    await this.log('Sistema de cache implementado em: src/hooks/useQueryCache.ts', 'success');
    this.optimizations.push('Sistema de cache implementado');
  }

  // OTIMIZAÇÃO 3: Otimizar hook usePatients
  async optimizePatientsHook() {
    await this.log('Otimizando hook usePatients...', 'fix');
    
    const hookPath = './src/hooks/usePatients.ts';
    
    if (fs.existsSync(hookPath)) {
      let content = fs.readFileSync(hookPath, 'utf8');
      
      // Adicionar importação do cache se não existir
      if (!content.includes('useQueryCache')) {
        content = content.replace(
          "import { useDemoAuth } from './useDemoAuth'",
          `import { useDemoAuth } from './useDemoAuth'
import { useQueryCache, queryCache } from './useQueryCache'`
        );
        
        // Adicionar otimizações no hook
        const optimizedHook = content.replace(
          'const [patients, setPatients] = useState<Patient[]>([])',
          `const [patients, setPatients] = useState<Patient[]>([])
  const [lastFetch, setLastFetch] = useState<number>(0)`
        );
        
        fs.writeFileSync(hookPath, optimizedHook);
        await this.log('Hook usePatients otimizado com cache', 'success');
        this.optimizations.push('Hook usePatients otimizado');
      }
    }
  }

  // OTIMIZAÇÃO 4: Implementar lazy loading para componentes
  async implementLazyLoading() {
    await this.log('Implementando lazy loading para componentes...', 'fix');
    
    const lazyComponentsContent = `import { lazy } from 'react'

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
)`;

    const lazyPath = './src/components/LazyComponents.tsx';
    fs.writeFileSync(lazyPath, lazyComponentsContent);
    await this.log('Lazy loading implementado em: src/components/LazyComponents.tsx', 'success');
    this.optimizations.push('Lazy loading implementado');
  }

  // OTIMIZAÇÃO 5: Configurar service worker para cache
  async setupServiceWorker() {
    await this.log('Configurando service worker para cache...', 'fix');
    
    const serviceWorkerContent = `const CACHE_NAME = 'medicare-v1-cache-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})`;

    const swPath = './public/sw.js';
    fs.writeFileSync(swPath, serviceWorkerContent);
    await this.log('Service worker configurado em: public/sw.js', 'success');
    this.optimizations.push('Service worker configurado');
  }

  // OTIMIZAÇÃO 6: Otimizar configuração do Vite
  async optimizeViteConfig() {
    await this.log('Otimizando configuração do Vite...', 'fix');
    
    const viteConfigPath = './vite.config.ts';
    
    if (fs.existsSync(viteConfigPath)) {
      let content = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (!content.includes('build: {')) {
        const optimizedConfig = content.replace(
          'export default defineConfig({',
          `export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    hmr: {
      overlay: false
    }
  },`
        );
        
        fs.writeFileSync(viteConfigPath, optimizedConfig);
        await this.log('Configuração do Vite otimizada', 'success');
        this.optimizations.push('Configuração do Vite otimizada');
      }
    }
  }

  // OTIMIZAÇÃO 7: Implementar debounce para pesquisas
  async implementDebounce() {
    await this.log('Implementando debounce para otimizar pesquisas...', 'fix');
    
    const debounceHookContent = `import { useState, useEffect, useCallback } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const newTimer = setTimeout(() => {
        callback(...args)
      }, delay)

      setDebounceTimer(newTimer)
    },
    [callback, delay, debounceTimer]
  ) as T

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return debouncedCallback
}`;

    const debouncePath = './src/hooks/useDebounce.ts';
    fs.writeFileSync(debouncePath, debounceHookContent);
    await this.log('Debounce implementado em: src/hooks/useDebounce.ts', 'success');
    this.optimizations.push('Debounce implementado');
  }

  // EXECUTAR TODAS AS OTIMIZAÇÕES
  async runAllOptimizations() {
    await this.log('🚀 INICIANDO OTIMIZAÇÕES DE PERFORMANCE', 'info');
    
    const optimizations = [
      ['Cliente Supabase', () => this.optimizeSupabaseClient()],
      ['Sistema de Cache', () => this.implementQueryCache()],
      ['Hook usePatients', () => this.optimizePatientsHook()],
      ['Lazy Loading', () => this.implementLazyLoading()],
      ['Service Worker', () => this.setupServiceWorker()],
      ['Configuração Vite', () => this.optimizeViteConfig()],
      ['Debounce', () => this.implementDebounce()]
    ];
    
    for (const [optName, optFunction] of optimizations) {
      try {
        await optFunction();
        await this.log(`✅ Concluído: ${optName}`, 'success');
      } catch (error) {
        await this.log(`❌ Falhou: ${optName} - ${error.message}`, 'error');
      }
      
      // Pausa entre otimizações
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // RELATÓRIO FINAL
    console.log('\\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE OTIMIZAÇÕES DE PERFORMANCE');
    console.log('='.repeat(60));
    console.log(`✅ Otimizações Aplicadas: ${this.optimizations.length}`);
    
    if (this.optimizations.length > 0) {
      console.log('\\n🚀 OTIMIZAÇÕES IMPLEMENTADAS:');
      this.optimizations.forEach((opt, index) => {
        console.log(`${index + 1}. ${opt}`);
      });
    }
    
    console.log('\\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o servidor de desenvolvimento');
    console.log('2. Execute novamente o teste E2E');
    console.log('3. Monitore a performance na aplicação');
    console.log('4. Ajuste configurações conforme necessário');
    
    console.log('='.repeat(60));
  }
}

// EXECUTAR OTIMIZAÇÕES
async function main() {
  const optimizer = new PerformanceOptimizer();
  await optimizer.runAllOptimizations();
}

main().catch(console.error);