import React from 'react';
import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  CarOutlined, 
  EnvironmentOutlined 
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
    if (location.pathname.startsWith('/train')) return 'top-trains';
    if (location.pathname === '/top-sections') return 'top-sections';
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
      case 'top-trains':
        navigate('/train');
        break;
      case 'top-sections':
        navigate('/top-sections');
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
        },
        {
          key: 'top-trains',
          icon: <CarOutlined />,
          label: collapsed ? null : 'Top Affected: Trains',
          title: 'Top Affected: Trains'
        },
        {
          key: 'top-sections',
          icon: <EnvironmentOutlined />,
          label: collapsed ? null : 'Top Affected: Sections',
          title: 'Top Affected: Sections'
        }
      ]}
    />
  );
};

export default NavigationRail;