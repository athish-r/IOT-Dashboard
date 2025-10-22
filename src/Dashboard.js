import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, Upload } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import Header from './Components/Header';
import FleetOverViewKPI from './Components/FleetOverViewKPI';
import PerformanceAnalytics from './Components/PerformanceAnalytics';
import OperationalAnalysis from './Components/OperationalAnalysis';
import MachineRankingAndStatus from './Components/MachineRankingAndStatus';
import SafetyAndHealthMonitoring from './Components/SafetyAndHealthMonitoring';
import MaintenanceAndEOLPlanning from './Components/MaintenanceAndEOLPlanning';
import theme from "./Components/Theme";
const Dashboard = () => {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // === Theme Configuration ===
 
  // === Load Data on Mount ===
  useEffect(() => {
    loadData();
  }, []);

  // === Apply Filters when device or range changes ===
  useEffect(() => {
    applyFilters();
  }, [selectedDevice, selectedTimeRange, originalData]);

  // === File Upload Handler ===
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const text = await file.text();
      processCSVData(text);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to read file.');
      setLoading(false);
    }
  };

  // === CSV Parser ===
  const processCSVData = (csvContent) => {
    try {
      const parsed = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      if (!parsed.data?.length) throw new Error('Empty CSV file');

      const processed = parsed.data.map((row) => {
        const date = new Date(row.cycle_started_at);
        if (isNaN(date)) return null;

        const currentImbalance = ((Math.max(
          row.electrical_peak_current_rms_phase_a_a,
          row.electrical_peak_current_rms_phase_b_a,
          row.electrical_peak_current_rms_phase_c_a
        ) - Math.min(
          row.electrical_peak_current_rms_phase_a_a,
          row.electrical_peak_current_rms_phase_b_a,
          row.electrical_peak_current_rms_phase_c_a
        )) / ((row.electrical_peak_current_rms_phase_a_a +
                row.electrical_peak_current_rms_phase_b_a +
                row.electrical_peak_current_rms_phase_c_a) / 3)) * 100;

        return {
          ...row,
          date,
          dateStr: date.toLocaleDateString(),
          runtime_hours: row.cycle_duration_ms / 1000 / 3600,
          e_stop: row.di_e_stop_triggered === 'True' || row.di_e_stop_triggered === true,
          overload: row.di_overload_trip === 'True' || row.di_overload_trip === true,
          valve_issue: row.di_valve_extend_feedback_ok === 'False' || row.di_valve_retract_feedback_ok === 'False',
          anomaly: row.health_anomaly_score > 0.5,
          current_imbalance: currentImbalance,
          energy_per_cycle: row.energy_active_kwh,
          pressure_overshoot: ((row.hydraulic_max_pressure_psi - row.hydraulic_avg_pressure_psi) /
                               row.hydraulic_avg_pressure_psi) * 100
        };
      }).filter(Boolean);

      setOriginalData(processed);
      setData(processed);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to process CSV');
      setLoading(false);
    }
  };

  // === Load Default CSV ===
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/multi_device_telemetry_7days.csv');
      if (!res.ok) throw new Error('Please upload CSV file');
      const text = await res.text();
      processCSVData(text);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  // === Apply Filters ===
  const applyFilters = () => {
    if (!originalData.length) return;
    let filtered = [...originalData];

    if (selectedDevice !== 'all')
      filtered = filtered.filter((d) => d.device_id === selectedDevice);

    const now = new Date(Math.max(...originalData.map((d) => new Date(d.cycle_started_at))));
    const range = { '24h': 1, '7d': 7, '30d': 30 }[selectedTimeRange] || 0;
    const startDate = range ? new Date(now - range * 24 * 60 * 60 * 1000) : new Date(0);

    filtered = filtered.filter((d) => new Date(d.cycle_started_at) >= startDate);
    setData(filtered);
  };

  // === Unique Devices List ===
  const uniqueDevices = useMemo(
    () => _.uniqBy(originalData, 'device_id').map((d) => d.device_id).sort(),
    [originalData]
  );

  // === Loading Screen ===
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="text-center p-8 rounded-2xl backdrop-blur-lg" style={{
          background: theme.glass, border: `1px solid ${theme.border}`, boxShadow: theme.shadows.lg
        }}>
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 mx-auto" style={{
              background: theme.gradients.primary,
              mask: 'radial-gradient(transparent 30%, black 31%)'
            }}></div>
            <Activity className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-8"
              style={{ color: theme.colors.primary }} />
          </div>
          <div className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
            Processing Telemetry Data
          </div>
          <div className="text-sm" style={{ color: theme.text.muted }}>
            Analyzing industrial metrics and performance indicators...
          </div>
        </div>
      </div>
    );
  }

  // === Upload Screen ===
  if (!loading && !originalData.length) {
    return (
      <div className="h-screen flex items-center justify-center p-4" style={{ background: theme.bg }}>
        <div className="text-center p-12 rounded-2xl backdrop-blur-lg max-w-md mx-auto"
          style={{ background: theme.glass, border: `1px solid ${theme.border}`, boxShadow: theme.shadows.lg }}>
          <div className="p-6 rounded-full mb-8 mx-auto w-fit" style={{ background: `${theme.colors.primary}20` }}>
            <Upload className="w-16 h-16" style={{ color: theme.colors.primary }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.text.primary }}>
            Upload Telemetry Data
          </h2>
          <p className="text-lg mb-8" style={{ color: theme.text.secondary }}>
            Import your CSV file to begin comprehensive fleet analysis
          </p>
          {errorMessage && (
            <div className="p-4 mb-6 rounded-xl" style={{
              background: `${theme.colors.danger}20`,
              color: theme.colors.danger,
              border: `1px solid ${theme.colors.danger}40`
            }}>
              {errorMessage}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} hidden />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all"
            style={{ background: theme.gradients.primary, boxShadow: theme.shadows.lg }}
          >
            Choose CSV File
          </button>
        </div>
      </div>
    );
  }

  // === MAIN DASHBOARD ===
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: theme.bg }}>
      <Header
        theme={theme}
        uniqueDevices={uniqueDevices}
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        selectedTimeRange={selectedTimeRange}
        setSelectedTimeRange={setSelectedTimeRange}
      />

      <div className="p-6 grid grid-cols-12 gap-6">
        <FleetOverViewKPI data={data} theme={theme} />
        <PerformanceAnalytics data={data} theme={theme} selectedTimeRange={selectedTimeRange} />
        <OperationalAnalysis data={data} theme={theme} />
        <MachineRankingAndStatus data={data} theme={theme} />
        <SafetyAndHealthMonitoring data={data} theme={theme} />
        <MaintenanceAndEOLPlanning data={data} theme={theme} />
      </div>
    </div>
  );
};

export default Dashboard;
