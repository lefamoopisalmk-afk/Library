import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate, initials, pluralize } from '../lib/format.js';
import { RoleBadge } from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ErrorNote, Spinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import UserForm from '../components/UserForm.jsx';

export default function Users() {
  const { request, user: me } = useAuth();
  const toast = useToast();
  const list = useAsync(() => request('/users'), [request]);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  async function addUser(values) {
    const data = await request('/users', { method: 'POST', body: values });
    toast(`Added ${data.user.name} as ${data.user.role}`, 'success');
    list.reload();
  }

  async function updateUser(values) {
    const data = await request(`/users/${editing.id}`, { method: 'PUT', body: values });
    toast(`Updated ${data.user.name}`, 'success');
    setEditing(null);
    list.reload();
  }

  async function deleteUser() {
    setDeleteBusy(true);
    try {
      await request(`/users/${deleting.id}`, { method: 'DELETE' });
      toast(`Deleted ${deleting.name}`, 'info');
      setDeleting(null);
      list.reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  const users = list.data?.users || [];

  return (
    <div className="page">
      <PageHeader eyebrow="Admin" title="Users" text="Who can sign in, and what each person is allowed to do." />

      <div className="two-col">
        <aside className="panel sticky-aside">
          <div className="panel-head">
            <div>
              <h2>Add a user</h2>
              <p className="muted">Members read, librarians manage stock, admins manage people.</p>
            </div>
          </div>
          <UserForm mode="add" onSubmit={addUser} idPrefix="add-user" />
        </aside>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Accounts</h2>
              <p className="muted">{list.data ? pluralize(users.length, 'account') : ''}</p>
            </div>
          </div>

          <ErrorNote error={list.error} onRetry={list.reload} />
          {list.loading && !list.data ? <Spinner label="Loading users" /> : null}
          {list.data && users.length === 0 ? <EmptyState title="No users" text="Add the first account with the form." /> : null}

          {users.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Membership ID</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u.id === me.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="person">
                            <span className="avatar avatar-sm" aria-hidden="true">
                              {initials(u.name)}
                            </span>
                            <span>
                              <strong>{u.name}</strong>
                              {isMe ? <span className="muted block">you</span> : null}
                            </span>
                          </div>
                        </td>
                        <td className="mono">{u.membershipId}</td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="muted">{formatDate(u.createdAt)}</td>
                        <td className="actions-col">
                          <div className="row-actions">
                            <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(u)}>
                              Update
                            </Button>
                            <Button
                              variant="danger-ghost"
                              size="sm"
                              type="button"
                              onClick={() => setDeleting(u)}
                              disabled={isMe}
                              title={isMe ? 'You are signed in with this account' : undefined}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      <Modal open={Boolean(editing)} title={editing ? `Update ${editing.name}` : ''} onClose={closeEdit} width={560}>
        {editing ? (
          <UserForm key={editing.id} mode="edit" initial={editing} onSubmit={updateUser} onCancel={closeEdit} idPrefix="edit-user" />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this user?"
        message={deleting ? `${deleting.name} (${deleting.membershipId}) will no longer be able to sign in.` : ''}
        confirmLabel="Delete user"
        busy={deleteBusy}
        onConfirm={deleteUser}
        onClose={closeDelete}
      />
    </div>
  );
}
