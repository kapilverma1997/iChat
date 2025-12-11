'use client';

import OrgChartNode from '../OrgChartNode/OrgChartNode.jsx';
import styles from './OrgChartTree.module.css';

export default function OrgChartTree({ departments = [], employees = [] }) {
  // Build tree structure from departments and employees
  const buildTree = () => {
    // This is a simplified version - you'll need to build the actual tree structure
    // based on parentDepartmentId relationships
    
    if (departments.length === 0 && employees.length === 0) {
      return (
        <div className={styles.empty}>
          <p>No organization data available.</p>
          <p>Create departments and assign employees to build the org chart.</p>
        </div>
      );
    }

    // For now, return a simple structure
    return (
      <div className={styles.tree}>
        {departments.map((dept) => (
          <OrgChartNode
            key={dept._id}
            node={dept}
            type="department"
            children={employees.filter((emp) => emp.departmentId === dept._id)}
          />
        ))}
      </div>
    );
  };

  return <div className={styles.container}>{buildTree()}</div>;
}

