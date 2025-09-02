import type { Express } from "express";
import { db } from "../db";
import { 
  posts, 
  topics, 
  users, 
  collections,
  documents,
  collectionDocuments,
  likes,
  comments,
  bookmarks,
  reposts,
  follows,
  insertPostSchema,
  insertLikeSchema,
  insertCommentSchema,
  insertBookmarkSchema,
  insertRepostSchema,
  type PostWithDetails
} from "@shared/schema";
import { jwtAuth, getJwtUserId } from "../routes/auth";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { generateTopicFromContent, generatePostExcerpt } from "../services/openai";

export function registerPostRoutes(app: Express) {
  
  // Get feed posts with pagination
  app.get("/api/posts", async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get posts with all details
      const postsData = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          excerpt: posts.excerpt,
          authorId: posts.authorId,
          topicId: posts.topicId,
          collectionId: posts.collectionId,
          type: posts.type,
          metadata: posts.metadata,
          isPublished: posts.isPublished,
          isPinned: posts.isPinned,
          viewCount: posts.viewCount,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
          topic: {
            id: topics.id,
            name: topics.name,
            slug: topics.slug,
            color: topics.color,
            icon: topics.icon,
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(topics, eq(posts.topicId, topics.id))
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.isPinned), desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get stats and user actions for each post
      const postIds = postsData.map(p => p.id);
      
      const [likeCounts, commentCounts, repostCounts, bookmarkCounts] = await Promise.all([
        db.select({
          postId: sql<number>`CAST(${likes.targetId} as INTEGER)`,
          count: sql<number>`CAST(COUNT(*) as INTEGER)`
        })
        .from(likes)
        .where(and(
          eq(likes.targetType, 'post'),
          inArray(likes.targetId, postIds)
        ))
        .groupBy(likes.targetId),

        db.select({
          postId: comments.postId,
          count: sql<number>`CAST(COUNT(*) as INTEGER)`
        })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId),

        db.select({
          postId: reposts.postId,
          count: sql<number>`CAST(COUNT(*) as INTEGER)`
        })
        .from(reposts)
        .where(inArray(reposts.postId, postIds))
        .groupBy(reposts.postId),

        db.select({
          postId: bookmarks.postId,
          count: sql<number>`CAST(COUNT(*) as INTEGER)`
        })
        .from(bookmarks)
        .where(inArray(bookmarks.postId, postIds))
        .groupBy(bookmarks.postId)
      ]);

      // Get user actions if authenticated
      let userLikes: any[] = [];
      let userBookmarks: any[] = [];
      let userReposts: any[] = [];
      let userFollows: any[] = [];

      if (userId) {
        [userLikes, userBookmarks, userReposts, userFollows] = await Promise.all([
          db.select({ targetId: likes.targetId })
            .from(likes)
            .where(and(
              eq(likes.userId, userId),
              eq(likes.targetType, 'post'),
              inArray(likes.targetId, postIds)
            )),

          db.select({ postId: bookmarks.postId })
            .from(bookmarks)
            .where(and(
              eq(bookmarks.userId, userId),
              inArray(bookmarks.postId, postIds)
            )),

          db.select({ postId: reposts.postId })
            .from(reposts)
            .where(and(
              eq(reposts.userId, userId),
              inArray(reposts.postId, postIds)
            )),

          db.select({ followingId: follows.followingId })
            .from(follows)
            .where(and(
              eq(follows.followerId, userId),
              inArray(follows.followingId, postsData.map(p => p.authorId))
            ))
        ]);
      }

      // Combine data
      const postsWithDetails: PostWithDetails[] = postsData.map(post => {
        const stats = {
          likeCount: likeCounts.find(l => l.postId === post.id)?.count || 0,
          commentCount: commentCounts.find(c => c.postId === post.id)?.count || 0,
          repostCount: repostCounts.find(r => r.postId === post.id)?.count || 0,
          bookmarkCount: bookmarkCounts.find(b => b.postId === post.id)?.count || 0,
        };

        const userActions = {
          isLiked: userLikes.some(l => l.targetId === post.id),
          isBookmarked: userBookmarks.some(b => b.postId === post.id),
          isReposted: userReposts.some(r => r.postId === post.id),
          isFollowing: userFollows.some(f => f.followingId === post.authorId),
        };

        return {
          ...post,
          stats,
          userActions
        };
      });

      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Create new post
  app.post("/api/posts", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, content, topicId, collectionId, type = 'text', metadata } = req.body;

      // Generate excerpt
      const excerpt = await generatePostExcerpt(content);

      // Auto-assign topic if not provided
      let finalTopicId = topicId;
      if (!finalTopicId) {
        const topicSuggestion = await generateTopicFromContent(content, title);
        
        // Find or create topic
        const existingTopic = await db
          .select()
          .from(topics)
          .where(eq(topics.name, topicSuggestion.topic))
          .limit(1);

        if (existingTopic.length > 0) {
          finalTopicId = existingTopic[0].id;
        } else {
          // Create new topic
          const [newTopic] = await db
            .insert(topics)
            .values({
              name: topicSuggestion.topic,
              slug: topicSuggestion.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: `Content related to ${topicSuggestion.topic}`,
            })
            .returning();
          finalTopicId = newTopic.id;
        }
      }

      const [post] = await db
        .insert(posts)
        .values({
          title,
          content,
          excerpt,
          authorId: userId,
          topicId: finalTopicId,
          collectionId,
          type,
          metadata,
        })
        .returning();

      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Like/unlike post
  app.post("/api/posts/:id/like", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const postId = parseInt(req.params.id);

      // Check if already liked
      const existingLike = await db
        .select()
        .from(likes)
        .where(and(
          eq(likes.userId, userId),
          eq(likes.targetType, 'post'),
          eq(likes.targetId, postId)
        ))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db
          .delete(likes)
          .where(and(
            eq(likes.userId, userId),
            eq(likes.targetType, 'post'),
            eq(likes.targetId, postId)
          ));
        res.json({ liked: false });
      } else {
        // Like
        await db
          .insert(likes)
          .values({
            userId,
            targetType: 'post',
            targetId: postId,
          });
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Bookmark/unbookmark post
  app.post("/api/posts/:id/bookmark", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const postId = parseInt(req.params.id);

      // Check if already bookmarked
      const existingBookmark = await db
        .select()
        .from(bookmarks)
        .where(and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.postId, postId)
        ))
        .limit(1);

      if (existingBookmark.length > 0) {
        // Remove bookmark
        await db
          .delete(bookmarks)
          .where(and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.postId, postId)
          ));
        res.json({ bookmarked: false });
      } else {
        // Add bookmark
        await db
          .insert(bookmarks)
          .values({
            userId,
            postId,
          });
        res.json({ bookmarked: true });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  // New Pinterest-style bookmarking endpoint
  app.post("/api/bookmarks", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { postId, collectionIds } = req.body;

      if (!postId || !Array.isArray(collectionIds) || collectionIds.length === 0) {
        return res.status(400).json({ error: "Post ID and collection IDs are required" });
      }

      // Verify the user owns all the specified collections
      const userCollections = await db
        .select({ id: collections.id })
        .from(collections)
        .where(and(
          eq(collections.userId, userId),
          inArray(collections.id, collectionIds)
        ));

      if (userCollections.length !== collectionIds.length) {
        return res.status(403).json({ error: "You can only save to your own collections" });
      }

      // Get the post to create a document from it
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create a document from the bookmarked post
      const [document] = await db
        .insert(documents)
        .values({
          name: post.title || "Untitled Post",
          content: post.content,
          mimeType: "text/plain",
          size: post.content.length,
          type: "bookmark",
          sourcePostId: postId,
          userId: userId,
        })
        .returning();

      // Link the document to all selected collections
      const collectionDocumentEntries = collectionIds.map(collectionId => ({
        collectionId: collectionId,
        documentId: document.id,
      }));

      await db
        .insert(collectionDocuments)
        .values(collectionDocumentEntries);

      res.json({ 
        success: true, 
        document,
        savedToCollections: collectionIds.length 
      });
    } catch (error) {
      console.error("Error saving post to collections:", error);
      res.status(500).json({ error: "Failed to save post to collections" });
    }
  });

  // Get collections a post is saved to
  app.get("/api/bookmarks/:postId", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const postId = parseInt(req.params.postId);

      const savedCollections = await db
        .select({
          collectionId: collectionDocuments.collectionId,
          collectionName: collections.name,
        })
        .from(collectionDocuments)
        .innerJoin(documents, eq(collectionDocuments.documentId, documents.id))
        .innerJoin(collections, eq(collectionDocuments.collectionId, collections.id))
        .where(and(
          eq(documents.sourcePostId, postId),
          eq(documents.userId, userId),
          eq(documents.type, "bookmark")
        ));

      res.json(savedCollections);
    } catch (error) {
      console.error("Error fetching bookmark collections:", error);
      res.status(500).json({ error: "Failed to fetch bookmark collections" });
    }
  });

  // Repost
  app.post("/api/posts/:id/repost", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const postId = parseInt(req.params.id);
      const { comment } = req.body;

      // Check if already reposted
      const existingRepost = await db
        .select()
        .from(reposts)
        .where(and(
          eq(reposts.userId, userId),
          eq(reposts.postId, postId)
        ))
        .limit(1);

      if (existingRepost.length > 0) {
        return res.status(400).json({ error: "Already reposted" });
      }

      const [repost] = await db
        .insert(reposts)
        .values({
          userId,
          postId,
          comment,
        })
        .returning();

      res.json(repost);
    } catch (error) {
      console.error("Error creating repost:", error);
      res.status(500).json({ error: "Failed to create repost" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:id/comments", async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = getJwtUserId(req);

      const commentsData = await db
        .select({
          id: comments.id,
          content: comments.content,
          authorId: comments.authorId,
          postId: comments.postId,
          parentId: comments.parentId,
          isEdited: comments.isEdited,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

      res.json(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Add comment to post
  app.post("/api/posts/:id/comments", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const postId = parseInt(req.params.id);
      const { content, parentId } = req.body;

      const [comment] = await db
        .insert(comments)
        .values({
          content,
          authorId: userId,
          postId,
          parentId,
        })
        .returning();

      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });
}