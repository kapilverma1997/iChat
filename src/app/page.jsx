"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import Navbar from "../components/Navbar/Navbar.jsx";
import Container from "../components/Container/Container.jsx";
import Button from "../components/Button/Button.jsx";
import InputBox from "../components/InputBox/InputBox.jsx";
import Dropdown from "../components/Dropdown/Dropdown.jsx";
import FeatureCard from "../components/FeatureCard/FeatureCard.jsx";
import SectionHeading from "../components/SectionHeading/SectionHeading.jsx";
import Footer from "../components/Footer/Footer.jsx";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "", category: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureCategories = [
    {
      title: "User & Profile Features",
      features: [
        {
          title: "Registration & Login",
          description:
            "Secure user authentication with email verification and social login options",
        },
        {
          title: "Multi-Factor Authentication",
          description:
            "Enhanced security with 2FA and biometric authentication support",
        },
        {
          title: "Profile Management",
          description:
            "Customizable profiles with avatars, status messages, and presence indicators",
        },
        {
          title: "Themes & Customization",
          description:
            "Dark mode, light mode, and custom color themes for personalized experience",
        },
        {
          title: "Multi-Language Support",
          description:
            "Localized interface supporting 50+ languages for global users",
        },
      ],
    },
    {
      title: "1:1 Chat Features",
      features: [
        {
          title: "Real-Time Messaging",
          description:
            "Instant message delivery with typing indicators and read receipts",
        },
        {
          title: "Message Reactions",
          description:
            "Express yourself with emoji reactions, pins, and starred messages",
        },
        {
          title: "Message Templates",
          description:
            "Save and reuse frequently sent messages for quick communication",
        },
        {
          title: "Mute & Do Not Disturb",
          description:
            "Control notifications and focus on what matters with smart mute options",
        },
        {
          title: "Message Search",
          description:
            "Powerful search to find any message by keyword, date, or sender",
        },
      ],
    },
    {
      title: "Group Chat Features",
      features: [
        {
          title: "Create & Manage Groups",
          description:
            "Create groups with custom names, descriptions, and avatars",
        },
        {
          title: "Role-Based Permissions",
          description:
            "Admin, moderator, and member roles with granular permission controls",
        },
        {
          title: "Threaded Messages",
          description:
            "Organize conversations with threaded replies and nested discussions",
        },
        {
          title: "Polls & Voting",
          description:
            "Create polls and gather team feedback directly in group chats",
        },
        {
          title: "Shared Media Library",
          description:
            "Centralized media gallery for all shared files and images",
        },
      ],
    },
    {
      title: "Chat Message Types",
      features: [
        {
          title: "Rich Text Formatting",
          description:
            "Markdown support with bold, italic, code blocks, and more",
        },
        {
          title: "GIFs & Stickers",
          description:
            "Express yourself with animated GIFs and custom sticker packs",
        },
        {
          title: "File Sharing",
          description:
            "Share documents, images, videos with drag-and-drop support",
        },
        {
          title: "Location Sharing",
          description: "Share your location in real-time with interactive maps",
        },
        {
          title: "Screen Sharing",
          description:
            "Share your screen during video calls for seamless collaboration",
        },
      ],
    },
    {
      title: "Advanced Messaging",
      features: [
        {
          title: "Edit & Delete Messages",
          description:
            "Edit sent messages and delete with time-based restrictions",
        },
        {
          title: "Forward Messages",
          description:
            "Forward messages to other chats with context preservation",
        },
        {
          title: "Scheduled Messages",
          description: "Schedule messages to be sent at specific times",
        },
        {
          title: "Message Reminders",
          description: "Set reminders for important messages and follow-ups",
        },
        {
          title: "Multi-Select & Bulk Actions",
          description: "Select multiple messages for bulk operations",
        },
        {
          title: "Translation",
          description:
            "Translate messages in real-time to your preferred language",
        },
      ],
    },
    {
      title: "File & Media Management",
      features: [
        {
          title: "Cloud Storage Integration",
          description: "Connect with Google Drive, Dropbox, and OneDrive",
        },
        {
          title: "Media Preview",
          description:
            "Preview images, videos, and documents without leaving the chat",
        },
        {
          title: "Automatic Compression",
          description: "Smart compression to save bandwidth and storage",
        },
        {
          title: "Expiration Settings",
          description: "Set expiration dates for sensitive files and media",
        },
        {
          title: "Drag & Drop Upload",
          description: "Intuitive drag-and-drop interface for file uploads",
        },
      ],
    },
    {
      title: "Audio/Video Calling",
      features: [
        {
          title: "Group Video Calls",
          description: "HD video calls with up to 50 participants",
        },
        {
          title: "Screen Sharing",
          description: "Share your screen during calls with annotation tools",
        },
        {
          title: "Call Recording",
          description: "Record calls with automatic transcription and storage",
        },
        {
          title: "Virtual Backgrounds",
          description:
            "Custom backgrounds and blur effects for professional calls",
        },
        {
          title: "Live Captions",
          description: "Real-time captions and transcription during calls",
        },
      ],
    },
    {
      title: "Security & Privacy",
      features: [
        {
          title: "End-to-End Encryption",
          description: "Military-grade encryption ensuring complete privacy",
        },
        {
          title: "Message Retention Policies",
          description: "Configurable retention policies for compliance",
        },
        {
          title: "Screenshot Blocking",
          description: "Prevent screenshots in sensitive conversations",
        },
        {
          title: "Role-Based Access Control",
          description: "Granular permissions for teams and organizations",
        },
        {
          title: "Audit Logs",
          description: "Comprehensive audit logs for security and compliance",
        },
      ],
    },
    {
      title: "Notifications",
      features: [
        {
          title: "Push Notifications",
          description: "Real-time push notifications across all devices",
        },
        {
          title: "Email Notifications",
          description: "Email digests and important message alerts",
        },
        {
          title: "Notification Categories",
          description: "Customize notification settings per chat and category",
        },
        {
          title: "Snooze & Quiet Hours",
          description: "Set quiet hours and snooze notifications",
        },
        {
          title: "Custom Sounds",
          description: "Personalize notification sounds for different contacts",
        },
      ],
    },
    {
      title: "Search Features",
      features: [
        {
          title: "Keyword Search",
          description: "Search across all messages with advanced filters",
        },
        {
          title: "Filter by Sender",
          description: "Find messages from specific contacts or groups",
        },
        {
          title: "Date Range Filters",
          description: "Search within specific date ranges",
        },
        {
          title: "Saved Searches",
          description: "Save frequently used search queries for quick access",
        },
        {
          title: "Media Search",
          description: "Search for images, videos, and files separately",
        },
      ],
    },
    {
      title: "Admin & Organization Features",
      features: [
        {
          title: "Admin Dashboard",
          description: "Comprehensive dashboard with analytics and insights",
        },
        {
          title: "User Management",
          description: "Manage users, roles, and permissions from one place",
        },
        {
          title: "Analytics & Reports",
          description:
            "Usage statistics, engagement metrics, and custom reports",
        },
        {
          title: "Broadcast Messages",
          description: "Send announcements to all team members",
        },
        {
          title: "Device Management",
          description: "Control and manage connected devices remotely",
        },
      ],
    },
    {
      title: "Automation & Bots",
      features: [
        {
          title: "AI Reply Suggestions",
          description: "Smart reply suggestions powered by AI",
        },
        {
          title: "Message Transcription",
          description: "Automatic transcription of voice messages",
        },
        {
          title: "Auto-Moderation",
          description: "AI-powered content moderation and filtering",
        },
        {
          title: "Scheduled Messages",
          description: "Automate message scheduling and reminders",
        },
        {
          title: "Bot Integration",
          description: "Integrate with popular bots and services",
        },
      ],
    },
    {
      title: "Collaboration Features",
      features: [
        {
          title: "Shared Notes",
          description: "Collaborative note-taking within chats",
        },
        {
          title: "Task Management",
          description: "Create and assign tasks directly in conversations",
        },
        {
          title: "Whiteboard",
          description: "Interactive whiteboard for brainstorming sessions",
        },
        {
          title: "Calendar Integration",
          description: "Sync with Google Calendar, Outlook, and more",
        },
        {
          title: "Meeting Scheduler",
          description: "Schedule meetings and send invites from chat",
        },
      ],
    },
    {
      title: "Localization & Customization",
      features: [
        {
          title: "Custom Themes",
          description: "Create and share custom themes with your team",
        },
        {
          title: "Branding Options",
          description:
            "Customize logos, colors, and branding for your organization",
        },
        {
          title: "Emoji Customization",
          description: "Add custom emoji packs and reactions",
        },
        {
          title: "Multi-Language UI",
          description: "Interface available in 50+ languages",
        },
        {
          title: "Regional Settings",
          description: "Date formats, time zones, and regional preferences",
        },
      ],
    },
    {
      title: "Data & Analytics",
      features: [
        {
          title: "Usage Statistics",
          description: "Track your messaging activity and engagement",
        },
        {
          title: "Data Export",
          description: "Export your messages and data in multiple formats",
        },
        {
          title: "Engagement Heatmap",
          description: "Visualize your most active times and contacts",
        },
        {
          title: "Performance Metrics",
          description: "Monitor app performance and response times",
        },
        {
          title: "Custom Reports",
          description: "Generate custom reports for teams and individuals",
        },
      ],
    },
    {
      title: "Device Support",
      features: [
        {
          title: "Web Application",
          description: "Full-featured web app accessible from any browser",
        },
        {
          title: "Android App",
          description: "Native Android app with all features",
        },
        {
          title: "iOS App",
          description: "Native iOS app optimized for iPhone and iPad",
        },
        {
          title: "Desktop Apps",
          description: "Windows, macOS, and Linux desktop applications",
        },
        {
          title: "Tablet Support",
          description: "Optimized experience for tablets and large screens",
        },
      ],
    },
    {
      title: "Performance Features",
      features: [
        {
          title: "Smart Caching",
          description: "Intelligent caching for faster load times",
        },
        {
          title: "Offline Mode",
          description: "Read and compose messages even when offline",
        },
        {
          title: "Lazy Loading",
          description:
            "Load messages and media on-demand for better performance",
        },
        {
          title: "Data Compression",
          description: "Automatic compression to reduce bandwidth usage",
        },
        {
          title: "Background Sync",
          description:
            "Sync messages in the background for seamless experience",
        },
      ],
    },
  ];

  const contactCategories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "sales", label: "Sales" },
    { value: "partnership", label: "Partnership" },
  ];

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <Container>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              The Most Advanced
              <span className={styles.gradientText}> Chat Application</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Connect, collaborate, and communicate seamlessly with teams and
              individuals. Experience real-time messaging, video calls, and
              powerful collaboration tools all in one place.
            </p>
            <div className={styles.heroActions}>
              <Button variant="primary" size="large">
                Get Started Free
              </Button>
              <Button variant="outline" size="large">
                Watch Demo
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      {/* <section id="features" className={styles.features}>
        <Container>
          <SectionHeading
            title="Everything You Need to Chat"
            subtitle="Discover hundreds of features designed to make communication effortless and productive"
          />

          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.featureCategory}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <div className={styles.featureGrid}>
                {category.features.map((feature, featureIndex) => (
                  <FeatureCard
                    key={featureIndex}
                    title={feature.title}
                    description={feature.description}
                    icon={<span className={styles.featureIcon}>✨</span>}
                  />
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section> */}

      {/* Contact Section */}
      <section id="contact" className={styles.contact}>
        <Container>
          <SectionHeading
            title="Get in Touch"
            subtitle="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
          />

          <div className={styles.contactContent}>
            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Name
                  </label>
                  <InputBox
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <InputBox
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category" className={styles.label}>
                  Category
                </label>
                <Dropdown
                  id="category"
                  options={contactCategories}
                  value={formData.category}
                  onChange={handleDropdownChange}
                  placeholder="Select a category"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>
                  Message
                </label>
                <InputBox
                  id="message"
                  name="message"
                  multiline
                  rows={6}
                  placeholder="Your message..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {submitStatus === "success" && (
                <div className={styles.successMessage}>
                  ✓ Thank you! Your message has been sent successfully.
                </div>
              )}

              {submitStatus === "error" && (
                <div className={styles.errorMessage}>
                  ✗ Something went wrong. Please try again.
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
