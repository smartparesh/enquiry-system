import { Menu, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ setMobileOpen }) => {
  const { user } = useAuth();
  
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" onClick={() => setMobileOpen(true)}>
          <Menu size={24} />
        </button>
      </div>
      
      <div className="header-right">
        <button className="icon-button">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="user-profile">
          <div className="avatar">
            <UserIcon size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Loading...'}</span>
            <span className="user-role">{user?.role || ''}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
