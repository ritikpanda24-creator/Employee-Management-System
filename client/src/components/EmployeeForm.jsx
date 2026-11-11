import { useState } from 'react';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  salary: '',
  status: 'Active',
  joiningDate: new Date().toISOString().slice(0, 10),
};

export default function EmployeeForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...EMPTY,
          ...initial,
          joiningDate: initial.joiningDate ? initial.joiningDate.slice(0, 10) : EMPTY.joiningDate,
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit({ ...form, salary: form.salary === '' ? 0 : Number(form.salary) });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="card modal" onSubmit={submit}>
        <h2>{initial ? 'Edit employee' : 'Add employee'}</h2>
        {error && <div className="alert">{error}</div>}
        <div className="grid-2">
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} />
          </label>
          <label>
            Department
            <input name="department" value={form.department} onChange={onChange} required />
          </label>
          <label>
            Position
            <input name="position" value={form.position} onChange={onChange} required />
          </label>
          <label>
            Salary
            <input type="number" min="0" name="salary" value={form.salary} onChange={onChange} />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={onChange}>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </label>
          <label>
            Joining date
            <input type="date" name="joiningDate" value={form.joiningDate} onChange={onChange} />
          </label>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
