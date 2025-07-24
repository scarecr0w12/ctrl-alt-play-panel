import { Router } from 'express';
import { CollectionService } from '../services/collectionService';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const collectionService = new CollectionService();

/**
 * Get all collections for authenticated user
 * GET /api/collections
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const collections = await collectionService.getUserCollections(userId);

    return res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Failed to get collections:', error);
    return res.status(500).json({ error: 'Failed to get collections' });
  }
});

/**
 * Get public collections
 * GET /api/collections/public
 */
router.get('/public', async (req, res) => {
  try {
    const collections = await collectionService.getPublicCollections();

    return res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Failed to get public collections:', error);
    return res.status(500).json({ error: 'Failed to get public collections' });
  }
});

/**
 * Search collections
 * GET /api/collections/search
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = (req as any).user?.id;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const collections = await collectionService.searchCollections(q as string, userId);

    return res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Failed to search collections:', error);
    return res.status(500).json({ error: 'Failed to search collections' });
  }
});

/**
 * Get a specific collection
 * GET /api/collections/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const collection = await collectionService.getCollection(id, userId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Failed to get collection:', error);
    return res.status(500).json({ error: 'Failed to get collection' });
  }
});

/**
 * Create a new collection
 * POST /api/collections
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { name, description, type = 'MIXED', isPublic = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await collectionService.createCollection({
      name,
      description,
      type,
      isPublic,
      userId
    });

    return res.status(201).json({
      success: true,
      data: collection,
      message: 'Collection created successfully'
    });
  } catch (error) {
    console.error('Failed to create collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create collection';
    return res.status(500).json({ error: errorMessage });
  }
});

/**
 * Update a collection
 * PUT /api/collections/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { name, description, type, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const collection = await collectionService.updateCollection(id, userId, {
      name,
      description,
      type,
      isPublic
    });

    return res.json({
      success: true,
      data: collection,
      message: 'Collection updated successfully'
    });
  } catch (error) {
    console.error('Failed to update collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update collection';
    return res.status(500).json({ error: errorMessage });
  }
});

/**
 * Delete a collection
 * DELETE /api/collections/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const success = await collectionService.deleteCollection(id, userId);

    if (success) {
      return res.json({
        success: true,
        message: 'Collection deleted successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to delete collection' });
    }
  } catch (error) {
    console.error('Failed to delete collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete collection';
    return res.status(500).json({ error: errorMessage });
  }
});

/**
 * Add item to collection
 * POST /api/collections/:id/items
 */
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { itemType, itemId, order } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }

    const success = await collectionService.addItemToCollection(id, userId, {
      itemType,
      itemId,
      order
    });

    if (success) {
      return res.json({
        success: true,
        message: 'Item added to collection successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to add item to collection' });
    }
  } catch (error) {
    console.error('Failed to add item to collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add item to collection';
    return res.status(400).json({ error: errorMessage });
  }
});

/**
 * Remove item from collection
 * DELETE /api/collections/:id/items/:itemId
 */
router.delete('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const success = await collectionService.removeItemFromCollection(id, itemId, userId);

    if (success) {
      return res.json({
        success: true,
        message: 'Item removed from collection successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to remove item from collection' });
    }
  } catch (error) {
    console.error('Failed to remove item from collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from collection';
    return res.status(500).json({ error: errorMessage });
  }
});

export default router;