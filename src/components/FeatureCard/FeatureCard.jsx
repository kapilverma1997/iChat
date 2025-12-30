import React from "react";
import styles from "./FeatureCard.module.css";

export default function FeatureCard({
  title,
  description,
  icon,
  color,
  className = "",
}) {
  return (
    <div className={`${styles.card} ${className}`}>
      {icon && (
        <div 
          className={styles.iconWrapper}
          style={{ 
            background: color ? `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)` : undefined,
            borderColor: color ? `${color}30` : undefined
          }}
        >
          <span 
            className={styles.icon}
            style={{ color: color || undefined }}
          >
            {icon}
          </span>
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
