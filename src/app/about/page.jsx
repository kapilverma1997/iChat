"use client";

import React from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Container from "../../components/Container/Container.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <Container>
          <h1 className={styles.title}>About iChat</h1>
          <p className={styles.subtitle}>
            Building the future of team communication
          </p>
        </Container>
      </div>

      <Container>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Mission</h2>
            <p className={styles.text}>
              At iChat, we believe that great communication is the foundation of 
              successful teams. Our mission is to provide a secure, intuitive, and 
              powerful messaging platform that brings people together and enables 
              seamless collaboration.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What We Do</h2>
            <p className={styles.text}>
              iChat is a comprehensive communication platform designed for teams and 
              individuals. We offer real-time messaging, group chats, file sharing, 
              collaboration tools, and much more. Our platform is built with security 
              and privacy at its core, ensuring your conversations remain private 
              and protected.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <div className={styles.values}>
              <div className={styles.valueItem}>
                <h3 className={styles.valueTitle}>🔒 Security First</h3>
                <p className={styles.valueText}>
                  We prioritize the security and privacy of our users' data above all else.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h3 className={styles.valueTitle}>💡 Innovation</h3>
                <p className={styles.valueText}>
                  We continuously innovate to provide the best communication experience.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h3 className={styles.valueTitle}>👥 User-Centric</h3>
                <p className={styles.valueText}>
                  Our users are at the heart of everything we do. We listen and adapt.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h3 className={styles.valueTitle}>🌍 Accessibility</h3>
                <p className={styles.valueText}>
                  We believe communication tools should be accessible to everyone, everywhere.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Our Team</h2>
            <p className={styles.text}>
              iChat is built by a passionate team of developers, designers, and 
              security experts who are dedicated to creating the best communication 
              platform possible. We're constantly working to improve our platform 
              and add new features based on user feedback.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact Us</h2>
            <p className={styles.text}>
              Have questions or feedback? We'd love to hear from you! Reach out to 
              us through our support channels or visit our Help Center for more information.
            </p>
          </section>
        </div>
      </Container>
      <Footer />
    </div>
  );
}

