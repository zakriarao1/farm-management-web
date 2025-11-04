import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import { LivestockList } from './LivestockList';
import { LivestockForm } from './LivestockForm';
import { HealthRecords } from './HealthRecords';
import { LivestockExpenseList } from './LivestockExpenseList';
import { LivestockExpenseReports } from './LivestockExpenseReports';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          <Tab label="Health Records" {...a11yProps(2)} />
          <Tab label="Expenses" {...a11yProps(3)} />
          <Tab label="Reports" {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <LivestockList />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LivestockForm />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <HealthRecords livestockId={0} healthRecords={[]} onRecordAdded={() => {}} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <LivestockExpenseList />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <LivestockExpenseReports />
        </TabPanel>
      </Paper>
    </Box>
  );
};

// Export as both named and default for flexibility
export default LivestockManagement;