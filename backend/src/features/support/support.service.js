import AppError from "../../common/utilities/error.js";
import { withTransaction } from "../../common/utilities/handler.js";
import UserModel from "../user/user.repository.js";
import SupportThreadModel from "./support.repository.js";

// Trace point: buildMessage()
const buildMessage = (sender, body, authorName) => ({
  id: crypto.randomUUID(),
  sender,
  author_name: authorName,
  body,
  created_at: new Date().toISOString(),
});

// Trace point: getSystemGreeting()
const getSystemGreeting = () =>
  buildMessage(
    "system",
    "Hi! Thanks for reaching out. We will help you with your order, products, or checkout questions.",
    "Support"
  );

// Trace point: loadCustomerIdentity()
const loadCustomerIdentity = async (userId, conn = null) => {
  const user = await UserModel.findByIdWithProfile(userId, conn);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    user_id: user.id,
    user_name: `${user.first_name} ${user.last_name}`.trim() || user.email,
    user_email: user.email ?? null,
  };
};

// Trace point: loadVisitorIdentity()
const loadVisitorIdentity = (visitorKey) => ({
  visitor_key: visitorKey,
  user_name: "Guest",
  user_email: null,
});

// Trace point: upsertCustomerThread()
const upsertCustomerThread = async (identity, message, conn = null) => {
  const existing = identity.user_id
    ? await SupportThreadModel.findByUserId(identity.user_id, conn)
    : await SupportThreadModel.findByVisitorKey(identity.visitor_key, conn);

  if (!existing) {
    return SupportThreadModel.createThread(
      {
        ...identity,
        status: "open",
        unread_count: 1,
        messages: [
          getSystemGreeting(),
          buildMessage("customer", message, identity.user_name),
        ],
        last_message_at: new Date(),
      },
      conn
    );
  }

  const updatedMessages = [
    ...existing.messages,
    buildMessage("customer", message, identity.user_name),
  ];

  return SupportThreadModel.replaceThread(
    existing.id,
    {
      ...existing,
      status: "open",
      unread_count: Number(existing.unread_count ?? 0) + 1,
      messages: updatedMessages,
      last_message_at: new Date(),
    },
    conn
  );
};

// Trace point: appendAdminReply()
const appendAdminReply = async (threadId, message, conn = null) => {
  const thread = await SupportThreadModel.findThreadById(threadId, conn);

  if (!thread) {
    throw new AppError("Support thread not found", 404);
  }

  return SupportThreadModel.replaceThread(
    thread.id,
    {
      ...thread,
      status: "open",
      unread_count: 0,
      messages: [
        ...thread.messages,
        buildMessage("admin", message, "Admin Support"),
      ],
      last_message_at: new Date(),
    },
    conn
  );
};

// Trace point: getCustomerThread()
export const getCustomerThread = async (userId) => {
  const thread = await SupportThreadModel.findByUserId(userId);
  return thread;
};

// Trace point: getVisitorThread()
export const getVisitorThread = async (visitorKey) => {
  const thread = await SupportThreadModel.findByVisitorKey(visitorKey);
  return thread;
};

// Trace point: createCustomerMessage()
export const createCustomerMessage = async (userId, message) => {
  return withTransaction(UserModel.pool, async (conn) => {
    const identity = await loadCustomerIdentity(userId, conn);
    return upsertCustomerThread(identity, message, conn);
  });
};

// Trace point: createVisitorMessage()
export const createVisitorMessage = async (visitorKey, message) => {
  return withTransaction(UserModel.pool, async (conn) => {
    const identity = loadVisitorIdentity(visitorKey);
    return upsertCustomerThread(identity, message, conn);
  });
};

// Trace point: getAllThreads()
export const getAllThreads = async () => {
  return SupportThreadModel.findAllThreads();
};

// Trace point: getThreadById()
export const getThreadById = async (id) => {
  const thread = await SupportThreadModel.findThreadById(id);

  if (!thread) {
    throw new AppError("Support thread not found", 404);
  }

  return thread;
};

// Trace point: markThreadAsRead()
export const markThreadAsRead = async (id) => {
  const thread = await getThreadById(id);

  return SupportThreadModel.replaceThread(id, {
    ...thread,
    unread_count: 0,
  });
};

// Trace point: closeThread()
export const closeThread = async (id) => {
  const thread = await getThreadById(id);

  return SupportThreadModel.replaceThread(id, {
    ...thread,
    status: "closed",
  });
};

// Trace point: replyToThread()
export const replyToThread = async (id, message) => appendAdminReply(id, message);
