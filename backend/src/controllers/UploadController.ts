// backend/src/controllers/UploadController.ts

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../config/database';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'crop-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('image');

export class UploadController {
  async uploadCropImage(req: Request, res: Response) {
    upload(req, res, async (err) => {
      try {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { cropId } = req.body;
        
        if (!cropId) {
          return res.status(400).json({ error: 'Crop ID is required' });
        }

        // Update crop with image path
        await pool.query(
          'UPDATE crops SET image_path = $1 WHERE id = $2',
          [req.file.filename, cropId]
        );

        return res.json({
          message: 'Image uploaded successfully',
          data: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (error) {
        console.error('Upload crop image error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    });
  }

  // Optional: Add method to handle multiple file uploads
  async uploadMultipleCropImages(req: Request, res: Response) {
    const multiUpload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    }).array('images', 5); // Maximum 5 files

    multiUpload(req, res, async (err) => {
      try {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        const { cropId } = req.body;
        
        if (!cropId) {
          return res.status(400).json({ error: 'Crop ID is required' });
        }

        const files = req.files as Express.Multer.File[];
        const fileData = files.map(file => ({
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype
        }));

        // Here you might want to store multiple file paths in a different way
        // For now, we'll just update with the first file
        if (files && files.length > 0 && files[0]) {
  await pool.query(
    'UPDATE crops SET image_path = $1 WHERE id = $2',
    [files[0].filename, cropId]
  );
} else {
  throw new Error('No files available to update');
}

        return res.json({
          message: `${files.length} image(s) uploaded successfully`,
          data: {
            files: fileData,
            totalFiles: files.length
          }
        });
      } catch (error) {
        console.error('Upload multiple crop images error:', error);
        return res.status(500).json({ error: 'Failed to upload images' });
      }
    });
  }

  // Optional: Add method to delete uploaded images
  async deleteCropImage(req: Request, res: Response) {
    try {
      const { cropId } = req.params;
      const { filename } = req.body;

      if (!cropId || !filename) {
        return res.status(400).json({ 
          error: 'Crop ID and filename are required' 
        });
      }

      // Remove image path from database
      await pool.query(
        'UPDATE crops SET image_path = NULL WHERE id = $1 AND image_path = $2',
        [cropId, filename]
      );

      // Note: You might want to actually delete the physical file here
      // using fs.unlink, but be careful with file system operations

      return res.json({
        message: 'Image reference removed successfully',
        data: {
          cropId,
          filename
        }
      });
    } catch (error) {
      console.error('Delete crop image error:', error);
      return res.status(500).json({ error: 'Failed to remove image' });
    }
  }
}