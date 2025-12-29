'use client';

import styles from './OrgChartNode.module.css';

export default function OrgChartNode({ node, type, members = [] }) {
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
              <div className={styles.manager}>
                Manager: {node.managerId?.name || 'N/A'}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.name}>
              {node.userId?.name || node.name || 'Unknown'}
            </div>
            <div className={styles.position}>
              {node.position || node.userId?.designation || 'Employee'}
            </div>
            <div className={styles.email}>
              {node.userId?.email || node.email || ''}
            </div>
          </>
        )}
      </div>
      {members.length > 0 && (
        <div className={styles.children}>
          {members.map((member) => (
            <OrgChartNode key={member._id || member.userId?._id} node={member} type="employee" />
          ))}
        </div>
      )}
    </div>
  );
}

