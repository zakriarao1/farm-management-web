import React, { useState } from 'react';
import { cropApi } from '../services/api';

const APIDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectAPI = async () => {
    try {
      addLog('Testing direct fetch to /crops...');
      const response = await fetch('http://localhost:8888/.netlify/functions/crops');
      const data = await response.json();
      addLog(`✅ Direct /crops: ${response.status} - ${data.message}`);
    } catch (error) {
      addLog(`❌ Direct /crops failed: ${error}`);
    }
  };

  const testCropApi = async () => {
    try {
      addLog('Testing cropApi.getAll()...');
      const response = await cropApi.getAll();
      addLog(`✅ cropApi.getAll(): Success - ${response.data?.length} crops`);
    } catch (error) {
      addLog(`❌ cropApi.getAll() failed: ${error}`);
    }
  };

  const checkDashboardCalls = () => {
    // Simulate what Dashboard does
    addLog('Simulating Dashboard API calls...');
    
    // This should show us exactly what endpoints are being called
    const endpoints = ['/crops', '/expenses'];
    endpoints.forEach(endpoint => {
      addLog(`Dashboard would call: ${endpoint}`);
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
      <h3>🔍 API Debug</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={testDirectAPI}>Test /crops</button>
        <button onClick={testCropApi}>Test cropApi</button>
        <button onClick={checkDashboardCalls}>Check Dashboard Calls</button>
      </div>
      <div style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIDebug;