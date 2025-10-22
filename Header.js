import React, { useRef } from "react";
import { Activity, Database, Wifi, Upload, RefreshCw } from "lucide-react";
import theme from "./Theme";

const Header = ({
  theme,
  data=[],
  fleetMetrics={},
  uniqueDevices,
  selectedTimeRange,
  setSelectedTimeRange,
  selectedDevice,
  setSelectedDevice,
  loadData,
  handleFileUpload,
}) => {
  
  const fileInputRef = useRef(null);
return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: theme.bg }}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-6 py-4 backdrop-blur-lg flex-shrink-0" style={{ 
        background: theme.glass,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: theme.shadows.sm
      }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: theme.gradients.primary }}>
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                Industrial Telemetry Dashboard
              </h1>
              <p className="text-sm" style={{ color: theme.text.muted }}>
                Comprehensive fleet monitoring & predictive analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg" style={{
              background: `${theme.colors.primary}20`,
              border: `1px solid ${theme.colors.primary}40`
            }}>
              <Database className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <span className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                {data.length} records
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg" style={{
              background: `${theme.colors.success}20`,
              border: `1px solid ${theme.colors.success}40`
            }}>
              <Wifi className="w-4 h-4" style={{ color: theme.colors.success }} />
              <span className="text-sm font-semibold" style={{ color: theme.colors.success }}>
                {fleetMetrics.uniqueDevices} devices online
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-6 py-3 rounded-xl flex items-center gap-3 font-semibold text-white transition-all duration-300 hover:scale-105" 
            style={{ 
              background: theme.gradients.primary,
              boxShadow: theme.shadows.md
            }}
          >
            <Upload className="w-5 h-5" />
            Upload Data
          </button>
          
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)} 
            className="px-4 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-lg" 
            style={{ 
              background: theme.card,
              color: theme.text.primary, 
              border: `1px solid ${theme.border}`,
              boxShadow: theme.shadows.sm
            }}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <select 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)} 
            className="px-4 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-lg" 
            style={{ 
              background: theme.card,
              color: theme.text.primary, 
              border: `1px solid ${theme.border}`,
              boxShadow: theme.shadows.sm
            }}
          >
            <option value="all">All Devices</option>
            {uniqueDevices.map(device => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
          
          <button 
            onClick={loadData} 
            className="p-3 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-lg" 
            style={{ 
              background: theme.card,
              color: theme.text.secondary,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.shadows.sm
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

  export default Header;