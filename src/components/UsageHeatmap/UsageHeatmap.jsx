'use client';

import styles from './UsageHeatmap.module.css';

export default function UsageHeatmap({ data }) {
  if (!data) {
    return <div className={styles.empty}>No data available</div>;
  }

  // Create heatmap grid for hours (0-23) and days of week (1-7)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create data map
  const dataMap = {};
  if (data.activityData) {
    data.activityData.forEach((item) => {
      const key = `${item._id.hour}-${item._id.dayOfWeek}`;
      dataMap[key] = item.count;
    });
  }

  const maxCount = Math.max(...Object.values(dataMap), 1);

  const getIntensity = (count) => {
    if (!count || count === 0) return 0;
    const percentage = (count / maxCount) * 100;
    if (percentage < 20) return 1;
    if (percentage < 40) return 2;
    if (percentage < 60) return 3;
    if (percentage < 80) return 4;
    return 5;
  };

  return (
    <div className={styles.heatmap}>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Activity by Hour and Day</h2>
        <div className={styles.grid}>
          <div className={styles.corner}></div>
          {daysOfWeek.map((day, dayIndex) => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
          {hours.map((hour) => (
            <>
              <div key={`hour-${hour}`} className={styles.hourLabel}>
                {hour}:00
              </div>
              {daysOfWeek.map((day, dayIndex) => {
                const key = `${hour}-${dayIndex + 1}`;
                const count = dataMap[key] || 0;
                const intensity = getIntensity(count);
                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`${styles.cell} ${styles[`intensity${intensity}`]}`}
                    title={`${day} ${hour}:00 - ${count} activities`}
                  >
                    {count > 0 && <span className={styles.count}>{count}</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className={styles.legend}>
          <span>Less</span>
          <div className={styles.legendCells}>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div key={level} className={`${styles.legendCell} ${styles[`intensity${level}`]}`}></div>
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {data.peakHours && data.peakHours.length > 0 && (
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Peak Hours</h2>
          <div className={styles.peakHours}>
            {data.peakHours.map((item, index) => (
              <div key={index} className={styles.peakHour}>
                <div className={styles.peakHourLabel}>{item._id}:00</div>
                <div className={styles.peakHourBar}>
                  <div
                    className={styles.peakHourFill}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <div className={styles.peakHourCount}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

