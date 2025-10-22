import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import _ from "lodash";
import theme from "./Theme.js";
const PerformanceAnalytics = ({ data = [], selectedTimeRange = "7d", theme }) => {
  /** -------------------------------
   * 🧮 Derived Performance Metrics
   * ------------------------------- */
  const usageMetrics = useMemo(() => {
    if (!data.length) return { idleActiveData: [], performanceTrends: [] };

    const timeWindow = parseFloat(selectedTimeRange.replace(/\D/g, "")) || 7;
    const totalTime = timeWindow * 24;

    // Group data by device for utilization
    const machineData = _.groupBy(data, "device_id");
    const idleActiveData = Object.entries(machineData)
      .map(([device, records]) => {
        const runtime = _.sumBy(records, "runtime_hours") || 0;
        const idleTime = Math.max(0, totalTime - runtime);

        return {
          device: device.slice(-8),
          activeTime: +runtime.toFixed(1),
          idleTime: +idleTime.toFixed(1),
          utilization: +((runtime / totalTime) * 100).toFixed(1),
        };
      })
      .sort((a, b) => b.activeTime - a.activeTime)
      .slice(0, 8);

    // Group data by date for performance trends
    const performanceTrends = Object.entries(_.groupBy(data, "dateStr"))
      .map(([date, records]) => {
        const [month, day] = date.split("/");
        return {
          date: `${month}/${day}`,
          cycles: records.length,
          runtime: +_.sumBy(records, "runtime_hours").toFixed(1),
          energy: +_.sumBy(records, "energy_active_kwh").toFixed(1),
          bales: _.sumBy(records, "productivity_bale_count_increment") || 0,
          avgUtilization: +_.meanBy(records, (r) => (r.runtime_hours / 24) * 100).toFixed(1),
        };
      })
      .slice(-7);

    return { idleActiveData, performanceTrends };
  }, [data, selectedTimeRange]);

  /** -------------------------------
   * ⚙️ Derived Health Metrics
   * ------------------------------- */
  const healthMetrics = useMemo(() => {
    if (!data.length) {
      return {
        avgCurrentImbalance: 0,
        avgPressureOvershoot: 0,
        cycleTimeDrift: 0,
        avgEnergyPerCycle: 0,
        trendData: [],
      };
    }

    const avgCurrentImbalance = _.meanBy(data, "current_imbalance") || 0;
    const avgPressureOvershoot = _.meanBy(data, "pressure_overshoot") || 0;
    const avgEnergyPerCycle = _.meanBy(data, "energy_per_cycle") || 0;

    const cycleTimes = data.map((d) => d.cycle_duration_ms).sort((a, b) => a - b);
    const baselineCycleTime = cycleTimes[Math.floor(cycleTimes.length / 2)] || 1; // prevent divide-by-zero

    const cycleTimeDrift =
      _.meanBy(
        data,
        (d) => ((d.cycle_duration_ms - baselineCycleTime) / baselineCycleTime) * 100
      ) || 0;

    const trendData = Object.entries(_.groupBy(data, "dateStr"))
      .map(([date, records]) => {
        const [month, day] = date.split("/");
        return {
          date: `${month}/${day}`,
          currentImbalance: _.meanBy(records, "current_imbalance") || 0,
          pressureOvershoot: _.meanBy(records, "pressure_overshoot") || 0,
          cycleTimeDrift:
            _.meanBy(
              records,
              (r) => ((r.cycle_duration_ms - baselineCycleTime) / baselineCycleTime) * 100
            ) || 0,
          energyPerCycle: _.meanBy(records, "energy_per_cycle") || 0,
        };
      })
      .slice(-7);

    return {
      avgCurrentImbalance: +avgCurrentImbalance.toFixed(1),
      avgPressureOvershoot: +avgPressureOvershoot.toFixed(1),
      cycleTimeDrift: +cycleTimeDrift.toFixed(1),
      avgEnergyPerCycle: +avgEnergyPerCycle.toFixed(2),
      trendData,
    };
  }, [data]);

  /** -------------------------------
   * 💡 Custom Tooltip
   * ------------------------------- */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="p-4 rounded-xl backdrop-blur-lg max-w-xs"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadows.lg,
        }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text.primary }}>
          {label}
        </p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 text-sm mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span style={{ color: theme.text.secondary }}>{entry.name}:</span>
            <span className="font-semibold ml-auto" style={{ color: theme.text.primary }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  /** -------------------------------
   * 📊 Render
   * ------------------------------- */
  return (
    <div className="col-span-8">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <BarChart3 className="w-6 h-6" style={{ color: theme.colors.success }} />
        Performance Analytics
      </h2>

      {/* --- Performance Trends Chart --- */}
      <div
        className="rounded-xl p-6 mb-6 backdrop-blur-lg"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadows.md,
          height: 400,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
          Performance Trends & Key Metrics
        </h3>

        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart
            data={usageMetrics.performanceTrends}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="cyclesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.8} />
                <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="date" stroke={theme.text.muted} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" stroke={theme.text.muted} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.text.muted} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="left"
              dataKey="cycles"
              fill="url(#cyclesGradient)"
              radius={[4, 4, 0, 0]}
              name="Cycles"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="runtime"
              stroke={theme.colors.success}
              strokeWidth={3}
              dot={{ r: 5, fill: theme.colors.success }}
              name="Runtime (hrs)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="energy"
              stroke={theme.colors.warning}
              strokeWidth={3}
              dot={{ r: 5, fill: theme.colors.warning }}
              name="Energy (kWh)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* --- Machine Health Trends Chart --- */}
      <div
        className="rounded-xl p-6 backdrop-blur-lg"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadows.md,
          height: 350,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
          Machine Health Trends
        </h3>

        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={healthMetrics.trendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="date" stroke={theme.text.muted} tick={{ fontSize: 12 }} />
            <YAxis stroke={theme.text.muted} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="currentImbalance"
              stroke={theme.colors.danger}
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Current Imbalance %"
            />
            <Line
              type="monotone"
              dataKey="pressureOvershoot"
              stroke={theme.colors.warning}
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Pressure Overshoot %"
            />
            <Line
              type="monotone"
              dataKey="cycleTimeDrift"
              stroke={theme.colors.purple}
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Cycle Time Drift %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
