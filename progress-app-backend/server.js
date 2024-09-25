const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Directory for projects
const projectsDir = path.join(__dirname, 'data', 'projects');
const downloadsFilePath = path.join(__dirname, 'data', 'downloads.json');

// Get the path for a specific project's stages file
const getProjectStagesFilePath = (projectId) => path.join(projectsDir, `Project${projectId}`, 'stage.json');

// Get all projects
app.get('/projects', (req, res) => {
  fs.readdir(projectsDir, (err, projectDirs) => {
    if (err) {
      return res.status(500).send('Error reading projects directory');
    }

    const projects = projectDirs.map((dir) => {
      const filePath = path.join(projectsDir, dir, 'stage.json');
      if (fs.existsSync(filePath)) {
        // Safely reading file without using require
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return { projectId: projectData.projectId, projectName: projectData.projectName };
      }
      return null;
    }).filter(Boolean); // Filter out any nulls in case of missing `stage.json` files

    res.json(projects);
  });
});

// Get stages for a specific project
app.get('/projects/stage/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const filePath = getProjectStagesFilePath(projectId);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading project stages');
    }
    res.json(JSON.parse(data));
  });
});

// Add or update a stage for a specific project
app.post('/projects/stage/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const newStage = req.body;
  const filePath = getProjectStagesFilePath(projectId);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading project stages');
    }

    let stages = JSON.parse(data);
    const existingStageIndex = stages.findIndex(stage => stage.id === newStage.id);
    if (existingStageIndex !== -1) {
      // Update existing stage
      stages[existingStageIndex] = newStage;
    } else {
      // Add new stage
      newStage.id = stages.length > 0 ? stages[stages.length - 1].id + 1 : 1;
      stages.push(newStage);
    }

    fs.writeFile(filePath, JSON.stringify(stages, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error saving project stages');
      }
      res.json(stages);  // Return updated stages
    });
  });
});

// Update a stage status by ID for a specific project
app.post('/projects/stage/:projectId/:id', (req, res) => {
  const projectId = req.params.projectId;
  const stageId = parseInt(req.params.id);
  const { status } = req.body;
  const filePath = getProjectStagesFilePath(projectId);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading project stages');
    }

    let stages = JSON.parse(data);
    const stageIndex = stages.findIndex(stage => stage.id === stageId);

    if (stageIndex !== -1) {
      // Update the status of the stage
      stages[stageIndex].status = status;

      fs.writeFile(filePath, JSON.stringify(stages, null, 2), (err) => {
        if (err) {
          return res.status(500).send('Error saving project stages');
        }
        res.json(stages);  // Return updated stages
      });
    } else {
      res.status(404).send('Stage not found');
    }
  });
});

// Remove a stage by ID for a specific project
app.delete('/projects/stage/:projectId/:id', (req, res) => {
  const projectId = req.params.projectId;
  const stageId = parseInt(req.params.id);
  const filePath = getProjectStagesFilePath(projectId);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading project stages');
    }

    let stages = JSON.parse(data);
    stages = stages.filter(stage => stage.id !== stageId);

    fs.writeFile(filePath, JSON.stringify(stages, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error saving project stages');
      }
      res.json(stages);  // Return updated stages
    });
  });
});

// Get all downloads
app.get('/downloads', (req, res) => {
  fs.readFile(downloadsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading downloads');
    }
    res.json(JSON.parse(data));
  });
});

// Add or update a download
app.post('/downloads', (req, res) => {
  const newDownload = req.body;

  fs.readFile(downloadsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading downloads');
    }

    let downloads = JSON.parse(data);
    const existingDownloadIndex = downloads.findIndex(download => download.id === newDownload.id);
    if (existingDownloadIndex !== -1) {
      // Update existing download
      downloads[existingDownloadIndex] = newDownload;
    } else {
      // Add new download
      newDownload.id = downloads.length > 0 ? downloads[downloads.length - 1].id + 1 : 1;
      downloads.push(newDownload);
    }

    fs.writeFile(downloadsFilePath, JSON.stringify(downloads, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error saving downloads');
      }
      res.json(downloads);  // Return updated downloads
    });
  });
});

// Remove a download by ID
app.delete('/downloads/:id', (req, res) => {
  const downloadId = parseInt(req.params.id);

  fs.readFile(downloadsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading downloads');
    }

    let downloads = JSON.parse(data);
    downloads = downloads.filter(download => download.id !== downloadId);

    fs.writeFile(downloadsFilePath, JSON.stringify(downloads, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error saving downloads');
      }
      res.json(downloads);  // Return updated downloads
    });
  });
});

// Route for the root path
app.get('/', (req, res) => {
  res.send('Welcome to the stages API!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
