import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Pagination, Paper, Select, Snackbar, Stack, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { requestToken } from '@ecommerce/shared-library';
import {
  assignableRoles, customRoleKeyProblem, delegationExpiryProblem, errorMessage, expiryFromDateInput, pageCount,
  roleChipLabel, type Member, type PermissionGroup, type RoleTemplate,
} from './teamModel';

// Its own client: the team API needs the client application token, never the platform token mfe-user sends elsewhere.
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = requestToken((config.baseURL || '') + (config.url || ''));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Application = { applicationCode: string; displayName: string };
type Delegation = { id: number; applicationCode: string; roleKey: string; roleName: string; expiresAt: string; otherParty: string };
type AuditEntry = { id: number; actorEmail: string; action: string; targetType: string; targetId: string; createdAt: string };
type Confirm = { title: string; body: string; run: () => Promise<void> } | null;
type Dialog = null | { kind: 'member' } | { kind: 'role'; member: Member } | { kind: 'permission'; member: Member }
  | { kind: 'customRole'; role?: RoleTemplate } | { kind: 'delegate' };

const PAGE_SIZE = 25;

export default function TeamPage() {
  const [tab, setTab] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [delegations, setDelegations] = useState<{ given: Delegation[]; received: Delegation[] }>({ given: [], received: [] });
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const loadMembers = useCallback(async () => {
    const response = await api.get('/api/tenant/team/members', { params: { query, page: page - 1, size: PAGE_SIZE } });
    setMembers(response.data.content);
    setTotal(response.data.totalElements);
  }, [query, page]);

  const loadReference = useCallback(async () => {
    const [roleList, permissionGroups, apps, mine, log] = await Promise.all([
      api.get('/api/tenant/team/roles'), api.get('/api/tenant/team/permissions'), api.get('/api/tenant/team/applications'),
      api.get('/api/tenant/delegations/mine'), api.get('/api/tenant/team/audit', { params: { limit: 50 } }),
    ]);
    setRoles(roleList.data); setGroups(permissionGroups.data); setApplications(apps.data);
    setDelegations(mine.data); setAudit(log.data);
  }, []);

  const reload = useCallback(async () => {
    setFailure('');
    try { await Promise.all([loadMembers(), loadReference()]); }
    catch (error) { setFailure(errorMessage(error, 'Unable to load the client team.')); }
    finally { setLoading(false); }
  }, [loadMembers, loadReference]);

  useEffect(() => { void reload(); }, [reload]);

  const act = async (run: () => Promise<unknown>, success: string) => {
    setFailure('');
    try { await run(); setNotice(success); setDialog(null); setConfirm(null); await reload(); }
    catch (error) { setFailure(errorMessage(error, 'The change was not saved.')); setConfirm(null); }
  };

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress /></Box>;

  return <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
    <Typography variant="caption" color="text.secondary">Account › Client team</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
      <Box><Typography variant="h4" fontWeight={850}>Client team</Typography>
        <Typography color="text.secondary">Members, application access, roles, extra permissions and delegations for this client.</Typography></Box>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => setDialog({ kind: 'delegate' })}>Delegate my role</Button>
        <Button variant="contained" onClick={() => setDialog({ kind: 'member' })}>Add member</Button>
      </Stack>
    </Stack>
    {failure && !dialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFailure('')}>{failure}</Alert>}
    <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }} variant="scrollable">
      <Tab label={`Members (${total})`} /><Tab label={`Roles (${roles.length})`} /><Tab label="Delegations" /><Tab label="Audit" />
    </Tabs>

    {tab === 0 && <>
      <TextField size="small" label="Search by name or email" value={query} sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
        onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
      <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>
        <TableCell>Member</TableCell><TableCell>Status</TableCell><TableCell>Applications and roles</TableCell><TableCell align="right">Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {members.map((member) => <TableRow key={member.userId} hover>
          <TableCell><Typography fontWeight={700}>{member.name}</Typography><Typography variant="caption" color="text.secondary">{member.email}</Typography></TableCell>
          <TableCell><Chip size="small" color={member.membershipStatus === 'ACTIVE' ? 'success' : 'default'} label={member.membershipStatus} /></TableCell>
          <TableCell>{member.applications.length === 0 && <Typography variant="body2" color="text.secondary">No application access</Typography>}
            {member.applications.map((app) => <Box key={app.applicationCode} sx={{ mb: 0.75 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={700}>{app.displayName}</Typography>
                <Button size="small" color="warning" onClick={() => setConfirm({ title: `Remove ${app.displayName}?`,
                  body: `${member.email} loses every role, delegation and extra permission in ${app.displayName}.`,
                  run: () => act(() => api.delete(`/api/tenant/team/members/${member.userId}/applications/${app.applicationCode}`), 'Application access removed.') })}>Remove access</Button>
              </Stack>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {app.roles.map((role) => <Chip key={role.id} size="small" variant={role.delegatedBy ? 'outlined' : 'filled'} label={roleChipLabel(role)}
                  onDelete={() => setConfirm({ title: 'Remove role?', body: `${member.email} loses ${role.roleName} in ${app.displayName}.`,
                    run: () => act(() => api.delete(`/api/tenant/team/members/${member.userId}/roles/${role.id}`), 'Role removed.') })} />)}
                {app.permissions.map((grant) => <Chip key={`p${grant.id}`} size="small" color="info" variant="outlined"
                  label={`+ ${grant.permissionKey}${grant.expiresAt ? ` until ${grant.expiresAt.slice(0, 10)}` : ''}`} title={grant.reason}
                  onDelete={() => setConfirm({ title: 'Remove permission?', body: `${member.email} loses ${grant.permissionKey}.`,
                    run: () => act(() => api.delete(`/api/tenant/team/members/${member.userId}/permissions/${grant.id}`), 'Permission removed.') })} />)}
              </Stack>
            </Box>)}
          </TableCell>
          <TableCell align="right"><Stack direction={{ xs: 'column', lg: 'row' }} spacing={0.5} justifyContent="flex-end">
            <Button size="small" disabled={member.membershipStatus !== 'ACTIVE'} onClick={() => setDialog({ kind: 'role', member })}>Add role</Button>
            <Button size="small" disabled={member.membershipStatus !== 'ACTIVE'} onClick={() => setDialog({ kind: 'permission', member })}>Grant permission</Button>
            <Button size="small" color={member.membershipStatus === 'ACTIVE' ? 'warning' : 'success'} onClick={() => {
              const next = member.membershipStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
              setConfirm({ title: next === 'SUSPENDED' ? 'Suspend member?' : 'Reactivate member?',
                body: next === 'SUSPENDED' ? `${member.email} can no longer sign in to any of this client's applications.` : `${member.email} regains the access they still hold.`,
                run: () => act(() => api.put(`/api/tenant/team/members/${member.userId}/status`, { status: next }), next === 'SUSPENDED' ? 'Member suspended.' : 'Member reactivated.') });
            }}>{member.membershipStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</Button>
          </Stack></TableCell>
        </TableRow>)}
        {members.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>No members match this search.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Pagination sx={{ mt: 2 }} count={pageCount(total, PAGE_SIZE)} page={page} onChange={(_, value) => setPage(value)} />
    </>}

    {tab === 1 && <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}><Button variant="contained" onClick={() => setDialog({ kind: 'customRole' })}>New custom role</Button></Stack>
      <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>
        <TableCell>Role</TableCell><TableCell>Type</TableCell><TableCell align="right">Permissions</TableCell><TableCell>You can assign</TableCell><TableCell align="right">Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {roles.map((role) => <TableRow key={role.key} hover>
          <TableCell><Typography fontWeight={700}>{role.name}</Typography><Typography variant="caption" color="text.secondary">{role.description || role.key}</Typography></TableCell>
          <TableCell><Chip size="small" label={role.custom ? 'Custom' : 'Built-in'} color={role.custom ? 'primary' : 'default'} /></TableCell>
          <TableCell align="right" title={role.permissions.join(', ')}>{role.permissions.length}</TableCell>
          <TableCell>{role.grantable ? 'Yes' : 'No'}</TableCell>
          <TableCell align="right">{role.custom && <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Button size="small" onClick={() => setDialog({ kind: 'customRole', role })}>Edit</Button>
            <Button size="small" color="warning" onClick={() => setConfirm({ title: `Archive ${role.name}?`, body: 'Archived roles can no longer be assigned. Remove it from every member first.',
              run: () => act(() => api.delete(`/api/tenant/team/roles/${role.key}`), 'Role archived.') })}>Archive</Button>
          </Stack>}</TableCell>
        </TableRow>)}
      </TableBody></Table></TableContainer>
    </>}

    {tab === 2 && <Stack spacing={2}>
      {(['given', 'received'] as const).map((side) => <Paper key={side} variant="outlined" sx={{ p: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 1 }}>{side === 'given' ? 'Roles I have lent' : 'Roles lent to me'}</Typography>
        {delegations[side].length === 0 ? <Typography color="text.secondary" variant="body2">None.</Typography>
          : <Table size="small"><TableBody>{delegations[side].map((delegation) => <TableRow key={delegation.id}>
            <TableCell>{delegation.roleName}</TableCell><TableCell>{delegation.applicationCode}</TableCell>
            <TableCell>{side === 'given' ? 'to' : 'from'} {delegation.otherParty}</TableCell><TableCell>until {delegation.expiresAt.slice(0, 10)}</TableCell>
            <TableCell align="right">{side === 'given' && <Button size="small" color="warning" onClick={() => setConfirm({ title: 'End delegation?',
              body: `${delegation.otherParty} loses ${delegation.roleName} now.`, run: () => act(() => api.delete(`/api/tenant/delegations/${delegation.id}`), 'Delegation ended.') })}>End now</Button>}</TableCell>
          </TableRow>)}</TableBody></Table>}
      </Paper>)}
    </Stack>}

    {tab === 3 && <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow>
      <TableCell>When</TableCell><TableCell>Who</TableCell><TableCell>Action</TableCell><TableCell>Target</TableCell>
    </TableRow></TableHead><TableBody>
      {audit.map((entry) => <TableRow key={entry.id}><TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
        <TableCell>{entry.actorEmail}</TableCell><TableCell>{entry.action}</TableCell><TableCell>{entry.targetType} {entry.targetId}</TableCell></TableRow>)}
      {audit.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No changes recorded yet.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>}

    {dialog?.kind === 'member' && <MemberDialog failure={failure} onClose={() => setDialog(null)}
      onSave={(email) => act(() => api.post('/api/tenant/team/members', { email }), 'Member added. Give them a role next.')} />}
    {dialog?.kind === 'role' && <RoleDialog member={dialog.member} applications={applications} roles={assignableRoles(roles)} failure={failure}
      onClose={() => setDialog(null)} onSave={(body) => act(() => api.post(`/api/tenant/team/members/${dialog.member.userId}/roles`, body), 'Role assigned.')} />}
    {dialog?.kind === 'permission' && <PermissionDialog member={dialog.member} applications={applications} groups={groups} failure={failure}
      onClose={() => setDialog(null)} onSave={(body) => act(() => api.post(`/api/tenant/team/members/${dialog.member.userId}/permissions`, body), 'Permission granted.')} />}
    {dialog?.kind === 'customRole' && <CustomRoleDialog role={dialog.role} groups={groups} failure={failure} onClose={() => setDialog(null)}
      onSave={(body) => dialog.role
        ? act(() => api.put(`/api/tenant/team/roles/${dialog.role!.key}/permissions`, { permissions: body.permissions }), 'Role updated.')
        : act(() => api.post('/api/tenant/team/roles', body), 'Custom role created.')} />}
    {dialog?.kind === 'delegate' && <DelegateDialog members={members} applications={applications} roles={roles} failure={failure}
      onClose={() => setDialog(null)} onSave={(body) => act(() => api.post('/api/tenant/delegations', body), 'Role delegated.')} />}

    <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
      <DialogTitle>{confirm?.title}</DialogTitle><DialogContent><Typography>{confirm?.body}</Typography></DialogContent>
      <DialogActions><Button onClick={() => setConfirm(null)}>Cancel</Button><Button color="warning" variant="contained" onClick={() => void confirm?.run()}>Confirm</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </Box>;
}

function FormDialog({ title, failure, problem, saving, onClose, onSave, children }: {
  title: string; failure: string; problem: string | null; saving: boolean; onClose: () => void; onSave: () => void; children: ReactNode;
}) {
  return <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{children}
      {problem && <Alert severity="warning">{problem}</Alert>}{failure && <Alert severity="error">{failure}</Alert>}</Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button>
      <Button variant="contained" disabled={saving || Boolean(problem)} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</Button></DialogActions>
  </Dialog>;
}

function useSaving(onSave: () => Promise<void>) {
  const [saving, setSaving] = useState(false);
  return { saving, save: async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } } };
}

function ApplicationSelect({ applications, value, onChange }: { applications: Application[]; value: string; onChange: (value: string) => void }) {
  return <FormControl fullWidth><InputLabel id="team-app">Application</InputLabel>
    <Select labelId="team-app" label="Application" value={value} onChange={(event) => onChange(event.target.value)}>
      {applications.map((app) => <MenuItem key={app.applicationCode} value={app.applicationCode}>{app.displayName}</MenuItem>)}
    </Select></FormControl>;
}

function safeExpiry(value: string): { iso: string | null; problem: string | null } {
  try { return { iso: expiryFromDateInput(value), problem: null }; } catch (error) { return { iso: null, problem: (error as Error).message }; }
}

function MemberDialog({ failure, onClose, onSave }: { failure: string; onClose: () => void; onSave: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const problem = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? null : 'Enter the email of an existing account.';
  const { saving, save } = useSaving(() => onSave(email.trim()));
  return <FormDialog title="Add member" failure={failure} problem={email ? problem : 'Enter the email of an existing account.'} saving={saving} onClose={onClose} onSave={() => void save()}>
    <TextField autoFocus required label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)}
      helperText="The person needs an account already. Invitations arrive with the next release." />
  </FormDialog>;
}

function RoleDialog({ member, applications, roles, failure, onClose, onSave }: {
  member: Member; applications: Application[]; roles: RoleTemplate[]; failure: string; onClose: () => void; onSave: (body: object) => Promise<void>;
}) {
  const [applicationCode, setApplicationCode] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [expiry, setExpiry] = useState('');
  const parsed = safeExpiry(expiry);
  const problem = applications.length === 0 ? 'Your client has no applications enabled.' : !applicationCode ? 'Choose the application this role is for.' : !roleKey ? 'Choose a role.' : parsed.problem;
  const { saving, save } = useSaving(() => onSave({ applicationCode, roleKey, expiresAt: parsed.iso }));
  return <FormDialog title={`Add a role for ${member.email}`} failure={failure} problem={problem} saving={saving} onClose={onClose} onSave={() => void save()}>
    <ApplicationSelect applications={applications} value={applicationCode} onChange={setApplicationCode} />
    <FormControl fullWidth><InputLabel id="team-role">Role</InputLabel>
      <Select labelId="team-role" label="Role" value={roleKey} onChange={(event) => setRoleKey(event.target.value)}>
        {roles.map((role) => <MenuItem key={role.key} value={role.key}>{role.name}{role.custom ? ' (custom)' : ''}</MenuItem>)}
      </Select></FormControl>
    <TextField label="Ends on (optional)" type="date" InputLabelProps={{ shrink: true }} value={expiry} onChange={(event) => setExpiry(event.target.value)}
      helperText="Leave empty for a standing role. Only roles within your own authority are listed." />
  </FormDialog>;
}

function PermissionDialog({ member, applications, groups, failure, onClose, onSave }: {
  member: Member; applications: Application[]; groups: PermissionGroup[]; failure: string; onClose: () => void; onSave: (body: object) => Promise<void>;
}) {
  const [applicationCode, setApplicationCode] = useState('');
  const [permissionKey, setPermissionKey] = useState('');
  const [reason, setReason] = useState('');
  const [expiry, setExpiry] = useState('');
  const parsed = safeExpiry(expiry);
  const options = useMemo(() => groups.flatMap((group) => group.permissions.filter((p) => p.grantable)), [groups]);
  const problem = !applicationCode ? 'Choose the application this permission is for.' : !permissionKey ? 'Choose a permission.' : !reason.trim() ? 'Say why this person needs it.' : parsed.problem;
  const { saving, save } = useSaving(() => onSave({ applicationCode, permissionKey, reason: reason.trim(), expiresAt: parsed.iso }));
  return <FormDialog title={`Grant a permission to ${member.email}`} failure={failure} problem={problem} saving={saving} onClose={onClose} onSave={() => void save()}>
    <ApplicationSelect applications={applications} value={applicationCode} onChange={setApplicationCode} />
    <FormControl fullWidth><InputLabel id="team-permission">Permission</InputLabel>
      <Select labelId="team-permission" label="Permission" value={permissionKey} onChange={(event) => setPermissionKey(event.target.value)}>
        {options.map((option) => <MenuItem key={option.key} value={option.key}>{option.key} — {option.description}</MenuItem>)}
      </Select></FormControl>
    <TextField required label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} inputProps={{ maxLength: 255 }} />
    <TextField label="Ends on (optional)" type="date" InputLabelProps={{ shrink: true }} value={expiry} onChange={(event) => setExpiry(event.target.value)} />
  </FormDialog>;
}

function CustomRoleDialog({ role, groups, failure, onClose, onSave }: {
  role?: RoleTemplate; groups: PermissionGroup[]; failure: string; onClose: () => void;
  onSave: (body: { key: string; name: string; description: string; permissions: string[] }) => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);
  const problem = !role && customRoleKeyProblem(key) ? customRoleKeyProblem(key)
    : !name.trim() ? 'Give the role a name.' : selected.length === 0 ? 'Choose at least one permission.' : null;
  const toggle = (permission: string) => setSelected((current) => current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission]);
  const { saving, save } = useSaving(() => onSave({ key: key.trim().toUpperCase(), name: name.trim(), description: description.trim(), permissions: selected }));
  return <FormDialog title={role ? `Edit ${role.name}` : 'New custom role'} failure={failure} problem={problem} saving={saving} onClose={onClose} onSave={() => void save()}>
    {!role && <TextField required label="Key" value={key} onChange={(event) => setKey(event.target.value.toUpperCase())} helperText="For example NIGHT_SHIFT." />}
    <TextField required label="Name" value={name} disabled={Boolean(role)} onChange={(event) => setName(event.target.value)} />
    {!role && <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />}
    <Box sx={{ maxHeight: 320, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
      {groups.map((group) => <Box key={group.group}><Typography variant="overline">{group.group}</Typography>
        {group.permissions.map((permission) => <FormControlLabel key={permission.key} sx={{ display: 'flex' }}
          control={<Checkbox size="small" checked={selected.includes(permission.key)} disabled={!permission.grantable} onChange={() => toggle(permission.key)} />}
          label={<Typography variant="body2">{permission.key} <Typography component="span" variant="caption" color="text.secondary">{permission.description}</Typography></Typography>} />)}
      </Box>)}
    </Box>
  </FormDialog>;
}

function DelegateDialog({ members, applications, roles, failure, onClose, onSave }: {
  members: Member[]; applications: Application[]; roles: RoleTemplate[]; failure: string; onClose: () => void; onSave: (body: object) => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  const [applicationCode, setApplicationCode] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [expiry, setExpiry] = useState('');
  const parsed = safeExpiry(expiry);
  const problem = !userId ? 'Choose who covers for you.' : !applicationCode ? 'Choose the application.' : !roleKey ? 'Choose the role to lend.' : parsed.problem ?? delegationExpiryProblem(parsed.iso);
  const { saving, save } = useSaving(() => onSave({ userId: Number(userId), applicationCode, roleKey, expiresAt: parsed.iso }));
  return <FormDialog title="Delegate one of my roles" failure={failure} problem={problem} saving={saving} onClose={onClose} onSave={() => void save()}>
    <FormControl fullWidth><InputLabel id="team-delegate">Member</InputLabel>
      <Select labelId="team-delegate" label="Member" value={userId} onChange={(event) => setUserId(event.target.value)}>
        {members.filter((m) => m.membershipStatus === 'ACTIVE').map((m) => <MenuItem key={m.userId} value={String(m.userId)}>{m.name} ({m.email})</MenuItem>)}
      </Select></FormControl>
    <ApplicationSelect applications={applications} value={applicationCode} onChange={setApplicationCode} />
    <FormControl fullWidth><InputLabel id="team-delegate-role">Role you hold</InputLabel>
      <Select labelId="team-delegate-role" label="Role you hold" value={roleKey} onChange={(event) => setRoleKey(event.target.value)}>
        {roles.filter((role) => role.key !== 'TENANT_OWNER').map((role) => <MenuItem key={role.key} value={role.key}>{role.name}</MenuItem>)}
      </Select></FormControl>
    <TextField required label="Ends on" type="date" InputLabelProps={{ shrink: true }} value={expiry} onChange={(event) => setExpiry(event.target.value)}
      helperText="At most 90 days. The loan ends early if you lose the role." />
  </FormDialog>;
}
