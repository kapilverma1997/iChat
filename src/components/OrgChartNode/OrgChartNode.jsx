'use client';

import styles from './OrgChartNode.module.css';

export default function OrgChartNode({ node, type, children = [] }) {
  return (
    <div className={styles.node}>
      <div className={`${styles.card} ${styles[type]}`}>
        {type === 'department' ? (
          <>
            <div className={styles.name}>{node.name}</div>
            {node.description && (
              <div className={styles.description}>{node.description}</div>
            )}
            {node.managerId && (
              <div className={styles.manager}>Manager: {node.managerId?.name || 'N/A'}</div>
            )}
          </>
        ) : (
          <>
            <div className={styles.name}>{node.name || node.userId?.name}</div>
            <div className={styles.position}>{node.position || node.designation}</div>
            <div className={styles.email}>{node.userId?.email || node.email}</div>
          </>
        )}
      </div>
      {children.length > 0 && (
        <div className={styles.children}>
          {children.map((child) => (
            <OrgChartNode key={child._id} node={child} type="employee" />
          ))}
        </div>
      )}
    </div>
  );
}

