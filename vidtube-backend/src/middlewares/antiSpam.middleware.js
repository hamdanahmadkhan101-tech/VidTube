import Comment from '../models/comment.model.js';
import apiError from '../utils/apiError.js';

const normalizeComment = (content) =>
  String(content || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const preventDuplicateCommentSpam =
  ({ windowSeconds = 30 } = {}) =>
  async (req, res, next) => {
    try {
      const userId = req.user?._id;
      const videoId = req.params?.videoId;
      const parent = req.body?.parent || null;
      const normalizedContent = normalizeComment(req.body?.content);

      if (!userId || !videoId || !normalizedContent) {
        return next();
      }

      const threshold = new Date(Date.now() - windowSeconds * 1000);
      const recentComment = await Comment.findOne({
        owner: userId,
        video: videoId,
        parent,
        createdAt: { $gte: threshold },
      })
        .sort({ createdAt: -1 })
        .select('content')
        .lean();

      if (
        recentComment &&
        normalizeComment(recentComment.content) === normalizedContent
      ) {
        throw new apiError(
          429,
          'You are posting too quickly. Please wait before submitting the same comment again.'
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
