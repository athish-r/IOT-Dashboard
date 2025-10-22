import React, { useMemo } from "react";
import _ from "lodash";
import { Cpu } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import theme from "./Theme.js";
const OperationalAnalysis = ({ data, selectedTimeRange, theme }) => {
  // 🔹 Compute Heatmap Data
  const heatmapData = useMemo(() => {
    if (!data.length) return { days: [], hours: [], data: [] };

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const heatmap = {};

    days.forEach((_, dayIndex) => {
      hours.forEach((hour) => {
        heatmap[`${dayIndex}-${hour}`] = 0;
      });
    });

    data.forEach((record) => {
      const key = `${record.dayOfWeek}-${record.hour}`;
      heatmap[key] += record.runtime_hours;
    });

    const maxValue = Math.max(...Object.values(heatmap));
    const heatmapArray = [];

    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        const value = heatmap[`${dayIndex}-${hour}`];
        heatmapArray.push({
          day: dayIndex,
          hour,
          dayName: day,
          value,
          intensity: maxValue > 0 ? (value / maxValue) * 100 : 0,
        });
      });
    });

    return { days, hours, data: heatmapArray };
  }, [data]);

  // 🔹 Compute Usage Metrics
  const usageMetrics = useMemo(() => {
  if (!data?.length) return {};

  const timeRangeString = selectedTimeRange ?? "7d";
  const timeWindow = parseFloat(timeRangeString.replace(/[^0-9]/g, "")) || 7;
  const totalTime = timeWindow * 24;

  const machineData = _.groupBy(data, "device_id");

  const idleActiveData = Object.entries(machineData)
    .map(([device, records]) => {
      const runtime = _.sumBy(records, "runtime_hours") || 0;
      const idleTime = Math.max(0, totalTime - runtime);
      return {
        device: device.slice(-8),
        activeTime: parseFloat(runtime.toFixed(1)),
        idleTime: parseFloat(idleTime.toFixed(1)),
        utilization: parseFloat(((runtime / totalTime) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.activeTime - a.activeTime);

  const performanceData = _.groupBy(data, "dateStr");
  const performanceTrends = Object.entries(performanceData)
    .map(([date, records]) => ({
      date: date.split("/")[0] + "/" + date.split("/")[1],
      cycles: records.length,
      runtime: _.sumBy(records, "runtime_hours").toFixed(1),
      energy: _.sumBy(records, "energy_active_kwh").toFixed(1),
      bales: _.sumBy(records, "productivity_bale_count_increment") || 0,
      avgUtilization: _.meanBy(records, (r) => (r.runtime_hours / 24) * 100).toFixed(1),
    }))
    .slice(-7);

  return {
    idleActiveData: idleActiveData.slice(0, 8),
    performanceTrends,
  };
}, [data, selectedTimeRange]);

  // 🔹 Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-sm mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span style={{ color: theme.text.secondary }}>{entry.name}:</span>
              <span className="font-semibold ml-auto" style={{ color: theme.text.primary }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 🔹 Render Component
  return (
    <div className="col-span-12 mt-6">
      <h2
        className="text-xl font-bold mb-4 flex items-center gap-3"
        style={{ color: theme.text.primary }}
      >
        <Cpu className="w-6 h-6" style={{ color: theme.colors.purple }} />
        Operational Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🟦 Utilization Heatmap */}
        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
            Utilization Heatmap (Hour × Day)
          </h3>
          <div style={{ height: "300px" }}>
            <div
              className="grid gap-1 h-full"
              style={{
                gridTemplateColumns: "auto repeat(24, 1fr)",
                gridTemplateRows: "auto repeat(7, 1fr)",
                fontSize: "10px",
              }}
            >
              <div></div>
              {heatmapData.hours.map((h) => (
                <div
                  key={h}
                  className="text-center font-medium flex items-center justify-center"
                  style={{ color: theme.text.muted }}
                >
                  {h % 4 === 0 ? h : ""}
                </div>
              ))}

              {heatmapData.days.map((day, dayIdx) => (
                <React.Fragment key={dayIdx}>
                  <div
                    className="font-semibold flex items-center justify-center"
                    style={{ color: theme.text.muted }}
                  >
                    {day}
                  </div>
                  {heatmapData.hours.map((hour) => {
                    const cell = heatmapData.data.find(
                      (d) => d.day === dayIdx && d.hour === hour
                    );
                    const intensity = cell ? cell.intensity : 0;
                    const opacity = intensity / 100;

                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        className="rounded transition-all duration-300 hover:scale-110 cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.teal})`,
                          opacity: opacity > 0 ? 0.3 + opacity * 0.7 : 0.1,
                        }}
                        title={`${day} ${hour}:00 - ${cell?.value.toFixed(1) || 0} hrs`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 🟩 Idle vs Active Time Chart */}
        <div
          className="rounded-xl p-6 backdrop-blur-lg"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
            Machine Utilization Analysis
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageMetrics.idleActiveData?.slice(0, 6) || []}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis type="number" stroke={theme.text.muted} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="device"
                  stroke={theme.text.muted}
                  tick={{ fontSize: 10 }}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="activeTime"
                  stackId="a"
                  fill={theme.colors.success}
                  name="Active Time (hrs)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="idleTime"
                  stackId="a"
                  fill={theme.colors.danger}
                  name="Idle Time (hrs)"
                  radius={[4, 0, 0, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalAnalysis;