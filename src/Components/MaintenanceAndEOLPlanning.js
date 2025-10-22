import React, { useMemo } from "react";
import { Wrench, Timer, Battery, TrendingUp, TrendingDown } from "lucide-react";
import _ from "lodash";
import theme from "./Theme.js";
const MaintenanceAndEOLPlanning = ({ data, theme }) => {
  // === COMPUTED METRICS ===
  const eolMetrics = useMemo(() => {
    if (!data.length) return {};

    const machineData = _.groupBy(data, "device_id");
    const eolData = Object.entries(machineData).map(([device, records]) => {
      const lifetimeCycles = records.length * 52; // Extrapolate to yearly
      const eolThreshold = 50000;
      const remainingLife = Math.max(
        0,
        ((eolThreshold - lifetimeCycles) / eolThreshold) * 100
      );

      const errorCount = records.filter((r) => r.e_stop || r.overload).length;
      const runtime = _.sumBy(records, "runtime_hours") || 0;
      const mtbf = errorCount > 0 ? runtime / errorCount : runtime;
      const mttr = errorCount > 0 ? 2.5 : 0; // Estimated repair time

      return {
        device,
        lifetimeCycles,
        remainingLife: remainingLife.toFixed(1),
        mtbf: mtbf.toFixed(1),
        mttr: mttr.toFixed(1),
        isNearEOL:
          remainingLife < 10 ||
          (_.meanBy(records, "health_anomaly_score") || 0) > 0.7,
      };
    }).sort((a, b) => parseFloat(a.remainingLife) - parseFloat(b.remainingLife));

    const avgMTBF = _.meanBy(eolData, (d) => parseFloat(d.mtbf)) || 0;
    const avgMTTR = _.meanBy(eolData, (d) => parseFloat(d.mttr)) || 0;
    const avgRemainingLife =
      _.meanBy(eolData, (d) => parseFloat(d.remainingLife)) || 0;
    const eolMachines = eolData.filter((d) => d.isNearEOL);

    return {
      avgMTBF: avgMTBF.toFixed(1),
      avgMTTR: avgMTTR.toFixed(1),
      avgRemainingLife: avgRemainingLife.toFixed(1),
      eolMachines: eolMachines.slice(0, 5),
      totalMachines: eolData.length,
    };
  }, [data]);

  // === REUSABLE CARD ===
  const MetricCard = ({
    title,
    value,
    unit,
    trend,
    subtitle,
    icon: Icon,
    gradient,
    size = "normal",
  }) => (
    <div
      className={`rounded-xl backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] ${
        size === "large" ? "p-6" : "p-4"
      }`}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadows.md,
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
            style={{
              background: gradient || `${theme.colors.primary}20`,
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={`font-bold ${
            size === "large" ? "text-4xl" : "text-2xl"
          }`}
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
              background:
                trend > 0
                  ? `${theme.colors.success}20`
                  : `${theme.colors.danger}20`,
            }}
          >
            {trend > 0 ? (
              <TrendingUp
                className="w-4 h-4"
                style={{ color: theme.colors.success }}
              />
            ) : (
              <TrendingDown
                className="w-4 h-4"
                style={{ color: theme.colors.danger }}
              />
            )}
            <span
              className="text-sm font-semibold"
              style={{
                color:
                  trend > 0 ? theme.colors.success : theme.colors.danger,
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

  // === MAIN RENDER ===
  return (
    <div className="col-span-12 mt-6">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <Wrench className="w-6 h-6" style={{ color: theme.colors.warning }} />
        Maintenance & EOL Planning
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Mean Time Between Failures"
          subtitle="MTBF (hours)"
          value={eolMetrics.avgMTBF}
          unit="hrs"
          icon={Timer}
          gradient={theme.gradients.teal}
          size="large"
        />

        <MetricCard
          title="Mean Time To Repair"
          subtitle="MTTR (hours)"
          value={eolMetrics.avgMTTR}
          unit="hrs"
          icon={Wrench}
          gradient={theme.gradients.warning}
          size="large"
        />

        <MetricCard
          title="Average Remaining Life"
          subtitle="Fleet EOL estimate"
          value={eolMetrics.avgRemainingLife}
          unit="%"
          icon={Battery}
          gradient={theme.gradients.success}
          size="large"
        />

        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: theme.text.primary }}
          >
            EOL Alert Machines
          </h3>

          {eolMetrics.eolMachines?.length > 0 ? (
            <div className="space-y-3">
              {eolMetrics.eolMachines.slice(0, 4).map((machine) => (
                <div
                  key={machine.device}
                  className="flex justify-between text-sm p-3 rounded-lg"
                  style={{
                    background: `${theme.colors.warning}20`,
                    border: `1px solid ${theme.colors.warning}40`,
                  }}
                >
                  <span style={{ color: theme.text.primary }}>
                    {machine.device.slice(-10)}
                  </span>
                  <span style={{ color: theme.colors.warning }}>
                    {machine.remainingLife}% life
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-sm" style={{ color: theme.colors.success }}>
                ✓ All machines operating within normal parameters
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAndEOLPlanning;