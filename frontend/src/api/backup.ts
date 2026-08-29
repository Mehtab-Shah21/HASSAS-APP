import { apiClient } from "./client";

export interface BackupFileInfo {
  filename: string;
  size_bytes: number;
  created_at: string;
}

export async function getBackupSettings(): Promise<{ backup_folder: string | null }> {
  const res = await apiClient.get<{ backup_folder: string | null }>("/api/backup/settings");
  return res.data;
}

export async function setBackupFolder(folder: string): Promise<void> {
  await apiClient.patch("/api/backup/settings", { backup_folder: folder });
}

export async function runBackup(): Promise<BackupFileInfo> {
  const res = await apiClient.post<BackupFileInfo>("/api/backup/run");
  return res.data;
}

export async function listBackups(): Promise<BackupFileInfo[]> {
  const res = await apiClient.get<BackupFileInfo[]>("/api/backup/list");
  return res.data;
}

export async function restoreBackup(filename: string): Promise<{ ok: boolean; message: string }> {
  const res = await apiClient.post("/api/backup/restore", { filename, confirm: true });
  return res.data;
}
