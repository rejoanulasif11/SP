import { 
  FaHome, FaFileContract, FaFileInvoice, FaEnvelope, 
  FaShoppingCart, FaChartBar, FaCog 
} from 'react-icons/fa';
import { NavLink, useLocation } from 'react-router-dom';
import Header from './Header';

const LeftPanel = ({ show, onClose }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className={`left-panel${show ? ' active' : ''}`}>
      <button className="close-sidebar-btn" onClick={onClose} style={{ display: 'none', position: 'absolute', right: 12, top: 12, zIndex: 201 }}>×</button>
      <nav>
        <ul style={{padding: 0, margin: 0, listStyle: 'none'}}>
          <li className={isActive('/') ? 'active' : ''} style={{marginBottom: 8}}>
            <NavLink to="/" className={({isActive}) => isActive ? 'active-link' : ''}>
              <FaHome className="icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          {/* <li style={{marginBottom: 8}}>
            <NavLink to="http://localhost:8000/admin/login/?next=/admin/">
              <FaFileInvoice className="icon" />
              <span>Adminstration</span>
            </NavLink>
          </li> */}
          <li className={isActive('agreements') ? 'active' : ''} style={{marginBottom: 8}}>
            <NavLink to="/agreements" className={({isActive}) => isActive ? 'active-link' : ''}>
              <FaFileContract className="icon" />
              <span>Agreements</span>
            </NavLink>
          </li>
          <li style={{marginBottom: 8}}>
            <NavLink to="/invoices">
              <FaFileInvoice className="icon" />
              <span>Invoices</span>
            </NavLink>
          </li>
          <li style={{marginBottom: 8}}>
            <NavLink to="/letters">
              <FaEnvelope className="icon" />
              <span>Letters</span>
            </NavLink>
          </li>
          <li style={{marginBottom: 8}}>
            <NavLink to="/requisitions">
              <FaShoppingCart className="icon" />
              <span>Requisitions</span>
            </NavLink>
          </li>
          <li style={{marginBottom: 8}}>
            <NavLink to="/reports">
              <FaChartBar className="icon" />
              <span>Reports</span>
            </NavLink>
          </li>
          <li className={isActive('settings') ? 'active' : ''}>
            <NavLink to="/settings" className={({isActive}) => isActive ? 'active-link' : ''}>
              <FaCog className="icon" />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default LeftPanel;