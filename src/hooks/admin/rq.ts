// hooks/admin/rq.ts
"use client";
import {
  keepPreviousData, useMutation, UseMutationOptions,
  useQuery, UseQueryOptions, useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";

type Endpoint<P = any> = string | ((p: P) => string);
const resolvePath = <P = any>(path: Endpoint<P>, params?: P) =>
  typeof path === "function" ? (path as (p: P) => string)(params as P) : path;

export type RestConfig<TList, TItem, TListQuery = any, TCreateDto = any, TUpdateDto = any> = {
  key: string;
  list?:   { path: Endpoint };
  detail?: { path: Endpoint };
  create?: { path: Endpoint; method?: "post" | "put";  mapPayload?: (dto: TCreateDto) => any };
  update?: { path: Endpoint; method?: "patch" | "put"; mapPayload?: (dto: TUpdateDto) => any };
  remove?: { path: Endpoint; method?: "delete" };
  staleTime?: number;
  extract?: <R = any, T = any>(raw: R) => T; // unwrap ResponseCommon, v.v.
};

export function createRestHooks<TList, TItem, TListQuery = any, TCreateDto = any, TUpdateDto = any>(
  cfg: RestConfig<TList, TItem, TListQuery, TCreateDto, TUpdateDto>
) {
  const staleTime = cfg.staleTime ?? 30_000;
  const pick = cfg.extract ?? ((x: any) => x); // không generic

  const useListQuery = (params: TListQuery, options?: UseQueryOptions<TList, Error>) =>
    useQuery<TList, Error>({
      queryKey: [cfg.key, "list", params],
      queryFn: async () => {
        const url = resolvePath(cfg.list!.path, params as any);
        const { data } = await api.get(url, { params });
        return (pick as (v: unknown) => unknown)(data) as TList;
      },
      placeholderData: keepPreviousData,
      staleTime,
      ...(options || {}),
      enabled: options?.enabled ?? true,
    });

  const useDetailQuery = (args: any, options?: UseQueryOptions<TItem, Error>) =>
    useQuery<TItem, Error>({
      queryKey: [cfg.key, "detail", args],
      queryFn: async () => {
        const url = resolvePath(cfg.detail!.path, args);
        const { data } = await api.get(url);
        return (pick as (v: unknown) => unknown)(data) as TItem;
      },
      staleTime,
      ...(options || {}),
      enabled: (options?.enabled ?? true) && Boolean(args && Object.values(args).every(v => v !== undefined)),
    });

  const useCreateMutation = (options?: UseMutationOptions<any, Error, TCreateDto>) => {
    const qc = useQueryClient();
    return useMutation<any, Error, TCreateDto>({
      mutationFn: async (dto) => {
        const url = resolvePath(cfg.create!.path, dto as any);
        const body = cfg.create!.mapPayload ? cfg.create!.mapPayload(dto) : dto;
        const method = cfg.create!.method ?? "post";
        const { data } = await api.request({ url, method, data: body });
        return (pick as (v: unknown) => unknown)(data);
      },
      onSuccess: (...a) => {
        qc.invalidateQueries({ queryKey: [cfg.key] });
        (options as any)?.onSuccess?.(...a);
      },
      ...(options || {}),
    });
  };

  const useUpdateMutation = (options?: UseMutationOptions<any, Error, { args: any; data: TUpdateDto }>) => {
    const qc = useQueryClient();
    return useMutation<any, Error, { args: any; data: TUpdateDto }>({
      mutationFn: async ({ args, data }) => {
        const url = resolvePath(cfg.update!.path, args);
        const body = cfg.update!.mapPayload ? cfg.update!.mapPayload(data) : data;
        const method = cfg.update!.method ?? "patch";
        const res = await api.request({ url, method, data: body });
        return (pick as (v: unknown) => unknown)(res.data);
      },
      onSuccess: (...a) => {
        qc.invalidateQueries({ queryKey: [cfg.key] });
        (options as any)?.onSuccess?.(...a);
      },
      ...(options || {}),
    });
  };

  const useRemoveMutation = (options?: UseMutationOptions<any, Error, any>) => {
    const qc = useQueryClient();
    return useMutation<any, Error, any>({
      mutationFn: async (args) => {
        const url = resolvePath(cfg.remove!.path, args);
        const method = cfg.remove!.method ?? "delete";
        const res = await api.request({ url, method });
        return (pick as (v: unknown) => unknown)(res.data);
      },
      onSuccess: (...a) => {
        qc.invalidateQueries({ queryKey: [cfg.key] });
        (options as any)?.onSuccess?.(...a);
      },
      ...(options || {}),
    });
  };

  return { useListQuery, useDetailQuery, useCreateMutation, useUpdateMutation, useRemoveMutation };
}
