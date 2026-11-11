import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import EmployeeForm from '../components/EmployeeForm.jsx';

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Employees() {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | employee
  const debouncedSearch = useDebounced(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/employees', {
        params: { search: debouncedSearch, department, status, sort, page, limit: 8 },
      });
      setEmployees(data.employees);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      if (err.status === 401) logout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, status, sort, page, logout]);

  const loadDepartments = useCallback(async () => {
    try {
      const data = await api('/employees/meta/departments');
      setDepartments(data.departments);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, status, sort]);

  async function save(values) {
    if (editing && editing._id) {
      await api(`/employees/${editing._id}`, { method: 'PUT', body: values });
    } else {
      await api('/employees', { method: 'POST', body: values });
    }
    setEditing(null);
    await Promise.all([load(), loadDepartments()]);
  }

  async function remove(emp) {
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      await api(`/employees/${emp._id}`, { method: 'DELETE' });
      // if we deleted the last item on this page, step back
      if (employees.length === 1 && page > 1) setPage(page - 1);
      else await load();
      loadDepartments();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <h1>Employee Management</h1>
          <p className="muted">Signed in as {user.name}</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setEditing({})}>+ Add employee</button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="card toolbar">
        <input
          className="search"
          placeholder="Search by name, email, position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Active</option>
          <option>On Leave</option>
          <option>Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="-salary">Salary high-low</option>
          <option value="salary">Salary low-high</option>
        </select>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="empty">Loading...</td></tr>
            )}
            {!loading && employees.length === 0 && (
              <tr><td colSpan="7" className="empty">No employees found.</td></tr>
            )}
            {!loading &&
              employees.map((e) => (
                <tr key={e._id}>
                  <td data-label="Name">
                    <strong>{e.name}</strong>
                    <div className="muted small">{e.email}</div>
                  </td>
                  <td data-label="Department">{e.department}</td>
                  <td data-label="Position">{e.position}</td>
                  <td data-label="Salary">{money(e.salary)}</td>
                  <td data-label="Status">
                    <span className={`badge ${e.status.replace(' ', '-').toLowerCase()}`}>{e.status}</span>
                  </td>
                  <td data-label="Joined">{e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '-'}</td>
                  <td className="row-actions">
                    <button className="btn small" onClick={() => setEditing(e)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(e)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted">{total} employee{total === 1 ? '' : 's'}</span>
        <div className="row">
          <button className="btn small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn small" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {editing && (
        <EmployeeForm
          initial={editing._id ? editing : null}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
