import React from 'react';
import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationRailProps {
  collapsed?: boolean;
}

const NavigationRail: React.FC<NavigationRailProps> = ({ collapsed = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname === '/all-incidents') return 'all-incidents';
    return 'dashboard';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/');
        break;
      case 'all-incidents':
        navigate('/all-incidents');
        break;
    }
  };

  return (
    <Menu
      mode="vertical"
      selectedKeys={[getSelectedKey()]}
      onClick={handleMenuClick}
      style={{
        width: collapsed ? 64 : 200,
        height: '100%',
        borderRight: 'none',
        backgroundColor: '#fafafa',
        transition: 'width 0.2s'
      }}
      items={[
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: collapsed ? null : 'Dashboard',
          title: 'Dashboard'
        },
        {
          key: 'all-incidents',
          icon: <UnorderedListOutlined />,
          label: collapsed ? null : 'All Incidents',
          title: 'All Incidents'
        }
      ]}
    />
  );
};

export default NavigationRail;