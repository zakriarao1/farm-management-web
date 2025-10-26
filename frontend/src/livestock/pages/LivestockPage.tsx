// frontend/src/livestock/pages/LivestockPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { LivestockManagement } from '../components/LivestockManagement';
import { FlockList } from '../components/FlockList';
import { LivestockExpenseList } from '../components/LivestockExpenseList';
import { LivestockExpenseReports } from '../components/LivestockExpenseReports';
import { SalesDashboard } from '../components/SalesDashboard'; // Add this import

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`livestock-tabpanel-${index}`}
      aria-labelledby={`livestock-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const LivestockPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="livestock management tabs">
          <Tab label="Animals" />
          <Tab label="Flocks" />
          <Tab label="Expenses" />
          <Tab label="Sales" /> {/* Add Sales tab */}
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <LivestockManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FlockList />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <LivestockExpenseList />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <SalesDashboard /> {/* Add Sales Dashboard */}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <LivestockExpenseReports />
      </TabPanel>
    </Box>
  );
};