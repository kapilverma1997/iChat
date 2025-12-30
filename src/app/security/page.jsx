"use client";

import React from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Container from "../../components/Container/Container.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./page.module.css";

export default function SecurityPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <Container>
          <h1 className={styles.title}>Security & Privacy</h1>
          <p className={styles.subtitle}>
            Your data security and privacy are our top priorities
          </p>
        </Container>
      </div>

      <Container>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔒 End-to-End Encryption</h2>
            <p className={styles.text}>
              All messages in iChat are protected with end-to-end encryption (E2EE), 
              ensuring that only you and the intended recipient can read your messages. 
              Even we cannot access your encrypted conversations.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🛡️ Two-Factor Authentication</h2>
            <p className={styles.text}>
              Protect your account with two-factor authentication (2FA) using TOTP 
              (Time-based One-Time Password). Add an extra layer of security to 
              prevent unauthorized access to your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔐 Secure Data Storage</h2>
            <p className={styles.text}>
              All data is stored securely using industry-standard encryption at rest. 
              Our servers are regularly audited and comply with the latest security 
              standards to keep your information safe.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔑 Chat Lock Feature</h2>
            <p className={styles.text}>
              Lock sensitive conversations with password or biometric authentication. 
              Your locked chats remain encrypted and require authentication to access, 
              even if someone gains access to your device.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📱 Device Management</h2>
            <p className={styles.text}>
              Monitor and manage all devices connected to your account. View active 
              sessions, device information, and remotely sign out from any device 
              if you suspect unauthorized access.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔍 Privacy Controls</h2>
            <p className={styles.text}>
              Control who can see your online status, profile information, and contact 
              you. Customize your privacy settings to match your comfort level and 
              maintain your digital privacy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Compliance & Certifications</h2>
            <p className={styles.text}>
              iChat is designed with compliance in mind. We follow best practices for 
              data protection and are committed to maintaining the highest standards 
              of security and privacy for our users.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🚨 Security Monitoring</h2>
            <p className={styles.text}>
              Our security team continuously monitors for suspicious activities and 
              potential threats. You'll receive alerts if we detect any unusual login 
              attempts or security concerns with your account.
            </p>
          </section>
        </div>
      </Container>
      <Footer />
    </div>
  );
}

