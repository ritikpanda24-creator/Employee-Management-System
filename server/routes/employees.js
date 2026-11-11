const express = require('express');
const Employee = require('../models/Employee');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/employees?search=&department=&status=&sort=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { search, department, status, sort = '-createdAt' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = {};
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { position: rx }, { department: rx }];
    }
    if (department) filter.department = department;
    if (status) filter.status = status;

    const allowedSort = ['name', '-name', 'salary', '-salary', 'joiningDate', '-joiningDate', 'createdAt', '-createdAt'];
    const sortBy = allowedSort.includes(sort) ? sort : '-createdAt';

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.json({ employees, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/meta/departments
router.get('/meta/departments', async (req, res, next) => {
  try {
    const departments = await Employee.distinct('department');
    res.json({ departments: departments.sort() });
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee });
  } catch (err) {
    next(err);
  }
});

// POST /api/employees
router.post('/', async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ employee });
  } catch (err) {
    next(err);
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
