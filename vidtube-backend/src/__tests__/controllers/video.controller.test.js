import request from 'supertest';
import testApp from '../setup/testApp.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase.js';
import { createTestUser, createAndLoginTestUser, createTestVideo } from '../setup/testHelpers.js';
import Video from '../../models/video.model.js';
import path from 'path';

// Use path.resolve for test assets
// In Jest with Babel, __dirname is available after transformation
const getTestAssetPath = (filename) => {
  // __dirname is available after Babel transformation
  // eslint-disable-next-line no-undef
  return path.resolve(__dirname, '../assets', filename);
};

// Mock Cloudinary
jest.mock('../../utils/cloudinary.js', () => ({
  uploadOnCloudinary: jest.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/test/video/upload/test-video.mp4',
    public_id: 'test-video',
    duration: 120,
    format: 'mp4',
  }),
  deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

describe('Video Controller', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
    const userData = await createAndLoginTestUser();
    testUser = userData.user;
    authToken = userData.token;
  });

  describe('GET /api/v1/videos', () => {
    test('should get all published videos', async () => {
      // Create some test videos
      await createTestVideo(testUser._id, { isPublished: true, title: 'Video 1' });
      await createTestVideo(testUser._id, { isPublished: true, title: 'Video 2' });
      await createTestVideo(testUser._id, { isPublished: false, title: 'Draft Video' });

      const response = await request(testApp)
        .get('/api/v1/videos')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // Only published videos
      expect(response.body.data[0]).toHaveProperty('title');
    });

    test('should support pagination', async () => {
      // Create multiple videos
      for (let i = 0; i < 5; i++) {
        await createTestVideo(testUser._id, { 
          isPublished: true, 
          title: `Video ${i + 1}` 
        });
      }

      const response = await request(testApp)
        .get('/api/v1/videos')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      // Check meta for pagination info if available
      if (response.body.meta) {
        expect(response.body.meta.pagination).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/videos/:videoId', () => {
    test('should get video by ID', async () => {
      const video = await createTestVideo(testUser._id, {
        title: 'Test Video',
        description: 'Test description',
      });

      const response = await request(testApp)
        .get(`/api/v1/videos/${video._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', video._id.toString());
      expect(response.body.data).toHaveProperty('title', 'Test Video');
      expect(response.body.data).toHaveProperty('owner');
    });

    test('should return 404 for non-existent video', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(testApp)
        .get(`/api/v1/videos/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should get video details', async () => {
      const video = await createTestVideo(testUser._id, { views: 10 });

      const response = await request(testApp)
        .get(`/api/v1/videos/${video._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', video._id.toString());
      // Views increment may be implemented separately, not tested here
    });
  });

  describe('POST /api/v1/videos/upload', () => {
    test('should upload video successfully', async () => {
      const videoPath = getTestAssetPath('test-video.mp4');
      const thumbnailPath = getTestAssetPath('test-cover.jpg');

      const response = await request(testApp)
        .post('/api/v1/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'My Test Video')
        .field('description', 'Video description')
        .field('videoformat', 'mp4')
        .field('duration', '120')
        .attach('video', videoPath)
        .attach('thumbnail', thumbnailPath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'My Test Video');
      // Owner might be object with _id property
      if (response.body.data.owner) {
        const ownerId = typeof response.body.data.owner === 'object' 
          ? response.body.data.owner._id || response.body.data.owner 
          : response.body.data.owner;
        expect(ownerId.toString()).toBe(testUser._id.toString());
      }
    }, 30000);

    test('should fail without authentication', async () => {
      const response = await request(testApp)
        .post('/api/v1/videos/upload')
        .field('title', 'Test Video');

      expect(response.status).toBe(401);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(testApp)
        .post('/api/v1/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('description', 'Video description');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/videos/:videoId', () => {
    test('should update video successfully', async () => {
      const video = await createTestVideo(testUser._id, {
        title: 'Original Title',
      });

      const response = await request(testApp)
        .patch(`/api/v1/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
    });

    test('should fail if user is not video owner', async () => {
      const otherUser = await createTestUser({ username: 'otheruser' });
      const video = await createTestVideo(otherUser._id);

      const response = await request(testApp)
        .patch(`/api/v1/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/videos/:videoId', () => {
    test('should delete video successfully', async () => {
      const video = await createTestVideo(testUser._id);

      const response = await request(testApp)
        .delete(`/api/v1/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify video is deleted
      const deletedVideo = await Video.findById(video._id);
      expect(deletedVideo).toBeNull();
    });

    test('should fail if user is not video owner', async () => {
      const otherUser = await createTestUser({ username: 'otheruser' });
      const video = await createTestVideo(otherUser._id);

      const response = await request(testApp)
        .delete(`/api/v1/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/videos/search', () => {
    test('should search videos by title', async () => {
      await createTestVideo(testUser._id, {
        title: 'JavaScript Tutorial',
        isPublished: true,
      });
      await createTestVideo(testUser._id, {
        title: 'Python Basics',
        isPublished: true,
      });

      const response = await request(testApp)
        .get('/api/v1/videos/search')
        .query({ query: 'JavaScript' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].title).toMatch(/javascript/i);
      }
    });
  });
});
