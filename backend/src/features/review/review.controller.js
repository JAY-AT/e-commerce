import OrderReviewService from "./review.service.js";

const service = new OrderReviewService();

export default class OrderReviewController {

  // Trace point: createReview()
  static async createReview(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await service.createReview(userId, req.body);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Trace point: getReviewByOrderId()
  static async getReviewByOrderId(req, res, next) {
    try {
      const userId = req.user.id;
      const { order_id } = req.params;

      const result = await service.getReviewByOrderId(userId, order_id);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Trace point: getUserReviews()
  static async getUserReviews(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await service.getUserReviews(userId);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Trace point: deleteReview()
  static async deleteReview(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await service.deleteReview(userId, id);

      res.json({ message: "Review deleted successfully" });
    } catch (err) {
      next(err);
    }
  }


  // -------------------------
  // GET TOP REVIEWS
  // -------------------------
  static async getTopReviews(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const count = parseInt(req.params.count) || limit;
      const result = await service.getTopReviews(count);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}