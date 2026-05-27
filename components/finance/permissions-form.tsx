"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, KeyRound, ShieldCheck, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";

import { saveProfilePermissions } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbFamilyMember } from "@/lib/finance/types";
import type { DbModulePermission, DbProfile, PermissionFormState } from "@/lib/finance/admin-types";
import { FINANCE_MODULES, PERMISSION_ACTIONS, PERMISSION_SCOPES } from "@/lib/finance/permissions";
import { cn } from "@/lib/utils";

const initialState: PermissionFormState = {};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PermissionsForm({
  profiles,
  permissions,
  members,
}: {
  profiles: DbProfile[];
  permissions: DbModulePermission[];
  members: DbFamilyMember[];
}) {
  const editableProfiles = profiles.filter((profile) => profile.role !== "admin");
  const [selectedProfileId, setSelectedProfileId] = useState(editableProfiles[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(saveProfilePermissions, initialState);

  const selectedProfile = editableProfiles.find((profile) => profile.id === selectedProfileId);
  const selectedPermissions = useMemo(
    () => permissions.filter((permission) => permission.profile_id === selectedProfileId),
    [permissions, selectedProfileId],
  );
  const visibleModulesCount = selectedPermissions.filter((permission) => permission.can_view).length;

  if (editableProfiles.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-[#080810]/60 p-6 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-[#8b72f8]/15 text-[#b09cff]">
          <UserRound className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-white">Nenhum usuário familiar cadastrado</p>
        <p className="mt-1 text-sm text-white/35">Cadastre um usuário familiar antes de configurar permissões.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" key={selectedProfileId}>
      <input type="hidden" name="profile_id" value={selectedProfileId} />

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8b72f8]/15 text-[#b09cff] shadow-lg shadow-[#8b72f8]/10">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Usuários</p>
              <p className="text-sm font-semibold text-white">Escolha um perfil</p>
            </div>
          </div>

          <div className="space-y-2">
            {editableProfiles.map((profile) => {
              const isSelected = profile.id === selectedProfileId;
              const profileVisibleCount = permissions.filter((permission) => permission.profile_id === profile.id && permission.can_view).length;

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-200",
                    isSelected
                      ? "border-[#8b72f8]/50 bg-[#8b72f8]/15 shadow-[0_14px_35px_rgba(139,114,248,0.18)]"
                      : "border-white/10 bg-[#080810]/50 hover:border-white/20 hover:bg-white/[0.055] hover:shadow-xl hover:shadow-black/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                      isSelected ? "bg-[#8b72f8] text-white" : "bg-white/10 text-white/45 group-hover:text-white",
                    )}
                  >
                    {initials(profile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
                    <p className="truncate text-xs text-white/35">{profileVisibleCount} módulo(s) visível(is)</p>
                  </div>
                  {isSelected ? <Check className="h-4 w-4 text-[#b09cff]" /> : null}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(139,114,248,0.13),transparent_35%),rgba(255,255,255,0.045)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl md:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8b72f8]/15 text-[#b09cff] shadow-lg shadow-[#8b72f8]/10">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Matriz de permissões</p>
                <p className="text-sm font-semibold text-white">
                  {selectedProfile?.name || "Perfil selecionado"}
                </p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/45">
              {visibleModulesCount}/{FINANCE_MODULES.length} visíveis
            </div>
          </div>

          <div className="grid gap-3">
            {FINANCE_MODULES.map((module) => {
              const modulePermission = selectedPermissions.find(
                (permission) => permission.module === module.key,
              );
              const enabledActions = PERMISSION_ACTIONS.filter((action) =>
                Boolean(modulePermission?.[action.key]),
              ).length;
              const scope = modulePermission?.scope ?? "own";
              const allowedMemberIds = modulePermission?.allowed_member_ids ?? [];

              return (
                <div
                  key={`${selectedProfileId}-${module.key}`}
                  className="rounded-[1.5rem] border border-white/10 bg-[#080810]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_45px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#10101a]/80 hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/55">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{module.label}</p>
                        <p className="truncate text-xs text-white/30">{module.key}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-white/40">
                      {enabledActions}/{PERMISSION_ACTIONS.length}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {PERMISSION_ACTIONS.map((action) => {
                      const inputId = `${selectedProfileId}.${module.key}.${action.key}`;

                      return (
                        <label
                          key={action.key}
                          htmlFor={inputId}
                          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white/55 transition duration-200 hover:border-[#8b72f8]/35 hover:bg-[#8b72f8]/10 hover:text-white"
                        >
                          <input
                            id={inputId}
                            type="checkbox"
                            name={`${module.key}.${action.key}`}
                            defaultChecked={Boolean(modulePermission?.[action.key])}
                            className="peer sr-only"
                          />
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#080810] text-transparent transition peer-checked:border-[#8b72f8] peer-checked:bg-[#8b72f8] peer-checked:text-white group-hover:border-[#8b72f8]/50">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium peer-checked:text-white">{action.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/25">
                      <UsersRound className="h-4 w-4" />
                      Escopo de dados
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {PERMISSION_SCOPES.map((scopeOption) => {
                        const inputId = `${selectedProfileId}.${module.key}.scope.${scopeOption.key}`;

                        return (
                          <label
                            key={scopeOption.key}
                            htmlFor={inputId}
                            className="group cursor-pointer rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-left transition hover:border-[#8b72f8]/35 hover:bg-[#8b72f8]/10"
                          >
                            <input
                              id={inputId}
                              type="radio"
                              name={`${module.key}.scope`}
                              value={scopeOption.key}
                              defaultChecked={scope === scopeOption.key}
                              className="peer sr-only"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-white/60 peer-checked:text-white">{scopeOption.label}</p>
                              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-transparent peer-checked:border-[#8b72f8] peer-checked:bg-[#8b72f8] peer-checked:text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-4 text-white/30">{scopeOption.description}</p>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                      <p className="text-xs font-semibold text-white/40">
                        Pessoas liberadas quando o escopo for selecionados
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {members.map((member) => {
                          const inputId = `${selectedProfileId}.${module.key}.member.${member.id}`;

                          return (
                            <label
                              key={member.id}
                              htmlFor={inputId}
                              className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white/55 transition hover:border-[#8b72f8]/35 hover:bg-[#8b72f8]/10"
                            >
                              <input
                                id={inputId}
                                type="checkbox"
                                name={`${module.key}.allowed_member_ids`}
                                value={member.id}
                                defaultChecked={allowedMemberIds.includes(member.id)}
                                className="peer sr-only"
                              />
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#080810] text-transparent transition peer-checked:border-[#8b72f8] peer-checked:bg-[#8b72f8] peer-checked:text-white group-hover:border-[#8b72f8]/50">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate font-medium peer-checked:text-white">{member.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className="sticky bottom-24 z-20 flex justify-end md:bottom-6">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-2xl bg-[#8b72f8] px-6 font-semibold text-white shadow-[0_18px_45px_rgba(139,114,248,0.28)] hover:bg-[#7d66e4]"
        >
          {isPending ? "Salvando..." : "Salvar permissões"}
        </Button>
      </div>
    </form>
  );
}
