// frontend/components/Navigation.tsx

import React from 'react';
import { Link } from 'react-router-dom';

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <ul className="nav-links">
        <li>
          <Link to="/">Farm Management</Link>
        </li>
        <li>
          <Link to="/crops">All Crops</Link>
        </li>
        <li>
          <Link to="/crops/new">Add Crop</Link>
        </li>
      </ul>
    </nav>
  );
};
