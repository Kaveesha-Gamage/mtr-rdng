import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import db from '../database/db';

const logDirectoryContents = async (dir: string, label: string) => {
  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    console.log(`[exportDatabase] Directory contents of ${label} (${dir}):`, files);
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(dir + file);
      if (fileInfo.exists) {
        console.log(`  - ${file}: isDirectory=${fileInfo.isDirectory}, size=${fileInfo.size} bytes`);
        if (fileInfo.isDirectory) {
          const subFiles = await FileSystem.readDirectoryAsync(dir + file + '/');
          console.log(`    Sub-files of ${file}:`, subFiles);
        }
      } else {
        console.log(`  - ${file}: does not exist`);
      }
    }
  } catch (err) {
    console.error(`[exportDatabase] Failed to read directory ${label}:`, err);
  }
};

export const exportDatabase = async () => {
  try {
    // 1. Flush WAL writes to the main bill.db file
    try {
      db.execSync('PRAGMA wal_checkpoint(FULL);');
      console.log('[exportDatabase] Checkpoint successful.');
    } catch (walErr) {
      console.warn('[exportDatabase] WAL checkpoint warning:', walErr);
    }

    // Diagnostic: Log document and cache directories
    if (FileSystem.documentDirectory) {
      await logDirectoryContents(FileSystem.documentDirectory, 'documentDirectory');
    }
    if (FileSystem.cacheDirectory) {
      await logDirectoryContents(FileSystem.cacheDirectory, 'cacheDirectory');
    }

    const dbPath = FileSystem.documentDirectory + 'SQLite/bill.db';
    console.log('[exportDatabase] Exporting from:', dbPath);

    const info = await FileSystem.getInfoAsync(dbPath);
    if (!info.exists) {
      Alert.alert('Export Error', 'Database file not found at: ' + dbPath);
      return;
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Export Error', 'File sharing is not available on this device.');
      return;
    }

    const exportPath = FileSystem.cacheDirectory + 'bill.db';
    await FileSystem.copyAsync({
      from: dbPath,
      to: exportPath,
    });

    await Sharing.shareAsync(exportPath, {
      mimeType: 'application/x-sqlite3',
      dialogTitle: 'Export Database (bill.db)',
      UTI: 'public.database',
    });
  } catch (e) {
    console.error('[exportDatabase] EXPORT ERROR:', e);
    Alert.alert('Export Failed', 'An error occurred while exporting the database.');
  }
};