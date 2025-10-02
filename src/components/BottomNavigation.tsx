import { NavLink, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  Heart, 
  FileText, 
  Settings,
  Stethoscope,
  Pill,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: BarChart3, 
    shortTitle: "Home"
  },
  { 
    title: "Pacientes", 
    url: "/patients", 
    icon: Users, 
    shortTitle: "Pacientes"
  },
  { 
    title: "Prontuários", 
    url: "/medical-records", 
    icon: Stethoscope, 
    shortTitle: "Prontuários"
  },
  { 
    title: "Cuidados", 
    url: "/care", 
    icon: Heart, 
    shortTitle: "Cuidados"
  },
  { 
    title: "Medicação", 
    url: "/medication-plan", 
    icon: Pill, 
    shortTitle: "Medicação"
  },
  { 
    title: "Relatórios", 
    url: "/reports", 
    icon: FileText, 
    shortTitle: "Relatórios"
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings, 
    shortTitle: "Config"
  },
]

export function BottomNavigation() {
  const location = useLocation()
  const currentPath = location.pathname
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(path)
  }

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Verificar se pode fazer scroll
  const checkScrollButtons = () => {
    if (scrollContainerRef.current && isMobile) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollButtons()
  }, [isMobile])

  // Scroll para esquerda
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const itemWidth = scrollContainerRef.current.clientWidth / 4 // 4 itens visíveis
      scrollContainerRef.current.scrollBy({
        left: -itemWidth * 2, // Scroll 2 itens por vez
        behavior: 'smooth'
      })
    }
  }

  // Scroll para direita
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const itemWidth = scrollContainerRef.current.clientWidth / 4 // 4 itens visíveis
      scrollContainerRef.current.scrollBy({
        left: itemWidth * 2, // Scroll 2 itens por vez
        behavior: 'smooth'
      })
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full h-[70px] bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-50">
      <div className="relative h-full max-w-2xl mx-auto">
        {/* Botão de scroll esquerda - apenas mobile */}
        {isMobile && canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-center"
            aria-label="Scroll para esquerda"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Container dos atalhos */}
        <div 
          ref={scrollContainerRef}
          className={`flex items-center h-full px-2 ${
            isMobile 
              ? 'overflow-x-auto scrollbar-hide scroll-smooth' 
              : 'justify-around'
          }`}
          onScroll={checkScrollButtons}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.url)
            
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 transform active:scale-95 ${
                  isMobile 
                    ? 'min-w-[70px] flex-shrink-0 px-2 mx-1' 
                    : 'min-w-0 flex-1 px-3'
                } ${
                  active
                    ? 'text-primary bg-primary/15 scale-105 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105'
                }`}
                aria-label={item.title}
              >
                <div className={`relative ${active ? 'animate-pulse' : ''}`}>
                  <Icon 
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      active ? 'scale-110 drop-shadow-sm' : ''
                    }`} 
                  />
                  {active && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-full transition-all duration-300 ${
                  active ? 'font-semibold text-primary' : ''
                } ${isMobile ? 'text-center' : ''}`}>
                  {item.shortTitle}
                </span>
              </NavLink>
            )
          })}
        </div>

        {/* Botão de scroll direita - apenas mobile */}
        {isMobile && canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-center"
            aria-label="Scroll para direita"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </nav>
  )
}

export default BottomNavigation