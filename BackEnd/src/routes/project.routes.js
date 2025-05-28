const projectController = require("../controllers/project.controller");

module.exports = [
  {
    method: "GET",
    path: "/projects",
    options: projectController.getAllProject,
  },
  {
    method: "GET",
    path: "/projects/{pId}",
    options: projectController.getProjectById,
  },
  {
    method: "POST",
    path: "/projects",
    options: projectController.createProject,
  },
  {
    method: "PUT",
    path: "/projects/{pId}",
    options: projectController.updateProject,
  },
  {
    method: "DELETE",
    path: "/projects/{pId}",
    options: projectController.deleteProject,
  },
];