import React, { useMemo } from "react";
import _ from "lodash";
import {
  Target,
  Clock,
  Gauge,
  Activity,
  AlertTriangle,
  BarChart3,
  Zap,
  Box,
  Wifi,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import theme from "./Theme.js";
const FleetOverviewKPI = ({ data, theme }) => {
  // ---- Derived Fleet Metrics ----
  const fleetMetrics = useMemo(() => {
    if (!data.length) return {};

    const totalRuntime = _.sumBy(data, "runtime_hours");
    const totalCycles = data.length;
    const uniqueDevices = _.uniqBy(data, "device_id").length;

    const latestDate = new Date(Math.max(...data.map((d) => new Date(d.cycle_started_at))));
    const earliestDate = new Date(Math.min(...data.map((d) => new Date(d.cycle_started_at))));
    const hoursInWindow = Math.max((latestDate - earliestDate) / (1000 * 60 * 60), 1);
    const utilizationRate = (totalRuntime / (uniqueDevices * hoursInWindow)) * 100;

    const errorCount = data.filter((d) => d.e_stop || d.overload).length;
    const avgCyclesPerMachine = totalCycles / uniqueDevices;
    const totalEnergy = _.sumBy(data, "energy_active_kwh");
    const totalBales = _.sumBy(data, "productivity_bale_count_increment") || 0;

    return {
      totalRuntime: totalRuntime.toFixed(1),
      utilizationRate: Math.min(utilizationRate, 100).toFixed(1),
      totalCycles,
      errorCount,
      uniqueDevices,
      avgCyclesPerMachine: avgCyclesPerMachine.toFixed(1),
      totalEnergy: totalEnergy.toFixed(1),
      totalBales
    };
  }, [data]);

  // ---- Render ----
  return (
    <div className="col-span-12 mb-4">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <Target className="w-6 h-6" style={{ color: theme.colors.primary }} />
        Fleet Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <MetricCard
          title="Total Runtime"
          subtitle="Sum(cycle_duration_ms)÷3600"
          value={fleetMetrics.totalRuntime}
          unit="hrs"
          trend={5.2}
          icon={Clock}
          gradient={theme.gradients.primary}
          theme={theme}
        />
        <MetricCard
          title="Utilization Rate"
          subtitle="Runtime÷(Window×Machines)"
          value={fleetMetrics.utilizationRate}
          unit="%"
          trend={-2.1}
          icon={Gauge}
          gradient={theme.gradients.success}
          theme={theme}
        />
        <MetricCard
          title="Total Cycles"
          subtitle="Count of completed cycles"
          value={fleetMetrics.totalCycles}
          trend={8.3}
          icon={Activity}
          gradient={theme.gradients.teal}
          theme={theme}
        />
        <MetricCard
          title="Error Incidents"
          subtitle="E-stops + Overloads"
          value={fleetMetrics.errorCount}
          trend={-12.5}
          icon={AlertTriangle}
          gradient={theme.gradients.danger}
          theme={theme}
        />
        <MetricCard
          title="Avg Cycles/Machine"
          subtitle="Workload balance indicator"
          value={fleetMetrics.avgCyclesPerMachine}
          icon={BarChart3}
          gradient={theme.gradients.warning}
          theme={theme}
        />
        <MetricCard
          title="Total Energy"
          subtitle="Sum(energy_active_kwh)"
          value={fleetMetrics.totalEnergy}
          unit="kWh"
          icon={Zap}
          gradient={theme.gradients.purple}
          theme={theme}
        />
        <MetricCard
          title="Bales Produced"
          subtitle="Sum(bale_count_increment)"
          value={fleetMetrics.totalBales}
          icon={Box}
          gradient={theme.gradients.teal}
          theme={theme}
        />
        <MetricCard
          title="Active Devices"
          subtitle="Devices reporting data"
          value={fleetMetrics.uniqueDevices}
          icon={Wifi}
          gradient={theme.gradients.success}
          theme={theme}
        />
      </div>
    </div>
  );
};

// ---- Reusable MetricCard ----
const MetricCard = ({
  title,
  value,
  unit,
  trend,
  subtitle,
  icon: Icon,
  gradient,
  size = "normal",
  theme
}) => (
  <div
    className={`rounded-xl backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] ${
      size === "large" ? "p-6" : "p-4"
    }`}
    style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadows.md
    }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div
          className={`font-semibold uppercase tracking-wider mb-1 ${
            size === "large" ? "text-sm" : "text-xs"
          }`}
          style={{ color: theme.text.muted }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-xs opacity-75" style={{ color: theme.text.muted }}>
            {subtitle}
          </div>
        )}
      </div>
      {Icon && (
        <div
          className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
          style={{ background: gradient || `${theme.colors.primary}20` }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      )}
    </div>

    <div className="flex items-baseline gap-2 mb-3">
      <span
        className={`font-bold ${size === "large" ? "text-4xl" : "text-2xl"}`}
        style={{ color: theme.text.primary }}
      >
        {value}
      </span>
      {unit && (
        <span className="text-lg font-medium" style={{ color: theme.text.secondary }}>
          {unit}
        </span>
      )}
    </div>

    {trend !== undefined && (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 px-3 py-1 rounded-full"
          style={{
            background: trend > 0 ? `${theme.colors.success}20` : `${theme.colors.danger}20`
          }}
        >
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4" style={{ color: theme.colors.success }} />
          ) : (
            <TrendingDown className="w-4 h-4" style={{ color: theme.colors.danger }} />
          )}
          <span
            className="text-sm font-semibold"
            style={{
              color: trend > 0 ? theme.colors.success : theme.colors.danger
            }}
          >
            {Math.abs(trend)}%
          </span>
        </div>
        <span className="text-sm" style={{ color: theme.text.muted }}>
          vs last period
        </span>
      </div>
    )}
  </div>
);

export default FleetOverviewKPI;
