const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: { type: String, trim: true, default: '' },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    position: { type: String, required: [true, 'Position is required'], trim: true },
    salary: { type: Number, min: [0, 'Salary cannot be negative'], default: 0 },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    joiningDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 'text', email: 'text', position: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
