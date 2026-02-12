import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Calendar, FileText, Settings, Plus, Home } from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  const menuItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      path: '/courses',
      icon: BookOpen,
      label: 'My Courses'
    },
    {
      path: '/courses/create',
      icon: Plus,
      label: 'Create Course'
    },
    {
      path: '/reschedule',
      icon: Calendar,
      label: 'Reschedule'
    },
    {
      path: '/profile',
      icon: Settings,
      label: 'Settings'
    }
  ]

  const isActive = (path) => {
    if (path === '/courses' && location.pathname.startsWith('/courses/')) {
      return true
    }
    return location.pathname === path
  }

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={16} />
            </div>
            <h2 className="text-lg font-bold">Academic Calendar</h2>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
    </>
  )
}

export default Sidebar
