// Group role permissions helper

export const ROLE_HIERARCHY = {
  'owner': 5,
  'admin': 4,
  'moderator': 3,
  'member': 2,
  'read-only': 1,
};

export function hasPermission(userRole, permission) {
  const permissions = {
    'owner': {
      canSendMessage: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canChangeGroupInfo: true,
      canPinMessages: true,
      canDeleteMessages: true,
      canCreatePolls: true,
      canCreateEvents: true,
      canManageRoles: true,
    },
    'admin': {
      canSendMessage: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canChangeGroupInfo: true,
      canPinMessages: true,
      canDeleteMessages: true,
      canCreatePolls: true,
      canCreateEvents: true,
      canManageRoles: true,
    },
    'moderator': {
      canSendMessage: true,
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeGroupInfo: false,
      canPinMessages: true,
      canDeleteMessages: true, // Limited - only own messages or messages from members
      canCreatePolls: false,
      canCreateEvents: false,
      canManageRoles: false,
    },
    'member': {
      canSendMessage: true,
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeGroupInfo: false,
      canPinMessages: false,
      canDeleteMessages: false, // Only own messages
      canCreatePolls: false,
      canCreateEvents: false,
      canManageRoles: false,
    },
    'read-only': {
      canSendMessage: false,
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeGroupInfo: false,
      canPinMessages: false,
      canDeleteMessages: false,
      canCreatePolls: false,
      canCreateEvents: false,
      canManageRoles: false,
    },
  };

  return permissions[userRole]?.[permission] || false;
}

export function canManageRole(userRole, targetRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  // Can only manage roles lower than your own
  // Owner can manage everyone except themselves
  if (userRole === 'owner') {
    return targetRole !== 'owner';
  }

  return userLevel > targetLevel;
}

export function getMemberRole(group, userId) {
  if (!group?.members || !userId) {
    return null;
  }

  const userIdStr = userId.toString();
  const member = group.members.find(m => {
    // Handle both populated (object with _id) and unpopulated (ObjectId) cases
    const memberUserId = m.userId?._id ? m.userId._id.toString() : m.userId?.toString();
    return memberUserId === userIdStr;
  });

  return member?.role || null;
}

export function isMember(group, userId) {
  if (!group?.members || !userId) {
    return false;
  }

  const userIdStr = userId.toString();
  return group.members.some(m => {
    // Handle both populated (object with _id) and unpopulated (ObjectId) cases
    const memberUserId = m.userId?._id ? m.userId._id.toString() : m.userId?.toString();
    return memberUserId === userIdStr;
  });
}

export function isBanned(group, userId) {
  if (!group?.bannedUsers || !userId) {
    return false;
  }

  const userIdStr = userId.toString();
  return group.bannedUsers.some(b => {
    // Handle both populated (object with _id) and unpopulated (ObjectId) cases
    const bannedUserId = b.userId?._id ? b.userId._id.toString() : b.userId?.toString();
    return bannedUserId === userIdStr;
  });
}

export function canDeleteMessage(group, userRole, messageSenderId, currentUserId) {
  if (hasPermission(userRole, 'canDeleteMessages')) {
    // Admins and owners can delete any message
    if (userRole === 'admin' || userRole === 'owner') {
      return true;
    }
    // Moderators can delete messages from members (not admins/owners)
    if (userRole === 'moderator') {
      const messageSenderIdStr = messageSenderId.toString();
      const senderMember = group.members?.find(m => {
        // Handle both populated (object with _id) and unpopulated (ObjectId) cases
        const memberUserId = m.userId?._id ? m.userId._id.toString() : m.userId?.toString();
        return memberUserId === messageSenderIdStr;
      });
      const senderRole = senderMember?.role || 'member';
      return senderRole === 'member' || senderRole === 'read-only';
    }
  }

  // Members can only delete their own messages
  return messageSenderId.toString() === currentUserId.toString();
}

