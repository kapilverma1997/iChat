"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./SharedTodoList.module.css";

export default function SharedTodoList({ chatId, groupId, currentUserId }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed, assigned-to-me
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: "", description: "", dueDate: "", priority: "medium" });
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchTodos();
  }, [chatId, groupId, filter]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleTodoUpdate = (data) => {
      if (data.action === "created" || data.action === "updated") {
        fetchTodos();
      } else if (data.action === "deleted") {
        setTodos((prev) => prev.filter((t) => t._id !== data.todoId));
      }
    };

    socket.on("todo:update", handleTodoUpdate);

    return () => {
      socket.off("todo:update", handleTodoUpdate);
    };
  }, [socket, connected]);

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (chatId) params.append("chatId", chatId);
      if (groupId) params.append("groupId", groupId);
      if (filter !== "all") params.append("filter", filter);

      const response = await fetch(`/api/collaboration/todo/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/collaboration/todo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTodo,
          chatId: chatId || null,
          groupId: groupId || null,
        }),
      });

      if (response.ok) {
        setNewTodo({ title: "", description: "", dueDate: "", priority: "medium" });
        setShowCreateForm(false);
        fetchTodos();
      }
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const handleToggleStatus = async (todo) => {
    try {
      const token = localStorage.getItem("accessToken");
      const newStatus = todo.status === "completed" ? "pending" : "completed";
      await fetch(`/api/collaboration/todo/${todo._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTodos();
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={styles.todoList}>
      <div className={styles.header}>
        <h3>Shared Tasks</h3>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className={styles.addButton}>
          + Add Task
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateTodo} className={styles.createForm}>
          <input
            type="text"
            placeholder="Task title"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            required
            className={styles.input}
          />
          <textarea
            placeholder="Description (optional)"
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
            className={styles.textarea}
          />
          <div className={styles.formRow}>
            <input
              type="datetime-local"
              value={newTodo.dueDate}
              onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
              className={styles.input}
            />
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>Create</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.filters}>
        <button
          className={filter === "all" ? styles.activeFilter : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "pending" ? styles.activeFilter : ""}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          className={filter === "completed" ? styles.activeFilter : ""}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <button
          className={filter === "assigned-to-me" ? styles.activeFilter : ""}
          onClick={() => setFilter("assigned-to-me")}
        >
          Assigned to Me
        </button>
      </div>

      <div className={styles.todos}>
        {todos.length === 0 ? (
          <div className={styles.empty}>No tasks yet</div>
        ) : (
          todos.map((todo) => (
            <div key={todo._id} className={`${styles.todoItem} ${styles[todo.status]}`}>
              <div className={styles.todoContent}>
                <input
                  type="checkbox"
                  checked={todo.status === "completed"}
                  onChange={() => handleToggleStatus(todo)}
                  className={styles.checkbox}
                />
                <div className={styles.todoInfo}>
                  <h4 className={styles.todoTitle}>{todo.title}</h4>
                  {todo.description && <p className={styles.todoDescription}>{todo.description}</p>}
                  <div className={styles.todoMeta}>
                    {todo.assignedTo && (
                      <span className={styles.assigned}>
                        Assigned to: {todo.assignedTo.name}
                      </span>
                    )}
                    {todo.dueDate && (
                      <span className={styles.dueDate}>
                        Due: {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`${styles.priority} ${styles[todo.priority]}`}>
                      {todo.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

