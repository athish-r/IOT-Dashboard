import React, { useMemo } from "react";
import _ from "lodash";
import {
  Users,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import theme from "./Theme.js";
const MachineRankingAndStatus = ({ data, theme }) => {
  const machineRankings = useMemo(() => {
    if (!data?.length) return { top5: [], bottom5: [] };

    const grouped = _.groupBy(data, "device_id");

    const machines = Object.entries(grouped).map(([device, records]) => {
      const runtime = _.sumBy(records, "runtime_hours") || 0;
      const errors = records.filter((r) => r.e_stop || r.overload).length;
      const efficiency = errors > 0 ? runtime / errors : runtime;

      return {
        device,
        runtime: runtime.toFixed(1),
        cycles: records.length,
        energy: (_.sumBy(records, "energy_active_kwh") || 0).toFixed(1),
        errors,
        efficiency: efficiency.toFixed(1),
        utilization: ((runtime / (7 * 24)) * 100).toFixed(1),
        status: errors > 0 ? "Warning" : "Healthy",
      };
    }).sort((a, b) => parseFloat(b.runtime) - parseFloat(a.runtime));

    return {
      top5: machines.slice(0, 5),
      bottom5: machines.slice(-5).reverse(),
    };
  }, [data]);
//Body
  return (
    <div className="col-span-4">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <Users className="w-6 h-6" style={{ color: theme.colors.teal }} />
        Machine Rankings
      </h2>

      {/* --- Top Performers --- */}
      <div
        className="rounded-xl p-6 mb-4 backdrop-blur-lg"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadows.md,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2 rounded-lg"
            style={{ background: `${theme.colors.success}20` }}
          >
            <ChevronUp
              className="w-5 h-5"
              style={{ color: theme.colors.success }}
            />
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: theme.text.primary }}
          >
            Top Performers
          </span>
        </div>

        <div className="space-y-3">
          {machineRankings.top5.map((machine, idx) => (
            <div
              key={machine.device}
              className="flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ background: theme.glass }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: theme.gradients.success,
                    color: "white",
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.text.primary }}
                  >
                    {machine.device.slice(-10)}
                  </div>
                  <div className="text-xs" style={{ color: theme.text.muted }}>
                    {machine.cycles} cycles
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm font-bold"
                  style={{ color: theme.colors.success }}
                >
                  {machine.runtime}h
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  {machine.utilization}% util
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Attention Needed --- */}
      <div
        className="rounded-xl p-6 backdrop-blur-lg"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadows.md,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2 rounded-lg"
            style={{ background: `${theme.colors.warning}20` }}
          >
            <ChevronDown
              className="w-5 h-5"
              style={{ color: theme.colors.warning }}
            />
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: theme.text.primary }}
          >
            Attention Needed
          </span>
        </div>

        <div className="space-y-3">
          {machineRankings.bottom5.map((machine, idx) => (
            <div
              key={machine.device}
              className="flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ background: theme.glass }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: theme.gradients.warning,
                    color: "white",
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.text.primary }}
                  >
                    {machine.device.slice(-10)}
                  </div>
                  <div className="text-xs" style={{ color: theme.text.muted }}>
                    {machine.errors} errors
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm font-bold"
                  style={{ color: theme.colors.warning }}
                >
                  {machine.runtime}h
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  {machine.utilization}% util
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MachineRankingAndStatus;