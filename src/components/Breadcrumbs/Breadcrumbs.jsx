"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs({ items }) {
  const pathname = usePathname();
  const lang = getCurrentLanguage();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname, lang);

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.href || index} className={styles.item}>
              {isLast ? (
                <span className={styles.current} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className={styles.link}>
                    {crumb.label}
                  </Link>
                  <span className={styles.separator}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname, lang) {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: getTranslation(lang, "home"), href: "/chats" }];

  let currentPath = "";
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const label =
      getTranslation(lang, path) ||
      path.charAt(0).toUpperCase() + path.slice(1);
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}
