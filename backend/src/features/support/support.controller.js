import { asyncHandler } from "../../common/utilities/handler.js";
import {
  closeThread,
  createCustomerMessage,
  createVisitorMessage,
  getAllThreads,
  getCustomerThread,
  getThreadById,
  getVisitorThread,
  markThreadAsRead,
  replyToThread,
} from "./support.service.js";

// Trace point: requireAdmin()
const requireAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Forbidden" });
    return false;
  }

  return true;
};

export const getMyThreadController = asyncHandler(async (req, res) => {
  const thread = await getCustomerThread(req.user.id);
  res.json({ success: true, data: thread });
});

export const createMyMessageController = asyncHandler(async (req, res) => {
  const thread = await createCustomerMessage(req.user.id, req.body.message);
  res.status(201).json({ success: true, data: thread });
});

export const getVisitorThreadController = asyncHandler(async (req, res) => {
  const thread = await getVisitorThread(req.params.visitorKey);
  res.json({ success: true, data: thread });
});

export const createVisitorMessageController = asyncHandler(async (req, res) => {
  const thread = await createVisitorMessage(
    req.params.visitorKey,
    req.body.message
  );
  res.status(201).json({ success: true, data: thread });
});

export const getAdminThreadsController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const threads = await getAllThreads();
  res.json({ success: true, data: threads });
});

export const getAdminThreadController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const thread = await getThreadById(req.params.id);
  res.json({ success: true, data: thread });
});

export const replyAdminThreadController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const thread = await replyToThread(req.params.id, req.body.message);
  res.json({ success: true, data: thread });
});

export const markAdminThreadReadController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const thread = await markThreadAsRead(req.params.id);
  res.json({ success: true, data: thread });
});

export const closeAdminThreadController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const thread = await closeThread(req.params.id);
  res.json({ success: true, data: thread });
});
