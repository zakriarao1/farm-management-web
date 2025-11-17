import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import { LivestockList } from './LivestockList';
import { LivestockForm } from './LivestockForm';
import { LivestockExpenseList } from './LivestockExpenseList';
import { LivestockExpenseReports } from './LivestockExpenseReports';
import { FlockList } from './FlockList';
import { HealthRecordsManagement } from './HealthRecordsManagement'; // Your new component

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `livestock-tab-${index}`,
    'aria-controls': `livestock-tabpanel-${index}`,
  };
};

export const LivestockManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Livestock Management
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="livestock management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Animals" {...a11yProps(0)} />
          <Tab label="Add Animal" {...a11yProps(1)} />
          <Tab label="Flocks" {...a11yProps(2)} />
          <Tab label="Health Records" {...a11yProps(3)} />
          <Tab label="Expenses" {...a11yProps(4)} />
          <Tab label="Reports" {...a11yProps(5)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <LivestockList refreshTrigger={refreshTrigger} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LivestockForm />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <FlockList />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <HealthRecordsManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <LivestockExpenseList />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <LivestockExpenseReports />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default LivestockManagement;