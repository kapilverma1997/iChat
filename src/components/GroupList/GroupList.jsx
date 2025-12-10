"use client";

import { useState, useEffect, useRef } from "react";
import GroupItem from "../GroupItem/GroupItem.jsx";
import CreateGroupModal from "../CreateGroupModal/CreateGroupModal.jsx";
import Button from "../Button/Button.jsx";
import styles from "./GroupList.module.css";

export default function GroupList({ onSelectGroup, selectedGroupId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'public', 'private', 'my-groups'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const isResizingRef = useRef(false);

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/groups/list?type=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setShowCreateModal(false);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    if (containerRef.current) {
      startWidthRef.current = containerRef.current.offsetWidth;
    }
  };

  const handleMouseMove = (e) => {
    if (!isResizingRef.current) return;
    
    const diff = startXRef.current - e.clientX;
    const newWidth = startWidthRef.current + diff;
    const minWidth = 60;
    const maxWidth = 500;
    
    if (containerRef.current) {
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      containerRef.current.style.width = `${clampedWidth}px`;
      
      // Auto-collapse if width is very small
      if (clampedWidth <= minWidth + 20) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    isResizingRef.current = false;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (containerRef.current) {
      if (!isCollapsed) {
        containerRef.current.style.width = "60px";
      } else {
        containerRef.current.style.width = "300px";
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isCollapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.header}>
        {!isCollapsed && <h2 className={styles.title}>Groups</h2>}
        {!isCollapsed && (
          <Button onClick={() => setShowCreateModal(true)} size="small">
            + New Group
          </Button>
        )}
        {isCollapsed && (
          <Button 
            size="small" 
            onClick={toggleCollapse}
            className={styles.expandButton}
            title="Expand sidebar"
          >
            →
          </Button>
        )}
      </div>
      {!isCollapsed && (
        <div className={styles.filters}>
        <button
          className={`${styles.filter} ${
            filter === "all" ? styles.active : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${styles.filter} ${
            filter === "public" ? styles.active : ""
          }`}
          onClick={() => setFilter("public")}
        >
          Public
        </button>
        <button
          className={`${styles.filter} ${
            filter === "private" ? styles.active : ""
          }`}
          onClick={() => setFilter("private")}
        >
          My Groups
        </button>
      </div>
      )}
      <div
        ref={resizeHandleRef}
        className={styles.resizeHandle}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className={styles.empty}>No groups found</div>
        ) : (
          groups.map((group) => (
            <GroupItem
              key={group._id}
              group={group}
              isActive={selectedGroupId === group._id}
              onClick={() => onSelectGroup(group)}
            />
          ))
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
