import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Task {
  id: number;
  name: string;
  status: string;
  description: string;
}

const TasksPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return; // Ensure projectId is available
    setLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks`);
      setTasks(response.data.tasks);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
      setTasks([]); // Clear tasks on error
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleCreateTask = async () => {
    try {
      await axios.post(`/api/projects/${projectId}/tasks`, {
        name: newTaskName,
        description: newTaskDescription,
      });
      setNewTaskName('');
      setNewTaskDescription('');
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId: number) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, {
        name: editingTask?.name,
        description: editingTask?.description,
      });
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Manage Tasks</h1>
      <div>
        <h2>Create New Task</h2>
        <input
          type="text"
          placeholder="Task Name"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
        />
        <textarea
          placeholder="Task Description"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
        />
        <button onClick={handleCreateTask}>Create Task</button>
      </div>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {editingTask?.id === task.id ? (
              <div>
                <input
                  type="text"
                  value={editingTask.name}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, name: e.target.value })
                  }
                />
                <textarea
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                />
                <button onClick={() => handleUpdateTask(task.id)}>
                  Save
                </button>
                <button onClick={() => setEditingTask(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <h3>{task.name}</h3>
                <p>Status: {task.status}</p>
                <p>{task.description}</p>
                <button onClick={() => setEditingTask(task)}>Edit Task</button>
                <button onClick={() => handleDeleteTask(task.id)}>Delete Task</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksPage;
