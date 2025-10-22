import React, { useMemo } from "react";
import { Shield } from "lucide-react";
import _ from "lodash";
import theme from "./Theme.js";
const SafetyAndHealthMonitoring = ({ data = [], theme }) => {
  /** -------------------------------
   * ⚙️ Safety Metrics
   * ------------------------------- */
  const safetyMetrics = useMemo(() => {
    if (!data.length)
      return {
        eStopCount: 0,
        overloadCount: 0,
        doorGateViolations: 0,
        valveIssues: 0,
        errorTrendData: [],
      };

    const eStopCount = data.filter((d) => d.e_stop).length;
    const overloadCount = data.filter((d) => d.overload).length;
    const doorGateViolations =
      (_.sumBy(data, "di_door_open_events") || 0) +
      (_.sumBy(data, "di_gate_open_events") || 0);
    const valveIssues = data.filter((d) => d.valve_issue).length;

    const errorTrendData = Object.entries(_.groupBy(data, "dateStr"))
      .map(([date, records]) => {
        const [month, day] = date.split("/");
        return {
          date: `${month}/${day}`,
          eStops: records.filter((r) => r.e_stop).length,
          overloads: records.filter((r) => r.overload).length,
          doorGate:
            (_.sumBy(records, "di_door_open_events") || 0) +
            (_.sumBy(records, "di_gate_open_events") || 0),
          valveIssues: records.filter((r) => r.valve_issue).length,
        };
      })
      .slice(-7);

    return {
      eStopCount,
      overloadCount,
      doorGateViolations,
      valveIssues,
      errorTrendData,
    };
  }, [data]);

  /** -------------------------------
   * 🧠 Health Metrics
   * ------------------------------- */
  const healthMetrics = useMemo(() => {
    if (!data.length)
      return {
        avgCurrentImbalance: 0,
        avgPressureOvershoot: 0,
        cycleTimeDrift: 0,
        avgEnergyPerCycle: 0,
        trendData: [],
      };

    const avgCurrentImbalance = _.meanBy(data, "current_imbalance") || 0;
    const avgPressureOvershoot = _.meanBy(data, "pressure_overshoot") || 0;
    const avgEnergyPerCycle = _.meanBy(data, "energy_per_cycle") || 0;

    const sortedCycleTimes = data.map((d) => d.cycle_duration_ms).sort((a, b) => a - b);
    const baselineCycleTime = sortedCycleTimes[Math.floor(sortedCycleTimes.length / 2)] || 1;

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
              (r) =>
                ((r.cycle_duration_ms - baselineCycleTime) / baselineCycleTime) * 100
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
   * 🚨 Anomaly Metrics
   * ------------------------------- */
  const anomalyMetrics = useMemo(() => {
    if (!data.length)
      return {
        anomalyCount: 0,
        avgAnomalyScore: 0,
        highAnomalyMachines: [],
        anomalyTrendData: [],
      };

    const anomalyRecords = data.filter((d) => d.anomaly);
    const anomalyCount = anomalyRecords.length;
    const avgAnomalyScore = _.meanBy(data, "health_anomaly_score") || 0;

    const machineAnomalies = _.groupBy(anomalyRecords, "device_id");
    const highAnomalyMachines = Object.entries(machineAnomalies)
      .filter(([, anomalies]) => anomalies.length > 3)
      .map(([device, anomalies]) => ({
        device,
        anomalyCount: anomalies.length,
        avgScore: +(_.meanBy(anomalies, "health_anomaly_score") * 100).toFixed(1),
        lastAnomaly: Math.max(
          ...anomalies.map((a) => new Date(a.cycle_started_at).getTime())
        ),
      }))
      .sort((a, b) => b.lastAnomaly - a.lastAnomaly)
      .slice(0, 5);

    const anomalyTrendData = Object.entries(_.groupBy(data, "dateStr"))
      .map(([date, records]) => {
        const [month, day] = date.split("/");
        return {
          date: `${month}/${day}`,
          anomalies: records.filter((r) => r.anomaly).length,
          avgScore: +((_.meanBy(records, "health_anomaly_score") || 0) * 100).toFixed(1),
        };
      })
      .slice(-7);

    return {
      anomalyCount,
      avgAnomalyScore: +(avgAnomalyScore * 100).toFixed(1),
      highAnomalyMachines,
      anomalyTrendData,
    };
  }, [data]);

  /** -------------------------------
   * 🧩 Render
   * ------------------------------- */
  return (
    <div className="col-span-12 mt-6">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <Shield className="w-6 h-6" style={{ color: theme.colors.danger }} />
        Safety & Health Monitoring
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🟥 Safety Dashboard */}
        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
            Safety Dashboard
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "E-STOP ACTIVATIONS", color: theme.colors.danger, value: safetyMetrics.eStopCount },
              { label: "OVERLOAD TRIPS", color: theme.colors.orange, value: safetyMetrics.overloadCount },
              { label: "DOOR/GATE VIOLATIONS", color: theme.colors.warning, value: safetyMetrics.doorGateViolations },
              { label: "VALVE ISSUES", color: theme.colors.purple, value: safetyMetrics.valveIssues },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl text-center"
                style={{ background: `${item.color}15` }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: item.color }}>
                  {item.label}
                </div>
                <div className="text-3xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 💚 Health Metrics */}
        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
            Health Metrics
          </h3>

          {[
            { label: "Current Imbalance", value: `${healthMetrics.avgCurrentImbalance}%` },
            { label: "Pressure Overshoot", value: `${healthMetrics.avgPressureOvershoot}%` },
            { label: "Cycle Time Drift", value: `${healthMetrics.cycleTimeDrift}%` },
            { label: "Energy per Cycle", value: `${healthMetrics.avgEnergyPerCycle} kWh` },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 mb-3 rounded-lg"
              style={{ background: theme.glass }}
            >
              <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                {item.label}
              </span>
              <span className="text-lg font-bold" style={{ color: theme.text.primary }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* 🧠 Anomaly Detection */}
        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
            Anomaly Detection
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 rounded-xl" style={{ background: theme.glass }}>
              <div className="text-3xl font-bold" style={{ color: theme.colors.danger }}>
                {anomalyMetrics.avgAnomalyScore}%
              </div>
              <div className="text-xs font-semibold" style={{ color: theme.text.secondary }}>
                AVG ANOMALY SCORE
              </div>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: theme.glass }}>
              <div className="text-3xl font-bold" style={{ color: theme.colors.orange }}>
                {anomalyMetrics.anomalyCount}
              </div>
              <div className="text-xs font-semibold" style={{ color: theme.text.secondary }}>
                ANOMALIES DETECTED
              </div>
            </div>
          </div>

          {anomalyMetrics.highAnomalyMachines?.length > 0 && (
            <div>
              <div
                className="text-sm font-semibold mb-3"
                style={{ color: theme.colors.danger }}
              >
                ⚠️ High Risk Machines
              </div>

              <div className="space-y-2">
                {anomalyMetrics.highAnomalyMachines.slice(0, 3).map((machine) => (
                  <div
                    key={machine.device}
                    className="flex justify-between text-sm p-3 rounded-lg"
                    style={{
                      background: `${theme.colors.danger}20`,
                      border: `1px solid ${theme.colors.danger}40`,
                    }}
                  >
                    <span style={{ color: theme.text.primary }}>
                      {machine.device.slice(-10)}
                    </span>
                    <span style={{ color: theme.colors.danger }}>
                      {machine.anomalyCount} alerts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyAndHealthMonitoring;
