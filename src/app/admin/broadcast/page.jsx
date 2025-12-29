'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import Button from '../../../components/Button/Button.jsx';
import InputBox from '../../../components/InputBox/InputBox.jsx';
import styles from './page.module.css';

export default function BroadcastPage() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    logo: '',
    subscribers: [],
    settings: {
      allowComments: false,
      requireApproval: false,
    },
  });

  const [messageForm, setMessageForm] = useState({
    content: '',
    priority: 'normal',
  });

  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelDetails(selectedChannel._id);
    }
  }, [selectedChannel]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/users?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/broadcast', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelDetails = async (channelId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/broadcast?channelId=${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching channel details:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(channelForm),
      });

      if (response.ok) {
        const data = await response.json();
        setChannels([data.channel, ...channels]);
        setShowCreateModal(false);
        setChannelForm({
          name: '',
          description: '',
          logo: '',
          subscribers: [],
          settings: {
            allowComments: false,
            requireApproval: false,
          },
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create channel');
      }
    } catch (error) {
      setError('Failed to create channel');
      console.error('Error creating channel:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChannel) return;

    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/broadcast', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: selectedChannel._id,
          content: messageForm.content,
          priority: messageForm.priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([data.broadcastMessage, ...messages]);
        setShowMessageModal(false);
        setMessageForm({
          content: '',
          priority: 'normal',
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const toggleSubscriber = (userId) => {
    const isSubscribed = channelForm.subscribers.some(
      (sub) => (typeof sub === 'string' ? sub : sub.userId) === userId
    );
    if (isSubscribed) {
      setChannelForm({
        ...channelForm,
        subscribers: channelForm.subscribers.filter(
          (sub) => (typeof sub === 'string' ? sub : sub.userId) !== userId
        ),
      });
    } else {
      setChannelForm({
        ...channelForm,
        subscribers: [
          ...channelForm.subscribers,
          { userId },
        ],
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Broadcast Channels</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create Channel
          </Button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading channels...</div>
        ) : (
          <div className={styles.container}>
            <div className={styles.channelsList}>
              <h2 className={styles.sectionTitle}>Channels</h2>
              {channels.length === 0 ? (
                <div className={styles.empty}>No channels found</div>
              ) : (
                <div className={styles.channels}>
                  {channels.map((channel) => (
                    <div
                      key={channel._id}
                      className={`${styles.channelCard} ${
                        selectedChannel?._id === channel._id
                          ? styles.selected
                          : ''
                      }`}
                      onClick={() => setSelectedChannel(channel)}
                    >
                      <div className={styles.channelHeader}>
                        {channel.logo && (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className={styles.channelLogo}
                          />
                        )}
                        <div className={styles.channelInfo}>
                          <h3 className={styles.channelName}>{channel.name}</h3>
                          {channel.description && (
                            <p className={styles.channelDescription}>
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={styles.channelMeta}>
                        <span>
                          {channel.subscribers?.length || 0} subscribers
                        </span>
                        <span className={styles.channelDate}>
                          {formatDate(channel.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.channelDetails}>
              {selectedChannel ? (
                <>
                  <div className={styles.detailsHeader}>
                    <div>
                      <h2 className={styles.detailsTitle}>
                        {selectedChannel.name}
                      </h2>
                      {selectedChannel.description && (
                        <p className={styles.detailsDescription}>
                          {selectedChannel.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowMessageModal(true)}
                      variant="primary"
                    >
                      Send Message
                    </Button>
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Subscribers</span>
                      <span className={styles.statValue}>
                        {selectedChannel.subscribers?.length || 0}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Messages</span>
                      <span className={styles.statValue}>
                        {messages.length}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Status</span>
                      <span
                        className={`${styles.statValue} ${
                          selectedChannel.isActive
                            ? styles.active
                            : styles.inactive
                        }`}
                      >
                        {selectedChannel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.messagesSection}>
                    <h3 className={styles.messagesTitle}>Messages</h3>
                    {messages.length === 0 ? (
                      <div className={styles.empty}>
                        No messages yet. Send the first message!
                      </div>
                    ) : (
                      <div className={styles.messages}>
                        {messages.map((message) => (
                          <div key={message._id} className={styles.messageCard}>
                            <div className={styles.messageHeader}>
                              <div className={styles.messageSender}>
                                {message.senderId?.profilePhoto && (
                                  <img
                                    src={message.senderId.profilePhoto}
                                    alt={message.senderId.name}
                                    className={styles.senderAvatar}
                                  />
                                )}
                                <span className={styles.senderName}>
                                  {message.senderId?.name || 'Unknown'}
                                </span>
                                <span
                                  className={`${styles.priority} ${
                                    styles[message.priority || 'normal']
                                  }`}
                                >
                                  {message.priority || 'normal'}
                                </span>
                              </div>
                              <span className={styles.messageDate}>
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                            <div className={styles.messageContent}>
                              {message.content}
                            </div>
                            {message.readCount > 0 && (
                              <div className={styles.messageMeta}>
                                Read by {message.readCount} users
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  Select a channel to view details and messages
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Channel Modal */}
        {showCreateModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Create Broadcast Channel</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateChannel} className={styles.modalForm}>
                <div className={styles.formField}>
                  <label>Channel Name *</label>
                  <InputBox
                    value={channelForm.name}
                    onChange={(e) =>
                      setChannelForm({ ...channelForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Description</label>
                  <textarea
                    value={channelForm.description}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        description: e.target.value,
                      })
                    }
                    className={styles.textarea}
                    rows={3}
                  />
                </div>

                <div className={styles.formField}>
                  <label>Logo URL</label>
                  <InputBox
                    value={channelForm.logo}
                    onChange={(e) =>
                      setChannelForm({ ...channelForm, logo: e.target.value })
                    }
                    type="url"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Subscribers</label>
                  <div className={styles.subscribersList}>
                    {users.map((user) => {
                      const isSelected = channelForm.subscribers.some(
                        (sub) => (typeof sub === 'string' ? sub : sub.userId) === user._id
                      );
                      return (
                        <label
                          key={user._id}
                          className={styles.subscriberItem}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubscriber(user._id)}
                          />
                          <span>{user.name} ({user.email})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={channelForm.settings.allowComments}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          settings: {
                            ...channelForm.settings,
                            allowComments: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Allow Comments</span>
                  </label>
                </div>

                <div className={styles.formField}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={channelForm.settings.requireApproval}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          settings: {
                            ...channelForm.settings,
                            requireApproval: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Require Approval</span>
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Channel'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showMessageModal && selectedChannel && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowMessageModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Send Broadcast Message</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowMessageModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSendMessage} className={styles.modalForm}>
                <div className={styles.formField}>
                  <label>Channel</label>
                  <InputBox value={selectedChannel.name} disabled />
                </div>

                <div className={styles.formField}>
                  <label>Message Content *</label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        content: e.target.value,
                      })
                    }
                    className={styles.textarea}
                    rows={6}
                    required
                    placeholder="Enter your broadcast message..."
                  />
                </div>

                <div className={styles.formField}>
                  <label>Priority</label>
                  <select
                    value={messageForm.priority}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        priority: e.target.value,
                      })
                    }
                    className={styles.select}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMessageModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

