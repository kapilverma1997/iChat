"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Container from "../../components/Container/Container.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./page.module.css";

export default function StatusPage() {
  const [services, setServices] = useState([
    { name: "API", status: "operational", uptime: "99.9%" },
    { name: "Messaging", status: "operational", uptime: "99.8%" },
    { name: "File Storage", status: "operational", uptime: "99.7%" },
    { name: "Authentication", status: "operational", uptime: "99.9%" },
    { name: "Real-time Sync", status: "operational", uptime: "99.6%" },
    { name: "Notifications", status: "operational", uptime: "99.8%" },
  ]);

  const [incidents, setIncidents] = useState([
    {
      id: 1,
      title: "Scheduled Maintenance",
      date: "December 20, 2024",
      status: "resolved",
      description: "Completed scheduled maintenance window. All services are operational.",
    },
    {
      id: 2,
      title: "API Performance Improvement",
      date: "December 15, 2024",
      status: "resolved",
      description: "Optimized API response times. Performance improvements are now live.",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "#10b981";
      case "degraded":
        return "#f59e0b";
      case "down":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return "✓";
      case "degraded":
        return "⚠";
      case "down":
        return "✗";
      default:
        return "?";
    }
  };

  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "down")
    ? "down"
    : "degraded";

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <Container>
          <h1 className={styles.title}>System Status</h1>
          <p className={styles.subtitle}>
            Real-time status of all iChat services
          </p>
        </Container>
      </div>

      <Container>
        <div className={styles.content}>
          <div className={styles.statusOverview}>
            <div className={styles.overallStatus}>
              <div
                className={styles.statusIndicator}
                style={{ backgroundColor: getStatusColor(overallStatus) }}
              >
                {getStatusIcon(overallStatus)}
              </div>
              <div className={styles.statusInfo}>
                <h2 className={styles.statusTitle}>
                  All Systems {overallStatus === "operational" ? "Operational" : "Experiencing Issues"}
                </h2>
                <p className={styles.statusText}>
                  {overallStatus === "operational"
                    ? "All services are running smoothly."
                    : "Some services may be experiencing issues."}
                </p>
              </div>
            </div>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Service Status</h2>
            <div className={styles.servicesList}>
              {services.map((service, index) => (
                <div key={index} className={styles.serviceItem}>
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <div className={styles.serviceDetails}>
                      <span
                        className={styles.serviceStatus}
                        style={{ color: getStatusColor(service.status) }}
                      >
                        {getStatusIcon(service.status)} {service.status}
                      </span>
                      <span className={styles.serviceUptime}>
                        Uptime: {service.uptime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Incidents</h2>
            {incidents.length > 0 ? (
              <div className={styles.incidentsList}>
                {incidents.map((incident) => (
                  <div key={incident.id} className={styles.incidentItem}>
                    <div className={styles.incidentHeader}>
                      <h3 className={styles.incidentTitle}>{incident.title}</h3>
                      <span
                        className={styles.incidentStatus}
                        style={{ color: getStatusColor(incident.status) }}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <div className={styles.incidentDate}>{incident.date}</div>
                    <p className={styles.incidentDescription}>
                      {incident.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noIncidents}>No recent incidents.</p>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Subscribe to Updates</h2>
            <p className={styles.subscribeText}>
              Get notified about service status updates and incidents via email.
            </p>
            <div className={styles.subscribeBox}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.subscribeInput}
              />
              <button className={styles.subscribeButton}>Subscribe</button>
            </div>
          </section>
        </div>
      </Container>
      <Footer />
    </div>
  );
}

