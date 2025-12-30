"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect to /chats
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Check if response has content before parsing
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await response.json();
              if (data.user) {
                router.push("/chats");
              }
            } catch (jsonError) {
              // If JSON parsing fails, just stay on landing page
              console.error("JSON parse error:", jsonError);
            }
          }
        }
      } catch (error) {
        // User not authenticated, stay on landing page
        // Silently handle errors - don't log to avoid console noise
      }
    };

    checkAuth();
  }, [router]);
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
      title: "Core Messaging",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      features: [
        {
          title: "Real-Time Chat",
          description:
            "Instant messaging with typing indicators and read receipts",
          icon: "💬",
          color: "#667eea",
        },
        {
          title: "Group Chats",
          description: "Create and manage groups with role-based permissions",
          icon: "👥",
          color: "#764ba2",
        },
        {
          title: "File Sharing",
          description: "Share documents, images, and videos with drag-and-drop",
          icon: "📎",
          color: "#f59e0b",
        },
        {
          title: "Message Search",
          description: "Powerful search to find any message quickly",
          icon: "🔍",
          color: "#10b981",
        },
      ],
    },
    {
      title: "Communication",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      features: [
        {
          title: "Video Calls",
          description: "HD video calls with screen sharing support",
          icon: "📹",
          color: "#ef4444",
        },
        {
          title: "Voice Messages",
          description: "Send and receive voice messages easily",
          icon: "🎤",
          color: "#8b5cf6",
        },
        {
          title: "Polls & Voting",
          description: "Create polls and gather team feedback",
          icon: "📊",
          color: "#06b6d4",
        },
        {
          title: "Threaded Replies",
          description: "Organize conversations with threaded discussions",
          icon: "💭",
          color: "#ec4899",
        },
      ],
    },
    {
      title: "Security & Privacy",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      features: [
        {
          title: "End-to-End Encryption",
          description: "Military-grade encryption for complete privacy",
          icon: "🔒",
          color: "#10b981",
        },
        {
          title: "Multi-Factor Auth",
          description: "Enhanced security with 2FA support",
          icon: "🛡️",
          color: "#3b82f6",
        },
        {
          title: "Admin Controls",
          description: "Comprehensive admin dashboard and user management",
          icon: "⚙️",
          color: "#6366f1",
        },
        {
          title: "Audit Logs",
          description: "Complete audit trail for compliance",
          icon: "📋",
          color: "#14b8a6",
        },
      ],
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals and small teams",
      features: [
        "Unlimited 1-on-1 chats",
        "Group chats up to 10 members",
        "File sharing (up to 100MB)",
        "Basic search",
        "Mobile & web apps",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Best for growing teams and businesses",
      features: [
        "Everything in Free",
        "Unlimited group members",
        "File sharing (up to 1GB)",
        "Advanced search & filters",
        "Video calls (up to 10 participants)",
        "Admin dashboard",
        "Priority support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with advanced needs",
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "Video calls (up to 50 participants)",
        "Advanced security & compliance",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      popular: false,
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
              <Button
                variant="primary"
                size="large"
                onClick={() => router.push("/auth/register")}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <Container>
          <SectionHeading
            title="Powerful Features"
            subtitle="Everything you need for seamless communication and collaboration"
          />

          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.featureCategory}>
              <div
                className={styles.categoryHeader}
                style={{ background: category.gradient }}
              >
                <h3 className={styles.categoryTitle}>{category.title}</h3>
              </div>
              <div className={styles.featureGrid}>
                {category.features.map((feature, featureIndex) => (
                  <FeatureCard
                    key={featureIndex}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    color={feature.color}
                  />
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <Container>
          <SectionHeading
            title="Simple, Transparent Pricing"
            subtitle="Choose the perfect plan for your needs"
          />

          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`${styles.pricingCard} ${
                  plan.popular ? styles.popular : ""
                }`}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>Most Popular</div>
                )}
                <div className={styles.pricingHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>{plan.price}</span>
                    {plan.period && (
                      <span className={styles.period}>/{plan.period}</span>
                    )}
                  </div>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={styles.featureItem}>
                      <span className={styles.checkIcon}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "primary" : "outline"}
                  size="large"
                  className={styles.pricingButton}
                  onClick={() => {
                    if (plan.cta === "Contact Sales") {
                      // Set category to sales and scroll to contact form
                      setFormData((prev) => ({ ...prev, category: "sales" }));
                      setTimeout(() => {
                        document.getElementById("contact")?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }, 100);
                    } else if (plan.cta === "Start Free Trial") {
                      // Redirect to registration for free trial
                      router.push("/auth/register");
                    } else if (plan.cta === "Get Started") {
                      // Redirect to registration
                      router.push("/auth/register");
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

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
