"use client";

import React from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Container from "../../components/Container/Container.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./page.module.css";

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Introducing End-to-End Encryption",
      date: "December 15, 2024",
      excerpt: "Learn about our new end-to-end encryption feature that keeps your conversations private and secure.",
      category: "Security",
    },
    {
      id: 2,
      title: "New Collaboration Features",
      date: "December 10, 2024",
      excerpt: "Discover the latest collaboration tools including whiteboards, shared documents, and task management.",
      category: "Features",
    },
    {
      id: 3,
      title: "Best Practices for Team Communication",
      date: "December 5, 2024",
      excerpt: "Tips and tricks for effective team communication and collaboration using iChat.",
      category: "Tips",
    },
    {
      id: 4,
      title: "Privacy and Security Updates",
      date: "November 28, 2024",
      excerpt: "Stay informed about the latest privacy and security improvements to keep your data safe.",
      category: "Security",
    },
    {
      id: 5,
      title: "Getting Started with iChat",
      date: "November 20, 2024",
      excerpt: "A comprehensive guide for new users to help you get the most out of iChat.",
      category: "Guide",
    },
    {
      id: 6,
      title: "Mobile App Updates",
      date: "November 15, 2024",
      excerpt: "Check out the latest updates to our mobile applications with improved performance and new features.",
      category: "Updates",
    },
  ];

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <Container>
          <h1 className={styles.title}>iChat Blog</h1>
          <p className={styles.subtitle}>
            Stay updated with the latest news, features, and tips
          </p>
        </Container>
      </div>

      <Container>
        <div className={styles.content}>
          <div className={styles.postsGrid}>
            {blogPosts.map((post) => (
              <article key={post.id} className={styles.postCard}>
                <div className={styles.postCategory}>{post.category}</div>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <div className={styles.postDate}>{post.date}</div>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                <button className={styles.readMore}>Read More →</button>
              </article>
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}

