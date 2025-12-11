'use client';

import styles from './ActivityHeatmap.module.css';

export default function ActivityHeatmap({ data = [] }) {
  // Create a map for quick lookup
  const dataMap = {};
  data.forEach((item) => {
    dataMap[item._id] = item.count;
  });

  // Get last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: dataMap[dateStr] || 0,
    });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const getIntensity = (count) => {
    if (count === 0) return 0;
    const percentage = (count / maxCount) * 100;
    if (percentage < 25) return 1;
    if (percentage < 50) return 2;
    if (percentage < 75) return 3;
    return 4;
  };

  return (
    <div className={styles.heatmap}>
      <div className={styles.days}>
        {days.map((day, index) => {
          const intensity = getIntensity(day.count);
          return (
            <div key={index} className={styles.day}>
              <div
                className={`${styles.cell} ${styles[`intensity${intensity}`]}`}
                title={`${day.date}: ${day.count} logins`}
              >
                {day.count > 0 && <span className={styles.count}>{day.count}</span>}
              </div>
              <div className={styles.dateLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span>Less</span>
        <div className={styles.legendCells}>
          <div className={`${styles.legendCell} ${styles.intensity0}`}></div>
          <div className={`${styles.legendCell} ${styles.intensity1}`}></div>
          <div className={`${styles.legendCell} ${styles.intensity2}`}></div>
          <div className={`${styles.legendCell} ${styles.intensity3}`}></div>
          <div className={`${styles.legendCell} ${styles.intensity4}`}></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

