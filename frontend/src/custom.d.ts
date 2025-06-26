// Allow importing of pages and components
declare module './pages/Dashboard' {
  import React from 'react';
  const Dashboard: React.FC;
  export default Dashboard;
}

declare module './pages/Map' {
  import React from 'react';
  const Map: React.FC;
  export default Map;
}

declare module './pages/Analytics' {
  import React from 'react';
  const Analytics: React.FC;
  export default Analytics;
}

declare module './components/Header' {
  import React from 'react';
  const Header: React.FC;
  export default Header;
}

declare module './components/Footer' {
  import React from 'react';
  const Footer: React.FC;
  export default Footer;
} 