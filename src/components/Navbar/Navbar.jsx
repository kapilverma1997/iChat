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
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className={styles.logo}
          >
            <span className={styles.logoIcon}>💬</span>
            <span className={styles.logoText}>iChat</span>
          </Link>

          {!isAuthenticated && (
            <>
              <div
                className={`${styles.menu} ${
                  isMenuOpen ? styles.menuOpen : ""
                }`}
              >
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
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
