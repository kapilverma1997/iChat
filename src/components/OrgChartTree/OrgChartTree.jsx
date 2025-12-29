"use client";

import OrgChartNode from "../OrgChartNode/OrgChartNode.jsx";
import styles from "./OrgChartTree.module.css";

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

    // Build tree structure - group employees by department
    const employeesByDept = {};
    employees.forEach((emp) => {
      const deptId =
        emp.departmentId?._id?.toString() || emp.departmentId?.toString();
      if (deptId) {
        if (!employeesByDept[deptId]) {
          employeesByDept[deptId] = [];
        }
        employeesByDept[deptId].push(emp);
      }
    });

    // Filter root departments (no parent) and build hierarchy
    // Handle both populated (object) and unpopulated (ObjectId) parentDepartmentId
    const rootDepartments = departments.filter((dept) => {
      if (!dept.parentDepartmentId) return true;
      // If populated, it's an object with _id; if not populated, it's just an ObjectId
      return (
        typeof dept.parentDepartmentId === "object" &&
        !dept.parentDepartmentId._id
      );
    });

    return (
      <div className={styles.tree}>
        {rootDepartments.length > 0
          ? rootDepartments.map((dept) => {
              const deptId = dept._id.toString();
              const deptEmployees = employeesByDept[deptId] || [];
              return (
                <OrgChartNode
                  key={dept._id}
                  node={dept}
                  type="department"
                  members={deptEmployees}
                />
              );
            })
          : // If no root departments, show all departments
            departments.map((dept) => {
              const deptId = dept._id.toString();
              const deptEmployees = employeesByDept[deptId] || [];
              return (
                <OrgChartNode
                  key={dept._id}
                  node={dept}
                  type="department"
                  members={deptEmployees}
                />
              );
            })}
      </div>
    );
  };

  return <div className={styles.container}>{buildTree()}</div>;
}
