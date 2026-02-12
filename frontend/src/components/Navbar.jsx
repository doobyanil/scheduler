import { Bell, Menu, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 mr-4 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-primary">Academic Calendar</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <User size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
