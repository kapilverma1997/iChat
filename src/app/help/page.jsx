"use client";

import React, { useState } from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Container from "../../components/Container/Container.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./page.module.css";

export default function HelpPage() {
  const [openCategory, setOpenCategory] = useState(null);

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🚀",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on the 'Sign Up' button on the homepage, fill in your details, and verify your email address to get started.",
        },
        {
          q: "How do I start a chat?",
          a: "Go to the Chats section, click the '+' button, search for a user, and start messaging.",
        },
        {
          q: "How do I create a group?",
          a: "Navigate to Groups, click 'Create Group', add members, and customize your group settings.",
        },
      ],
    },
    {
      id: "features",
      title: "Features",
      icon: "✨",
      questions: [
        {
          q: "What is end-to-end encryption?",
          a: "End-to-end encryption ensures that only you and the recipient can read messages. Even iChat cannot access your encrypted conversations.",
        },
        {
          q: "How do I share files?",
          a: "Click the attachment icon in the message input, select your file, and send it. Files are securely stored and accessible to recipients.",
        },
        {
          q: "Can I schedule messages?",
          a: "Yes! Use the schedule feature to send messages at a specific date and time.",
        },
      ],
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: "🔒",
      questions: [
        {
          q: "How do I enable two-factor authentication?",
          a: "Go to Settings > Privacy & Security, and follow the setup instructions for 2FA using a TOTP app.",
        },
        {
          q: "How do I lock a chat?",
          a: "Open the chat, click the menu, and select 'Lock Chat'. You can use password or biometric authentication.",
        },
        {
          q: "How do I manage my devices?",
          a: "Visit Settings > Privacy & Security > Device Management to view and manage all connected devices.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: "🔧",
      questions: [
        {
          q: "Messages not sending?",
          a: "Check your internet connection, ensure you're not blocked, and try refreshing the page. If issues persist, contact support.",
        },
        {
          q: "Can't see my messages?",
          a: "Try clearing your browser cache, check if you're logged in, and ensure you have the correct permissions.",
        },
        {
          q: "File upload failed?",
          a: "Check file size limits (usually 100MB), ensure the file type is supported, and verify your internet connection.",
        },
      ],
    },
  ];

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <Container>
          <h1 className={styles.title}>Help Center</h1>
          <p className={styles.subtitle}>
            Find answers to common questions and get the help you need
          </p>
        </Container>
      </div>

      <Container>
        <div className={styles.content}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search for help..."
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>Search</button>
          </div>

          <div className={styles.categories}>
            {faqCategories.map((category) => (
              <div key={category.id} className={styles.category}>
                <button
                  className={styles.categoryHeader}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span className={styles.categoryTitle}>{category.title}</span>
                  <span className={styles.toggleIcon}>
                    {openCategory === category.id ? "−" : "+"}
                  </span>
                </button>
                {openCategory === category.id && (
                  <div className={styles.questions}>
                    {category.questions.map((faq, index) => (
                      <div key={index} className={styles.faqItem}>
                        <h3 className={styles.question}>{faq.q}</h3>
                        <p className={styles.answer}>{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.contactSection}>
            <h2 className={styles.contactTitle}>Still need help?</h2>
            <p className={styles.contactText}>
              Can't find what you're looking for? Contact our support team and 
              we'll be happy to assist you.
            </p>
            <button className={styles.contactButton}>Contact Support</button>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}

