import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { getUsers, inviteUser, setUserStatus, updateUser, type StaffUser, type UserInput } from "@/api/users";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "@/components/Snackbar";
import { DataTableToolbar, FilterSetSelect, Table, TableBody, TableCell, TableHead, TableHeadCell, TableHeader, TableRow } from "@/components/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBranch } from "@/lib/branch-context";
import { BRANCHES } from "@/lib/branches";
import { QK } from "@/lib/query-keys";
import { ROLES } from "@/lib/roles";
import { UserSheet } from "@/sections/users/UserSheet";

const STATUS_TONE: Record<StaffUser["status"], "success" | "info" | "secondary"> = { Active: "success", Invited: "info", Deactivated: "secondary" };

export default function UserManagement() {
  const { branch } = useBranch();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: QK.users(), queryFn: getUsers });
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState<StaffUser | "new" | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: QK.users() });

  const save = useMutation({
    mutationFn: async (input: UserInput) => {
      if (target === "new" || !target) await inviteUser(input);
      else await updateUser(target.id, input);
    },
    onSuccess: (_, input) => {
      void refresh();
      show(target === "new" ? `Invite sent to ${input.email}.` : `${input.name} updated.`);
      setTarget(null);
    },
  });
  const statusM = useMutation({
    mutationFn: ({ id, next }: { id: string; next: StaffUser["status"]; prev: StaffUser["status"]; name: string }) => setUserStatus(id, next),
    onSuccess: (_, { id, next, prev, name }) => {
      void refresh();
      if (next === "Deactivated")
        show(`${name} can no longer sign in.`, { label: "Undo", onClick: () => statusM.mutate({ id, next: prev, prev: next, name }) });
      else show(`${name} is active again.`);
    },
  });

  const term = q.trim().toLowerCase();
  const rows = useMemo(
    () =>
      users.filter(
        (u) =>
          (!branch || u.branches.includes(branch as never)) &&
          (!role || u.role === role) &&
          (!status || u.status === status) &&
          (!term || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(term)),
      ),
    [users, branch, role, status, term],
  );

  return (
    <>
      <PageHeader
        actions={
          <Button onClick={() => setTarget("new")}>
            <UserPlus /> Invite user
          </Button>
        }
      />

      <section className="rounded-lg border bg-card">
        <DataTableToolbar search={{ value: q, onChange: setQ, placeholder: "Search name, email or phone" }}>
          <FilterSetSelect label="Role" value={role} onChange={setRole} options={[{ value: "", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: r }))]} className="w-44" />
          <FilterSetSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: "", label: "All statuses" }, ...(["Active", "Invited", "Deactivated"] as const).map((s) => ({ value: s, label: s }))]}
            className="w-40"
          />
        </DataTableToolbar>
        {rows.length === 0 ? (
          <EmptyState className="m-4 border-0" title="No users match" description="Clear a filter or search for someone else." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableHead>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Role</TableHeadCell>
                  <TableHeadCell>Branches</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Last seen</TableHeadCell>
                  <TableHeadCell />
                </TableHead>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="block font-medium">{u.name}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.branches.length === BRANCHES.length ? "All branches" : u.branches.map((b) => BRANCHES.find((x) => x.id === b)?.name).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[u.status]}>{u.status}</Badge>
                    </TableCell>
                    <TableCell className="tabular text-[13px] text-muted-foreground">{u.lastSeen}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setTarget(u)}>
                          Edit
                        </Button>
                        {u.role !== "Owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`More actions for ${u.name}`} />}>
                              <MoreHorizontal />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {u.status === "Invited" && <DropdownMenuItem onClick={() => show(`Invite re-sent to ${u.email}.`)}>Resend invite</DropdownMenuItem>}
                              {u.status === "Active" && <DropdownMenuItem onClick={() => show(`PIN reset link sent to ${u.email}.`)}>Send PIN reset link</DropdownMenuItem>}
                              {u.status !== "Deactivated" ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => statusM.mutate({ id: u.id, next: "Deactivated", prev: u.status, name: u.name })}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => statusM.mutate({ id: u.id, next: "Active", prev: u.status, name: u.name })}>Reactivate</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <UserSheet target={target} onClose={() => setTarget(null)} onSave={(input) => save.mutate(input)} saving={save.isPending} />
    </>
  );
}
