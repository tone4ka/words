import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAppSelector } from "../store/hooks";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatisticData {
  words_count: number;
  created_at: string;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [chartData, setChartData] = useState<
    { label: string; value: number }[]
  >([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchStatistics();
    }
  }, [isOpen, user, period]);

  const fetchStatistics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("statistic")
        .select("words_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      processChartData(data || []);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const processChartData = (data: StatisticData[]) => {
    const now = new Date();
    const chartEntries: { [key: string]: number } = {};

    if (period === "month") {
      // Последние 30 дней
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        chartEntries[dateKey] = 0;
      }

      data.forEach((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        if (chartEntries.hasOwnProperty(itemDate)) {
          chartEntries[itemDate] += item.words_count;
        }
      });

      setChartData(
        Object.entries(chartEntries).map(([date, count]) => ({
          label: new Date(date).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          }),
          value: count,
        }))
      );
    } else {
      // Последние 12 месяцев
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        chartEntries[monthKey] = 0;
      }

      data.forEach((item) => {
        const itemDate = new Date(item.created_at);
        const monthKey = `${itemDate.getFullYear()}-${String(
          itemDate.getMonth() + 1
        ).padStart(2, "0")}`;
        if (chartEntries.hasOwnProperty(monthKey)) {
          chartEntries[monthKey] += item.words_count;
        }
      });

      setChartData(
        Object.entries(chartEntries).map(([month, count]) => {
          const [year, monthNum] = month.split("-");
          const date = new Date(parseInt(year), parseInt(monthNum) - 1);
          return {
            label: date.toLocaleDateString("ru-RU", {
              month: "short",
              year: "numeric",
            }),
            value: count,
          };
        })
      );
    }
  };

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  if (!isOpen) return null;

  return (
    <div className="statistics-modal-overlay" onClick={onClose}>
      <div className="statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="statistics-modal-header">
          <h2>Изученные слова</h2>
          <button className="statistics-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="statistics-controls">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "month" | "year")}
            className="statistics-period-select"
          >
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
        </div>

        <div className="statistics-chart">
          <div className="chart-y-axis">
            <span className="y-axis-label">{maxValue}</span>
            <span className="y-axis-label">{Math.floor(maxValue * 0.75)}</span>
            <span className="y-axis-label">{Math.floor(maxValue * 0.5)}</span>
            <span className="y-axis-label">{Math.floor(maxValue * 0.25)}</span>
            <span className="y-axis-label">0</span>
          </div>

          <div className="chart-container">
            <div className="chart-bars">
              {chartData.map((item, index) => (
                <div key={index} className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.value > 0 ? "#4299e1" : "#e2e8f0",
                    }}
                    data-tooltip={`${item.label}: ${item.value} слов`}
                  ></div>
                  <span className="chart-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
