"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout.jsx";
import GroupList from "../../components/GroupList/GroupList.jsx";
import GroupHeader from "../../components/GroupHeader/GroupHeader.jsx";
import GroupMessageArea from "../../components/GroupMessageArea/GroupMessageArea.jsx";
import GroupMembersPanel from "../../components/GroupMembersPanel/GroupMembersPanel.jsx";
import GroupSettingsPanel from "../../components/GroupSettingsPanel/GroupSettingsPanel.jsx";
import ThreadModal from "../../components/ThreadModal/ThreadModal.jsx";
import PollCreator from "../../components/PollCreator/PollCreator.jsx";
import EventCreator from "../../components/EventCreator/EventCreator.jsx";
import SharedMediaGallery from "../../components/SharedMediaGallery/SharedMediaGallery.jsx";
import Button from "../../components/Button/Button.jsx";
import styles from "./page.module.css";

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThread, setShowThread] = useState(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedGroup?._id) {
      loadGroupDetails();
    }
  }, [selectedGroup?._id]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadGroupDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/groups/${selectedGroup._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGroupData(data.group);
        setUserRole(data.group.userRole);
      }
    } catch (error) {
      console.error("Error loading group details:", error);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowMembers(false);
    setShowSettings(false);
    setShowThread(null);
  };

  const handleRefreshGroup = () => {
    if (selectedGroup?._id) {
      loadGroupDetails();
    }
  };

  const handleJoinGroup = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId: selectedGroup._id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isRequest) {
          alert("Join request sent. Waiting for approval.");
        } else {
          handleRefreshGroup();
        }
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <GroupList
          onSelectGroup={handleSelectGroup}
          selectedGroupId={selectedGroup?._id}
        />
      </div>

      <div className={styles.main}>
        {selectedGroup ? (
          <>
            {groupData &&
              !groupData.isMember &&
              groupData.groupType === "public" && (
                <div className={styles.joinPrompt}>
                  <p>You are not a member of this group.</p>
                  <Button onClick={handleJoinGroup}>Join Group</Button>
                </div>
              )}

            {groupData && groupData.isMember && (
              <>
                <GroupHeader
                  group={groupData}
                  userRole={userRole}
                  onSettingsClick={() => setShowSettings(true)}
                  onMembersClick={() => setShowMembers(true)}
                />
                <GroupMessageArea
                  group={groupData}
                  currentUserId={currentUser?._id}
                  userRole={userRole}
                />
                <div className={styles.toolbar}>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setShowPollCreator(true)}
                  >
                    📊 Create Poll
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setShowEventCreator(true)}
                  >
                    📅 Create Event
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setShowMediaGallery(true)}
                  >
                    🖼️ Media Gallery
                  </Button>
                </div>
              </>
            )}

            {groupData &&
              !groupData.isMember &&
              groupData.groupType === "private" && (
                <div className={styles.joinPrompt}>
                  <p>
                    This is a private group. Request to join or wait for an
                    invitation.
                  </p>
                  <Button onClick={handleJoinGroup}>Request to Join</Button>
                </div>
              )}
          </>
        ) : (
          <div className={styles.empty}>
            <h2>Select a group to start chatting</h2>
            <p>Choose a group from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {showMembers && groupData && (
        <GroupMembersPanel
          group={groupData}
          currentUserId={currentUser?._id}
          userRole={userRole}
          onClose={() => setShowMembers(false)}
          onRefresh={handleRefreshGroup}
        />
      )}

      {showSettings && groupData && (
        <GroupSettingsPanel
          group={groupData}
          userRole={userRole}
          onClose={() => setShowSettings(false)}
          onRefresh={handleRefreshGroup}
        />
      )}

      {showThread && (
        <ThreadModal
          isOpen={!!showThread}
          onClose={() => setShowThread(null)}
          parentMessage={showThread}
          group={groupData}
          currentUserId={currentUser?._id}
          userRole={userRole}
        />
      )}

      {showPollCreator && (
        <PollCreator
          isOpen={showPollCreator}
          onClose={() => setShowPollCreator(false)}
          groupId={selectedGroup?._id}
          onCreatePoll={handleRefreshGroup}
        />
      )}

      {showEventCreator && (
        <EventCreator
          isOpen={showEventCreator}
          onClose={() => setShowEventCreator(false)}
          groupId={selectedGroup?._id}
          onCreateEvent={handleRefreshGroup}
        />
      )}

      {showMediaGallery && (
        <SharedMediaGallery
          isOpen={showMediaGallery}
          onClose={() => setShowMediaGallery(false)}
          groupId={selectedGroup?._id}
        />
      )}
    </div>
  );
}
