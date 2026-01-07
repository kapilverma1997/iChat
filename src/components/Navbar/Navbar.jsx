"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import Container from "../Container/Container.jsx";
import Button from "../Button/Button.jsx";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage and redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      router.push("/auth/login");
    }
  };

  const menuItems = [
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className={styles.navbar}>
      <Container>
        <div className={styles.navbarContent}>
          <Link href={isAuthenticated ? "/chats" : "/"} className={styles.logo}>
            <div className={styles.logoContainer}>
              <div className={styles.logoIconWrapper}>
                <svg
                  className={styles.logoIcon}
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="40" height="40" rx="10" fill="url(#gradient1)" />
                  <path
                    d="M12 20C12 18.8954 12.8954 18 14 18H18C19.1046 18 20 18.8954 20 20C20 21.1046 19.1046 22 18 22H14C12.8954 22 12 21.1046 12 20Z"
                    fill="white"
                  />
                  <path
                    d="M20 20C20 18.8954 20.8954 18 22 18H26C27.1046 18 28 18.8954 28 20C28 21.1046 27.1046 22 26 22H22C20.8954 22 20 21.1046 20 20Z"
                    fill="white"
                  />
                  <circle cx="16" cy="16" r="2" fill="white" opacity="0.8" />
                  <circle cx="24" cy="16" r="2" fill="white" opacity="0.8" />
                  <defs>
                    <linearGradient
                      id="gradient1"
                      x1="0"
                      y1="0"
                      x2="40"
                      y2="40"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#667eea" />
                      <stop offset="0.5" stopColor="#764ba2" />
                      <stop offset="1" stopColor="#f093fb" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className={styles.logoText}>iChat</span>
            </div>
          </Link>

          {!isAuthenticated && (
            <>
              <div
                className={`${styles.menu} ${
                  isMenuOpen ? styles.menuOpen : ""
                }`}
              >
                {/* {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))} */}
              </div>

              <div className={styles.actions}>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="small"
                    className={styles.loginButton}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    variant="primary"
                    size="small"
                    className={styles.signupButton}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && (
            <div className={styles.actions}>
              <Button
                variant="outline"
                size="small"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}

          {!isAuthenticated && (
            <button
              className={styles.mobileMenuButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span className={styles.hamburger}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
        </div>
      </Container>
    </nav>
  );
}
